'use client';

import { useState, useEffect } from 'react';
import { WorkflowControl } from '@/modules/module-4-agent-visibility/components/workflow-control';
import { CurrentProcessing } from '@/modules/module-4-agent-visibility/components/current-processing';
import { StatisticsDisplay } from '@/modules/module-4-agent-visibility/components/statistics-display';
import { ReportTable } from '@/modules/module-4-agent-visibility/components/report-table';
import { EmptyState } from '@/modules/module-4-agent-visibility/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useWorkflow } from '@/modules/module-4-agent-visibility/hooks/use-workflow';

export default function AgentUpdatesVisibilityPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'manual' | 'automatic'>('manual');
  
  const {
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
    deleteReport
  } = useWorkflow();
  
  // Sync selectedMode with workflowState.mode when it changes
  useEffect(() => {
    if (workflowState.mode) {
      setSelectedMode(workflowState.mode);
    }
  }, [workflowState.mode]);

  // Calculate progress percentage
  const calculateProgress = () => {
    if (workflowState.totalProcessed === 0) return 0;
    if (workflowState.processedCount === 0) return 0;
    return Math.round((workflowState.processedCount / (workflowState.processedCount + 5)) * 100);
  };

  // Event Handlers
  const handleStart = async () => {
    setIsProcessing(true);
    try {
      await startWorkflow(selectedMode);
    } catch (err) {
      console.error('Failed to start workflow:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStop = async () => {
    setIsProcessing(true);
    try {
      await stopWorkflow();
    } catch (err) {
      console.error('Failed to stop workflow:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModeChange = (mode: 'manual' | 'automatic') => {
    // Just update the selected mode, don't start workflow
    setSelectedMode(mode);
  };

  const handleNextCase = async () => {
    setIsProcessing(true);
    try {
      await processNextCase();
    } catch (err) {
      console.error('Failed to process next case:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportReport();
    } catch (err) {
      console.error('Failed to export report:', err);
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportReportPDF();
    } catch (err) {
      console.error('Failed to export PDF report:', err);
    }
  };

  const handleDelete = async (logId: string) => {
    try {
      await deleteReport(logId);
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  // Map workflow status for UI
  const getUIStatus = (): 'idle' | 'processing' | 'error' | 'completed' | 'session_lost' => {
    if (workflowState.currentStatus === 'session_lost') return 'session_lost';
    if (workflowState.error) return 'error';
    if (workflowState.isRunning) return 'processing';
    if (workflowState.currentStatus === 'completed') return 'completed';
    return 'idle';
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <h1 className="text-3xl font-bold">Agent Update Visibility Manager</h1>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Empty State (when no workflow has been run)
  const showEmptyState = !workflowState.isRunning && 
                         reportData.length === 0 && 
                         statistics.totalCases === 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Agent Update Visibility Manager</h1>
        <p className="text-muted-foreground mt-2">
          Process RDN portal cases to make agent updates visible
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Session Lost Alert */}
      {workflowState.currentStatus === 'session_lost' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Session lost while processing case {workflowState.sessionLostAtCase}. 
            Another user may have logged in with the same credentials. 
            Please re-login to continue processing.
          </AlertDescription>
        </Alert>
      )}

      {/* Workflow Control */}
      <WorkflowControl
        isRunning={workflowState.isRunning || isProcessing}
        mode={selectedMode}
        status={getUIStatus()}
        sessionLostAtCase={workflowState.sessionLostAtCase}
        onStart={handleStart}
        onStop={handleStop}
        onModeChange={handleModeChange}
      />

      {/* Current Processing */}
      {(workflowState.isRunning || workflowState.currentCaseId) && (
        <CurrentProcessing
          caseId={workflowState.currentCaseId}
          updatesFound={0} // These would need to be added to WorkflowState type
          updatesProcessed={workflowState.totalProcessed}
          progress={calculateProgress()}
          mode={workflowState.mode}
          onNextCase={handleNextCase}
        />
      )}

      {/* Statistics */}
      {!showEmptyState && (
        <StatisticsDisplay stats={statistics} />
      )}

      {/* Report Table or Empty State */}
      {showEmptyState ? (
        <EmptyState onStart={handleStart} />
      ) : (
        <ReportTable
          data={reportData}
          onExport={handleExport}
          onExportPDF={handleExportPDF}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}