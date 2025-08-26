import { Page } from 'playwright';
import { NavigationService } from './navigation.service';
import { CaseStatusService } from './case-status.service';
import { SupabaseLogService } from './supabase-log.service';
import { WorkflowState, ProcessingMode, ProcessingResult } from '../types';

export class OnHoldWorkflowService {
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
    console.log('[ON-HOLD-WORKFLOW] Page instance set successfully');
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
      console.error('[ON-HOLD-WORKFLOW] Cannot start - not authenticated');
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
          console.log('[ON-HOLD-WORKFLOW] Browser closed successfully');
        }
      } catch (error) {
        console.error('[ON-HOLD-WORKFLOW] Error closing browser:', error);
      }
      this.page = null;
    }
  }
  
  getState(): WorkflowState {
    return { ...this.state };
  }
  
  private async runWorkflow(): Promise<void> {
    try {
      console.log('[ON-HOLD-WORKFLOW] Starting workflow...');
      
      // Navigate to Pending On Hold page
      const navSuccess = await this.navigationService.navigateToPendingOnHold();
      if (!navSuccess) {
        this.state.errors.push('Failed to navigate to Pending On Hold page');
        this.state.status = 'error';
        return;
      }
      
      // Wait for page load
      await this.delay(2000);
      
      // Get case list
      const caseIds = await this.navigationService.extractCaseList();
      this.state.totalCount = caseIds.length;
      
      console.log(`[ON-HOLD-WORKFLOW] Found ${caseIds.length} cases to process`);
      
      if (caseIds.length === 0) {
        this.state.status = 'completed';
        this.state.endTime = new Date();
        console.log('[ON-HOLD-WORKFLOW] No cases found - workflow completed');
        return;
      }
      
      // Process each case
      for (const caseId of caseIds) {
        if (this.stopRequested) {
          console.log('[ON-HOLD-WORKFLOW] Stop requested - ending workflow');
          break;
        }
        
        while (this.pauseRequested && !this.stopRequested) {
          await this.delay(1000);
        }
        
        this.state.currentCase = caseId;
        console.log(`[ON-HOLD-WORKFLOW] Processing case ${caseId}`);
        
        const result = await this.processCase(caseId);
        
        if (result.success) {
          this.state.processedCount++;
          console.log(`[ON-HOLD-WORKFLOW] Successfully processed case ${caseId}`);
        } else {
          this.state.errors.push(result.message);
          console.error(`[ON-HOLD-WORKFLOW] Failed to process case ${caseId}: ${result.message}`);
        }
        
        // Return to case list
        await this.navigationService.closeCurrentTab();
        await this.navigationService.navigateToPendingOnHold();
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
      
      console.log('[ON-HOLD-WORKFLOW] Workflow completed');
      
    } catch (error) {
      this.state.status = 'error';
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.state.errors.push(errorMsg);
      console.error('[ON-HOLD-WORKFLOW] Workflow error:', error);
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
      
      await this.delay(2000);
      
      // Extract case details before change
      const beforeDetails = await this.caseStatusService.extractCaseDetails();
      
      // Change status to Hold
      const changeSuccess = await this.caseStatusService.changeStatusToHold();
      if (!changeSuccess) {
        return {
          success: false,
          caseId,
          message: `Failed to change status for case ${caseId}`
        };
      }
      
      await this.delay(1000);
      
      // Verify change
      const verified = await this.caseStatusService.verifyStatusChange();
      
      // Log to database
      await this.logService.logCaseProcessing({
        case_id: caseId,
        vin_number: beforeDetails?.vin,
        previous_status: 'Pending On Hold',
        new_status: 'Hold',
        action_taken: verified ? 'status_changed' : 'failed',
        processing_mode: this.state.mode,
        processed_by: 'system',
        notes: verified ? 'Successfully changed to Hold' : 'Status change failed'
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