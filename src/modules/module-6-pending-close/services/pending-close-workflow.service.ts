import { Page } from 'playwright';
import { NavigationService } from './navigation.service';
import { CaseStatusService } from './case-status.service';
import { SupabaseLogService } from './supabase-log.service';
import { WorkflowState, ProcessingMode, ProcessingResult } from '../types';

export class PendingCloseWorkflowService {
  private navigationService = new NavigationService();
  private caseStatusService = new CaseStatusService();
  private logService = new SupabaseLogService();
  private page: Page | null = null;
  
  private state: WorkflowState = {
    status: 'idle',
    mode: 'manual',
    currentCase: null,
    processedCount: 0,
    totalCount: 0,
    errors: [],
    startTime: null,
    endTime: null
  };
  
  private stopRequested = false;
  private pauseRequested = false;
  
  /**
   * Set the Playwright page instance from Module 1
   */
  setPage(page: Page) {
    this.page = page;
    this.navigationService.setPage(page);
    this.caseStatusService.setPage(page);
    console.log('[PENDING-CLOSE-WORKFLOW] Page instance set successfully');
  }
  
  /**
   * Check if page is initialized (authenticated)
   */
  isAuthenticated(): boolean {
    return this.page !== null;
  }
  
  async startWorkflow(mode: ProcessingMode): Promise<void> {
    if (!this.page) {
      this.state.status = 'error';
      this.state.errors.push('Not authenticated. Please login via Module 1 first.');
      console.error('[PENDING-CLOSE-WORKFLOW] Cannot start - not authenticated');
      return;
    }
    
    this.state = {
      status: 'processing',
      mode,
      currentCase: null,
      processedCount: 0,
      totalCount: 0,
      errors: [],
      startTime: new Date(),
      endTime: null
    };
    
    this.stopRequested = false;
    this.pauseRequested = false;
    
    await this.runWorkflow();
  }
  
  pauseWorkflow(): void {
    this.pauseRequested = true;
    this.state.status = 'paused';
  }
  
  resumeWorkflow(): void {
    this.pauseRequested = false;
    this.state.status = 'processing';
  }
  
  async stopWorkflow(): Promise<void> {
    this.stopRequested = true;
    this.state.status = 'idle';
    this.state.endTime = new Date();
    
    // Close browser instance
    if (this.page) {
      try {
        const browser = this.page.context().browser();
        if (browser) {
          await browser.close();
          console.log('[PENDING-CLOSE-WORKFLOW] Browser closed successfully');
        }
      } catch (error) {
        console.error('[PENDING-CLOSE-WORKFLOW] Error closing browser:', error);
      }
      this.page = null;
    }
  }
  
  getState(): WorkflowState {
    return { ...this.state };
  }
  
