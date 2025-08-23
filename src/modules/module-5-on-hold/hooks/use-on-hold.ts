import { useState, useEffect, useCallback } from 'react';
import { SupabaseLogService } from '../services/supabase-log.service';
import { ProcessingMode, WorkflowState } from '../types';
import { exportToCsv as exportUtil } from '../utils/csv-export';

export function useOnHold() {
  const [logService] = useState(() => new SupabaseLogService());
  const [processedCases, setProcessedCases] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ProcessingMode>('manual');
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
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
  
  // Poll for workflow status when running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPolling) {
      interval = setInterval(async () => {
        try {
          const response = await fetch('/api/module-5/status');
          if (response.ok) {
            const data = await response.json();
            setWorkflowState(data.state);
            
            // Stop polling if workflow is completed or has errors
            if (data.state.status === 'completed' || data.state.status === 'error') {
              setIsPolling(false);
            }
          }
        } catch (error) {
          console.error('[ON-HOLD] Error polling status:', error);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPolling]);
  
  const loadProcessedCases = useCallback(async () => {
    setIsLoading(true);
    try {
      const cases = await logService.getProcessedCases();
      setProcessedCases(cases);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setIsLoading(false);
    }
  }, [logService]);
  
  const loadStats = useCallback(async () => {
    try {
      const todayStats = await logService.getTodayStats();
      setStats(todayStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [logService]);
  
  useEffect(() => {
    loadProcessedCases();
    loadStats();
  }, [loadProcessedCases, loadStats]);
  
  useEffect(() => {
    if (workflowState.status === 'completed') {
      loadProcessedCases();
      loadStats();
    }
  }, [workflowState.status, loadProcessedCases, loadStats]);
  
  const handleStart = useCallback(async () => {
    try {
      const response = await fetch('/api/module-5/start-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedMode })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[ON-HOLD] Failed to start workflow:', error);
        alert(error.details || 'Failed to start workflow');
        return;
      }
      
      const data = await response.json();
      setWorkflowState(data.state);
      setIsPolling(true);
    } catch (error) {
      console.error('[ON-HOLD] Error starting workflow:', error);
      alert('Failed to start workflow');
    }
  }, [selectedMode]);
  
  const handlePause = useCallback(() => {
    // Pause/Resume is handled within the workflow service
    // This is a placeholder for UI state management
    if (workflowState.status === 'processing') {
      setWorkflowState(prev => ({ ...prev, status: 'paused' }));
    } else if (workflowState.status === 'paused') {
      setWorkflowState(prev => ({ ...prev, status: 'processing' }));
    }
  }, [workflowState.status]);
  
  const handleStop = useCallback(async () => {
    try {
      const response = await fetch('/api/module-5/stop', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkflowState(data.state);
        setIsPolling(false);
      }
    } catch (error) {
      console.error('[ON-HOLD] Error stopping workflow:', error);
    }
  }, []);
  
  const handleNextCase = useCallback(async () => {
    try {
      const response = await fetch('/api/module-5/continue', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkflowState(data.state);
      }
    } catch (error) {
      console.error('[ON-HOLD] Error continuing workflow:', error);
    }
  }, []);
  
  const handleModeChange = useCallback((mode: ProcessingMode) => {
    if (workflowState.status !== 'processing' && workflowState.status !== 'paused') {
      setSelectedMode(mode);
    }
  }, [workflowState.status]);
  
  const refreshReport = useCallback(() => {
    loadProcessedCases();
    loadStats();
  }, [loadProcessedCases, loadStats]);
  
  const exportToCsv = useCallback(() => {
    exportUtil(processedCases, 'on-hold-report');
  }, [processedCases]);
  
  // Computed status flags
  const isProcessing = workflowState.status === 'processing';
  const isPaused = workflowState.status === 'paused';
  const isCompleted = workflowState.status === 'completed';
  const hasErrors = workflowState.errors.length > 0;
  
  return {
    // State
    workflowState,
    processedCases,
    stats,
    isLoading,
    selectedMode,
    
    // Status flags
    isProcessing,
    isPaused,
    isCompleted,
    hasErrors,
    canStart: !isProcessing && !isPaused,
    canPause: isProcessing,
    canResume: isPaused,
    canStop: isProcessing || isPaused,
    
    // Actions
    handleStart,
    handlePause,
    handleStop,
    handleNextCase,
    handleModeChange,
    refreshReport,
    exportToCsv
  };
}