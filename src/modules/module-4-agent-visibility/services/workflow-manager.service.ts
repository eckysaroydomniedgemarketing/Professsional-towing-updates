import { Page } from 'playwright';
import { rdnVisibilityService } from './rdn-visibility.service';
import { visibilityLogService } from './visibility-log.service';
import type { WorkflowState, WorkflowConfig, ProcessCaseResult } from '../types';

class WorkflowManagerService {
  private state: WorkflowState = {
    isRunning: false,
    currentCaseId: null,
    mode: 'manual',
    processedCount: 0,
    totalProcessed: 0,
    currentStatus: 'idle',
    error: undefined
  };

  private config: WorkflowConfig = {
    mode: 'manual',
    continueOnError: true,
    minPageLoadTime: 30
  };

  private mainPage: Page | null = null;
  private abortController: AbortController | null = null;
  private stateChangeCallbacks: ((state: WorkflowState) => void)[] = [];

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: WorkflowState) => void) {
    this.stateChangeCallbacks.push(callback);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Update state and notify subscribers
   */
  private updateState(updates: Partial<WorkflowState>) {
    this.state = { ...this.state, ...updates };
    this.stateChangeCallbacks.forEach(cb => cb(this.state));
  }

  /**
   * Get current workflow state
   */
  getState(): WorkflowState {
    return { ...this.state };
  }

  /**
   * Set workflow configuration
   */
  setConfig(config: Partial<WorkflowConfig>) {
    this.config = { ...this.config, ...config };
    if (config.mode) {
      this.updateState({ mode: config.mode });
    }
  }

  /**
   * Initialize workflow with RDN page
   */
  initialize(page: Page) {
    this.mainPage = page;
    rdnVisibilityService.setPage(page);
  }

  /**
   * Start the visibility workflow
   */
  async startWorkflow(): Promise<void> {
    if (this.state.isRunning) {
      console.log('Workflow is already running');
      return;
    }

    if (!this.mainPage) {
      throw new Error('Workflow not initialized. Call initialize() first.');
    }

    this.abortController = new AbortController();
    this.updateState({
      isRunning: true,
      currentStatus: 'navigating',
      processedCount: 0,
      mode: this.config.mode,
      error: undefined
    });

    try {
      // Navigate to new updates page
      const navigated = await rdnVisibilityService.navigateToNewUpdates();
      
      if (!navigated) {
        throw new Error('Failed to navigate to new updates page');
      }

      // Process cases based on mode
      if (this.config.mode === 'automatic') {
        await this.processAutomatically();
      } else {
        await this.processManually();
      }
    } catch (error) {
      console.error('Workflow error:', error);
      this.updateState({
        currentStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.updateState({
        isRunning: false,
        currentCaseId: null,
        currentStatus: 'completed'
      });
    }
  }

  /**
   * Process cases automatically
   */
  private async processAutomatically(): Promise<void> {
    while (!this.abortController?.signal.aborted) {
      const processed = await this.processNextCase();
      
      if (!processed) {
        // No more cases to process
        break;
      }

      // Small delay between cases
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  /**
   * Process cases manually (one at a time)
   */
  private async processManually(): Promise<void> {
    // Process just one case and wait for user action
    await this.processNextCase();
  }

  /**
   * Process the next case in the queue
   */
  async processNextCase(): Promise<boolean> {
    if (!this.mainPage) {
      console.error('Main page not initialized');
      return false;
    }

    try {
      this.updateState({ currentStatus: 'processing' });

      // Get first case from list
      const caseId = await rdnVisibilityService.getFirstCase();
      
      if (!caseId) {
        console.log('No more cases to process');
        return false;
      }

      this.updateState({ currentCaseId: caseId });

      // Check if case was already processed today with timeout
      let skipCase = false;
      try {
        const checkPromise = visibilityLogService.isCaseProcessedToday(caseId);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database check timeout')), 3000)
        );
        
        const result = await Promise.race([checkPromise, timeoutPromise]) as any;
        skipCase = result?.exists || false;
      } catch (checkError) {
        console.warn(`Could not check if case ${caseId} was processed today:`, checkError);
        // Continue processing if check fails
        skipCase = false;
      }
      
      if (skipCase) {
        console.log(`Case ${caseId} already processed today, skipping`);
        
        // Try to log as skipped (non-critical)
        try {
          await visibilityLogService.logCaseVisibilityUpdate(
            caseId,
            0,
            this.config.mode,
            undefined,
            undefined
          );
        } catch (logError) {
          console.warn('Could not log skipped case:', logError);
        }
        
        return true; // Continue to next case
      }

      // Open case in new tab
      const casePage = await rdnVisibilityService.openCaseInNewTab(caseId);
      
      if (!casePage) {
        throw new Error(`Failed to open case ${caseId}`);
      }

      // Process the case
      const result = await rdnVisibilityService.processCase(casePage, caseId);
      
      // Log to database with error handling
      try {
        await visibilityLogService.logCaseVisibilityUpdate(
          result.caseId,
          result.updatesProcessed,
          this.config.mode,
          result.company,
          result.updateText
        );
      } catch (logError) {
        console.error('Error logging visibility update:', logError);
        // Continue processing even if logging fails
      }

      // Update state
      this.updateState({
        processedCount: this.state.processedCount + 1,
        totalProcessed: this.state.totalProcessed + result.updatesProcessed
      });

      // Close case tab
      await rdnVisibilityService.closeCaseTab(casePage);

      // Navigate back to new updates page if needed
      if (this.mainPage.url() !== 'https://app.recoverydatabase.net/v2/main/new_updates.php?case_worker=ALL&order=priority&type=ALL&days_since_update=all&case_status%5B%5D=Open') {
        await rdnVisibilityService.navigateToNewUpdates();
      }

      return result.success;
    } catch (error) {
      console.error('Error processing next case:', error);
      
      if (!this.config.continueOnError) {
        throw error;
      }
      
      return false;
    }
  }

  /**
   * Stop the workflow
   */
  stopWorkflow(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    
    this.updateState({
      isRunning: false,
      currentStatus: 'idle'
    });
  }

  /**
   * Reset workflow state
   */
  reset(): void {
    this.state = {
      isRunning: false,
      currentCaseId: null,
      mode: 'manual',
      processedCount: 0,
      totalProcessed: 0,
      currentStatus: 'idle',
      error: undefined
    };
    
    this.mainPage = null;
    this.abortController = null;
  }
}

export const workflowManagerService = new WorkflowManagerService();