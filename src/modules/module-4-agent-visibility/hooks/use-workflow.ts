import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/api-client.service';
import { getErrorMessage } from '../utils/error-handler';
import { downloadPDF } from '../utils/pdf-export.utils';
import type { WorkflowState, ProcessingStats, VisibilityReport } from '../types';

interface UseWorkflowReturn {
  workflowState: WorkflowState;
  statistics: ProcessingStats;
  reportData: VisibilityReport[];
  isLoading: boolean;
  error: string | null;
  startWorkflow: (mode: 'manual' | 'automatic') => Promise<void>;
  stopWorkflow: () => Promise<void>;
  processNextCase: () => Promise<void>;
  exportReport: () => Promise<void>;
  exportReportPDF: () => Promise<void>;
  refreshReport: () => Promise<void>;
  deleteReport: (logId: string) => Promise<void>;
}

export function useWorkflow(): UseWorkflowReturn {
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    isRunning: false,
    currentCaseId: null,
    mode: 'manual',
    processedCount: 0,
    totalProcessed: 0,
    currentStatus: 'idle',
    error: undefined
  });

  const [statistics, setStatistics] = useState<ProcessingStats>({
    totalCases: 0,
    totalUpdates: 0,
    manualCases: 0,
    automaticCases: 0,
    skippedCases: 0
  });

  const [reportData, setReportData] = useState<VisibilityReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial status and report
  useEffect(() => {
    fetchInitialData();
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Get status
      const statusResponse = await apiClient.getWorkflowStatus();
      setWorkflowState(statusResponse.workflow);
      setStatistics(statusResponse.statistics);

      // Get report
      const reportResponse = await apiClient.getReport();
      const formattedReport = reportResponse.data.map(item => ({
        id: item.id,
        date: item.date_ist ? item.date_ist.split(' ')[0] : '',
        caseId: item.case_id,
        updates: item.updates_made_visible,
        status: item.status as 'Processed' | 'Skipped'
      }));
      setReportData(formattedReport);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    pollingInterval.current = setInterval(async () => {
      try {
        const response = await apiClient.getWorkflowStatus();
        setWorkflowState(response.workflow);
        setStatistics(response.statistics);

        // Stop polling if workflow is no longer running
        if (!response.workflow.isRunning) {
          stopPolling();
          refreshReport();
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 2000); // Poll every 2 seconds
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const startWorkflow = async (mode: 'manual' | 'automatic') => {
    setError(null);
    
    // Optimistically update state
    setWorkflowState(prev => ({
      ...prev,
      mode: mode,
      isRunning: true,
      currentStatus: 'processing',
      error: undefined
    }));
    
    try {
      const response = await apiClient.startWorkflow(mode);
      if (response.state) {
        setWorkflowState(response.state);
      } else {
        // If no state in response, keep our optimistic update but ensure mode is set
        setWorkflowState(prev => ({
          ...prev,
          mode: mode
        }));
      }
      startPolling();
    } catch (err) {
      // Revert on error
      setWorkflowState(prev => ({
        ...prev,
        isRunning: false,
        currentStatus: 'idle',
        error: getErrorMessage(err)
      }));
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  const stopWorkflow = async () => {
    setError(null);
    
    // Optimistically update state
    setWorkflowState(prev => ({
      ...prev,
      isRunning: false,
      currentStatus: 'idle'
    }));
    
    try {
      await apiClient.stopWorkflow();
      stopPolling();
      
      // Refresh status
      const statusResponse = await apiClient.getWorkflowStatus();
      setWorkflowState(statusResponse.workflow);
      setStatistics(statusResponse.statistics);
    } catch (err) {
      // Revert on error
      setWorkflowState(prev => ({
        ...prev,
        isRunning: true,
        currentStatus: 'processing'
      }));
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  const processNextCase = async () => {
    setError(null);
    try {
      const response = await apiClient.processNextCase();
      
      if (response.state) {
        setWorkflowState(response.state);
      }
      
      if (response.completed) {
        stopPolling();
        refreshReport();
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  const exportReport = async () => {
    setError(null);
    try {
      await apiClient.exportReportCSV();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  const exportReportPDF = async () => {
    setError(null);
    try {
      // Get fresh report data from API
      const response = await apiClient.getReport();
      const pdfData = response.data.map(item => ({
        date_ist: item.date_ist || '',
        case_id: item.case_id,
        updates_made_visible: item.updates_made_visible,
        processing_mode: item.processing_mode || 'manual',
        status: item.status
      }));
      
      // Generate and download PDF
      downloadPDF(pdfData);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  const refreshReport = async () => {
    try {
      const response = await apiClient.getReport();
      const formattedReport = response.data.map(item => ({
        id: item.id,
        date: item.date_ist ? item.date_ist.split(' ')[0] : '',
        caseId: item.case_id,
        updates: item.updates_made_visible,
        status: item.status as 'Processed' | 'Skipped'
      }));
      setReportData(formattedReport);
      
      // Also refresh statistics
      const statusResponse = await apiClient.getWorkflowStatus();
      setStatistics(statusResponse.statistics);
    } catch (err) {
      console.error('Error refreshing report:', err);
    }
  };

  const deleteReport = async (logId: string) => {
    setError(null);
    try {
      await apiClient.deleteReport(logId);
      // Refresh the report after successful deletion
      await refreshReport();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  return {
    workflowState,
    statistics,
    reportData,
    isLoading,
    error,
    startWorkflow,
    stopWorkflow,
    processNextCase,
    exportReport,
    exportReportPDF,
    refreshReport,
    deleteReport
  };
}