'use client';

import { useBillingWorkflow } from './hooks/use-billing-workflow';
import { BillingNavigation } from './components/billing-navigation';
import { WorkflowStatus } from './components/workflow-status';
import { ClientFeeRates } from './components/client-fee-rates';
import { CaseUpdateFees } from './components/case-update-fees';
import { FeeSummary } from './components/fee-summary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export function BillingManagement() {
  const { state, billingData, setCaseId, executeWorkflow, reset } = useBillingWorkflow();

  const handleGenerateInvoice = () => {
    alert(`Invoice generation triggered for case ${state.caseId}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Billing Management</h1>
          <p className="text-muted-foreground">Process complete billing workflow for cases</p>
        </div>
      </div>

      {/* Case Details Bar */}
      {billingData && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="flex gap-6">
            <span><strong>Case ID:</strong> {billingData.caseId}</span>
            <span><strong>Client:</strong> {billingData.clientName}</span>
            <span><strong>Lien Holder:</strong> {billingData.lienHolder || 'N/A'}</span>
            <span><strong>Status:</strong> {billingData.status || 'N/A'}</span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Navigation & Status */}
        <div className="space-y-6">
          <BillingNavigation
            caseId={state.caseId}
            onCaseIdChange={setCaseId}
            onStartWorkflow={executeWorkflow}
            isProcessing={state.status !== 'idle' && state.status !== 'complete' && state.status !== 'error'}
            status={state.status}
          />
          
          {state.status !== 'idle' && (
            <WorkflowStatus
              status={state.status}
              progress={state.progress}
              error={state.error}
            />
          )}
        </div>

        {/* Main Content - Three Cards */}
        <div className="lg:col-span-3">
          {state.status === 'complete' && billingData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ClientFeeRates
                clientName={billingData.clientName}
                feeRates={billingData.clientFeeRates}
              />
              
              <CaseUpdateFees
                invoiceData={billingData.invoiceData}
                caseId={billingData.caseId}
              />
              
              <FeeSummary
                subtotal={billingData.summary.subtotal}
                tax={billingData.summary.tax}
                total={billingData.summary.total}
                onGenerateInvoice={handleGenerateInvoice}
                hasData={billingData.invoiceData.length > 0}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {state.status === 'idle' ? (
                <p>Enter a case ID and start the workflow to view billing data</p>
              ) : state.status === 'error' ? (
                <p>Workflow failed. Please try again.</p>
              ) : (
                <p>Processing workflow...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}