'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/header';
import { QCDecisionSummary } from './components/qc-decision-summary';
import { ClientApprovedFeesPanel } from './components/client-approved-fees-panel';
import { InvoiceDataPanel } from './components/invoice-data-panel';
import { CaseUpdatesSection } from './components/case-updates-section';
import { FeeComparison } from './components/fee-comparison';
import { EmptyState } from './components/empty-state';

// Import hooks
import { useCaseLoader } from './hooks/use-case-loader';
import { useClientFees } from './hooks/use-client-fees';
import { useInvoiceData } from './hooks/use-invoice-data';
import { useCaseUpdates } from './hooks/use-case-updates';
import { useAIExtraction } from './hooks/use-ai-extraction';
import { useQCAnalysis } from './hooks/use-qc-analysis';

import { QCActionHandlers } from './types';

export function BillingQCModule() {
  const [caseId, setCaseId] = useState('');
  const [status, setStatus] = useState<'ready' | 'loading' | 'loaded' | 'error'>('ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previousCaseIds, setPreviousCaseIds] = useState<string[]>([]);

  // Initialize hooks
  const { caseDetails, isLoading: isCaseLoading, loadCase, clearCase } = useCaseLoader();
  const { groupedFees, isLoading: isFeesLoading, fetchFees, clearFees } = useClientFees();
  const { 
    groupedInvoiceData, 
    invoiceNumber, 
    totalItems, 
    dateRange, 
    totalAmount: invoiceTotal,
    isLoading: isInvoiceLoading,
    fetchInvoiceData, 
    clearInvoiceData 
  } = useInvoiceData();
  const { 
    updates, 
    lazyLoadState,
    isInitialLoading: isUpdatesLoading,
    loadInitialUpdates, 
    loadMoreUpdates, 
    clearUpdates, 
    observerRef 
  } = useCaseUpdates();
  const { 
    extractedFees, 
    confidenceScore, 
    totalExtractedAmount,
    isExtracting,
    extractFees, 
    reExtractFees,
    clearExtraction 
  } = useAIExtraction();
  const { 
    varianceAnalysis, 
    qcDecisions,
    matchPercentage,
    isAnalyzing,
    analyzeFees, 
    clearAnalysis 
  } = useQCAnalysis();

  // Handle case loading
  const handleLoadCase = useCallback(async () => {
    if (!caseId.trim()) return;
    
    setStatus('loading');
    setErrorMessage(null);
    
    try {
      // Load case details
      await loadCase(caseId);
      
      // Load related data
      await Promise.all([
        fetchFees('Professional Towing'), // This would use actual client name from case
        fetchInvoiceData(caseId),
        loadInitialUpdates(caseId)
      ]);
      
      // Extract fees with AI (using mock text for now)
      await extractFees('Towing service with special handling required');
      
      // Add to history
      setPreviousCaseIds(prev => {
        const newHistory = [caseId, ...prev.filter(id => id !== caseId)].slice(0, 10);
        return newHistory;
      });
      
      setStatus('loaded');
    } catch (error) {
      setStatus('error');
      setErrorMessage('Failed to load case. Please check the case ID and try again.');
    }
  }, [caseId, loadCase, fetchFees, fetchInvoiceData, loadInitialUpdates, extractFees]);

  // Handle case clearing
  const handleClearCase = useCallback(() => {
    setCaseId('');
    setStatus('ready');
    setErrorMessage(null);
    clearCase();
    clearFees();
    clearInvoiceData();
    clearUpdates();
    clearExtraction();
    clearAnalysis();
  }, [clearCase, clearFees, clearInvoiceData, clearUpdates, clearExtraction, clearAnalysis]);

  // Handle next case (generates next case ID for demo)
  const handleNextCase = useCallback(() => {
    handleClearCase();
    // For demo: generate next case ID
    const currentNum = parseInt(caseId.replace(/\D/g, '')) || 0;
    const nextCaseId = `CASE-${(currentNum + 1).toString().padStart(5, '0')}`;
    setCaseId(nextCaseId);
    // Auto-focus input
    setTimeout(() => {
      const input = document.getElementById('case-id-input') as HTMLInputElement;
      input?.focus();
    }, 100);
  }, [caseId, handleClearCase]);

  // Run analysis when data is loaded
  useEffect(() => {
    if (status === 'loaded' && groupedFees.length > 0 && groupedInvoiceData.length > 0) {
      // Flatten the grouped data for analysis
      const approvedFees = groupedFees.flatMap(g => g.fees);
      const invoiceData = groupedInvoiceData.flatMap(g => g.items);
      analyzeFees(approvedFees, invoiceData, extractedFees);
    }
  }, [status, groupedFees, groupedInvoiceData, extractedFees, analyzeFees]);

  // QC Action handlers
  const actionHandlers: QCActionHandlers = {
    onApprove: async () => {
      console.log('Approve clicked for case:', caseId);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // After approval, move to next case
      setTimeout(() => handleNextCase(), 1500);
    },
    onReject: async () => {
      console.log('Reject clicked for case:', caseId);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // After rejection, move to next case
      setTimeout(() => handleNextCase(), 1500);
    },
    onFlag: async () => {
      console.log('Flag for review clicked for case:', caseId);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onReExtract: async () => {
      console.log('Re-extract requested for case:', caseId);
      await reExtractFees();
    },
    onNextCase: () => {
      handleNextCase();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to load case
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && status === 'ready') {
        handleLoadCase();
      }
      // Ctrl/Cmd + N for next case
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && status === 'loaded') {
        e.preventDefault();
        handleNextCase();
      }
      // Ctrl/Cmd + A to approve (when loaded)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && status === 'loaded') {
        e.preventDefault();
        actionHandlers.onApprove();
      }
      // Escape to clear
      if (e.key === 'Escape') {
        handleClearCase();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleLoadCase, handleNextCase, handleClearCase]);

  const isLoading = status === 'loading' || isCaseLoading;
  const isAnyDataLoading = isFeesLoading || isInvoiceLoading || isExtracting || isAnalyzing;

  return (
    <div className="container mx-auto p-6 max-w-full space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <Header
        caseId={caseId}
        onCaseIdChange={setCaseId}
        onLoadCase={handleLoadCase}
        onClearCase={handleClearCase}
        status={status}
        isLoading={isLoading}
        error={errorMessage}
      />

      {/* QC Decision Summary */}
      <div className={`transition-all duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}>
        <QCDecisionSummary
          decisions={qcDecisions}
          isVisible={status === 'loaded'}
          actionHandlers={actionHandlers}
          isProcessing={isLoading || isAnyDataLoading}
        />
      </div>

      {/* Main Content - Two Column Layout */}
      {(status === 'loaded' || status === 'loading') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Client Approved Fees & AI Extraction */}
          <ClientApprovedFeesPanel
            caseDetails={caseDetails}
            groupedApprovedFees={groupedFees}
            aiExtractedFees={extractedFees}
            aiConfidence={confidenceScore}
            aiTotalAmount={totalExtractedAmount}
            isLoading={status === 'loading' || isFeesLoading || isExtracting}
          />

          {/* Right Panel - Actual Invoice Data */}
          <InvoiceDataPanel
            invoiceNumber={invoiceNumber}
            totalItems={totalItems}
            dateRange={dateRange}
            groupedInvoiceData={groupedInvoiceData}
            invoiceTotal={invoiceTotal}
            varianceAnalysis={varianceAnalysis}
            matchPercentage={matchPercentage}
            isLoading={status === 'loading' || isInvoiceLoading}
          />
        </div>
      )}

      {/* Fee Comparison Section (Optional - can be shown as additional analysis) */}
      {status === 'loaded' && varianceAnalysis && (
        <div className="mt-6">
          <FeeComparison
            matchingFees={varianceAnalysis.matching_fees}
            missingFees={varianceAnalysis.missing_fees}
            extraFees={varianceAnalysis.extra_fees}
            matchPercentage={matchPercentage}
            totalDifference={varianceAnalysis.total_difference}
          />
        </div>
      )}

      {/* Case Updates Section */}
      {status === 'loaded' && (
        <CaseUpdatesSection
          updates={updates}
          hasMore={lazyLoadState.hasMore}
          isLoading={lazyLoadState.isLoading}
          totalUpdates={lazyLoadState.total}
          onLoadMore={loadMoreUpdates}
          observerRef={observerRef}
        />
      )}

      {/* Empty State - Show when no case is loaded */}
      {status === 'ready' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <EmptyState 
            onGetStarted={() => {
              const input = document.getElementById('case-id-input') as HTMLInputElement;
              input?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}