  private async runWorkflow(): Promise<void> {
    try {
      console.log('[PENDING-CLOSE-WORKFLOW] Starting workflow...');
      
      // Navigate to Pending Close page
      const navSuccess = await this.navigationService.navigateToPendingClose();
      if (!navSuccess) {
        this.state.errors.push('Failed to navigate to Pending Close page');
        this.state.status = 'error';
        return;
      }
      
      // Wait for page load
      await this.delay(2000);
      
      // Get case list
      const caseIds = await this.navigationService.extractCaseList();
      this.state.totalCount = caseIds.length;
      
      console.log(`[PENDING-CLOSE-WORKFLOW] Found ${caseIds.length} cases to process`);
      
      if (caseIds.length === 0) {
        this.state.status = 'completed';
        this.state.endTime = new Date();
        console.log('[PENDING-CLOSE-WORKFLOW] No cases found - workflow completed');
        return;
      }
      
      // Process each case
      for (const caseId of caseIds) {
        if (this.stopRequested) {
          console.log('[PENDING-CLOSE-WORKFLOW] Stop requested - ending workflow');
          break;
        }
        
        while (this.pauseRequested && !this.stopRequested) {
          await this.delay(1000);
        }
        
        this.state.currentCase = caseId;
        console.log(`[PENDING-CLOSE-WORKFLOW] Processing case ${caseId}`);
        
        const result = await this.processCase(caseId);
        
        if (result.success) {
          this.state.processedCount++;
          console.log(`[PENDING-CLOSE-WORKFLOW] Successfully processed case ${caseId}`);
        } else {
          this.state.errors.push(result.message);
          console.error(`[PENDING-CLOSE-WORKFLOW] Failed to process case ${caseId}: ${result.message}`);
        }
        
        // Return to case list
        await this.navigationService.closeCurrentTab();
        await this.navigationService.navigateToPendingClose();
        await this.delay(1000);
        
        // Delay between cases
        if (this.state.mode === 'automatic') {
          await this.delay(2000);
        } else {
          // In manual mode, pause and wait for user to continue
          this.pauseRequested = true;
          this.state.status = 'paused';
          await this.waitForManualContinue();
        }
      }
      
      this.state.status = 'completed';
      this.state.endTime = new Date();
      await this.logService.flushBatch();
      
      console.log('[PENDING-CLOSE-WORKFLOW] Workflow completed');
      
    } catch (error) {
      this.state.status = 'error';
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.state.errors.push(errorMsg);
      console.error('[PENDING-CLOSE-WORKFLOW] Workflow error:', error);
    }
  }
  
  private async processCase(caseId: string): Promise<ProcessingResult> {
    try {
      // Open case detail
      const openSuccess = await this.navigationService.openCaseDetail(caseId);
      if (!openSuccess) {
        return {
          success: false,
          caseId,
          message: `Failed to open case ${caseId}`
        };
      }
      
      // Update all services with the new page (case detail tab)
      const currentPage = this.navigationService.getCurrentPage();
      if (currentPage) {
        console.log(`[PENDING-CLOSE-WORKFLOW] Got current page from navigation: ${currentPage.url()}`);
        this.caseStatusService.setPage(currentPage);
        this.page = currentPage; // Update workflow service page reference too
        console.log(`[PENDING-CLOSE-WORKFLOW] Updated all services with new tab page`);
      } else {
        console.error('[PENDING-CLOSE-WORKFLOW] Failed to get current page from navigation service');
      }
      
      // Wait for page to be fully loaded
      await currentPage.waitForLoadState('networkidle');
      
      // Extract case details before change
      const beforeDetails = await this.caseStatusService.extractCaseDetails();
      
      // Change status to Close
      const changeSuccess = await this.caseStatusService.changeStatusToClose();
      if (!changeSuccess) {
        return {
          success: false,
          caseId,
          message: `Failed to change status for case ${caseId}`
        };
      }
      
      // Verify change (page already loaded in changeStatusToClose)
      const verified = await this.caseStatusService.verifyStatusChange();
      
      // Log to database
      await this.logService.logCaseProcessing({
        case_id: caseId,
        vin_number: beforeDetails?.vin,
        previous_status: 'Pending Close',
        new_status: 'Close',
        action_taken: verified ? 'status_changed' : 'failed',
        processing_mode: this.state.mode,
        processed_by: 'system',
        notes: verified ? 'Successfully changed to Close' : 'Status change failed'
      });
      
      return {
        success: verified,
        caseId,
        message: verified ? 'Success' : 'Verification failed'
      };
      
    } catch (error) {
      return {
        success: false,
        caseId,
        message: error instanceof Error ? error.message : 'Processing error',
        error: error instanceof Error ? error.message : undefined
      };
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private waitForManualContinue(): Promise<void> {
    return new Promise(resolve => {
      const checkContinue = setInterval(() => {
        if (!this.pauseRequested || this.stopRequested) {
          clearInterval(checkContinue);
          resolve();
        }
      }, 500);
    });
  }
  
  async continueToNext(): Promise<void> {
    if (this.state.mode === 'manual' && this.state.status === 'paused') {
      this.resumeWorkflow();
    }
  }
}