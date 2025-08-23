import { useState, useEffect, useCallback } from 'react';
import { Page } from 'playwright';
import { WorkflowState, ProcessingMode } from '../types';
import { OnHoldWorkflowService } from '../services/on-hold-workflow.service';

export function useWorkflowState() {
  const [workflowService] = useState(() => new OnHoldWorkflowService());
  const [state, setState] = useState<WorkflowState>({
    status: 'idle',
    mode: 'manual',
    currentCase: null,
    processedCount: 0,
    totalCount: 0,
    errors: [],
    startTime: null,
    endTime: null
  });
  
  const [isPolling, setIsPolling] = useState(false);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPolling) {
      interval = setInterval(() => {
        const currentState = workflowService.getState();
        setState(currentState);
        
        if (currentState.status === 'completed' || currentState.status === 'error') {
          setIsPolling(false);
        }
      }, 500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPolling, workflowService]);
  
  const startWorkflow = useCallback(async (mode: ProcessingMode) => {
    setIsPolling(true);
    await workflowService.startWorkflow(mode);
  }, [workflowService]);
  
  const pauseWorkflow = useCallback(() => {
    workflowService.pauseWorkflow();
    setState(workflowService.getState());
  }, [workflowService]);
  
  const resumeWorkflow = useCallback(() => {
    workflowService.resumeWorkflow();
    setState(workflowService.getState());
  }, [workflowService]);
  
  const stopWorkflow = useCallback(() => {
    workflowService.stopWorkflow();
    setIsPolling(false);
    setState(workflowService.getState());
  }, [workflowService]);
  
  const continueToNext = useCallback(async () => {
    await workflowService.continueToNext();
  }, [workflowService]);
  
  const checkAuthentication = useCallback(() => {
    return workflowService.isAuthenticated();
  }, [workflowService]);
  
  const setPageInstance = useCallback((page: Page) => {
    workflowService.setPage(page);
    console.log('[ON-HOLD] Page instance set in workflow state');
  }, [workflowService]);
  
  return {
    state,
    startWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    stopWorkflow,
    continueToNext,
    checkAuthentication,
    setPageInstance,
    isProcessing: state.status === 'processing',
    isPaused: state.status === 'paused',
    isCompleted: state.status === 'completed',
    hasErrors: state.errors.length > 0
  };
}