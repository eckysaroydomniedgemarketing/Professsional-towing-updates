'use client';

import { useOnHold } from '../hooks/use-on-hold';
import { WorkflowControl } from './workflow-control';
import { CaseDisplay } from './case-display';
import { ReportTable } from './report-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function OnHoldDashboard() {
  const {
    workflowState,
    processedCases,
    stats,
    isLoading,
    selectedMode,
    isProcessing,
    isPaused,
    canStart,
    canPause,
    canStop,
    hasErrors,
    handleStart,
    handlePause,
    handleStop,
    handleNextCase,
    handleModeChange,
    refreshReport,
    exportToCsv
  } = useOnHold();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">On-Hold Management</h1>
        <p className="text-muted-foreground">
          Process cases with "Pending On Hold" status and change them to "Hold"
        </p>
      </div>
      
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {workflowState.errors[workflowState.errors.length - 1]}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <WorkflowControl
          mode={selectedMode}
          onModeChange={handleModeChange}
          onStart={handleStart}
          onPause={handlePause}
          onStop={handleStop}
          canStart={canStart}
          canPause={canPause}
          canStop={canStop}
          isPaused={isPaused}
        />
        
        <CaseDisplay
          workflowState={workflowState}
          onNextCase={handleNextCase}
          showNextButton={selectedMode === 'manual' && isPaused}
        />
      </div>
      
      <ReportTable
        cases={processedCases}
        stats={stats}
        onRefresh={refreshReport}
        onExport={exportToCsv}
        isLoading={isLoading}
      />
    </div>
  );
}