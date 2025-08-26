'use client';

import { useState } from 'react';
import { BillingWorkflowState, BillingData } from '../types';

export function useBillingWorkflow() {
  const [state, setState] = useState<BillingWorkflowState>({
    caseId: '',
    status: 'idle',
    progress: {
      login: false,
      navigation: false,
      extraction: false,
      storage: false
    }
  });
  
  const [billingData, setBillingData] = useState<BillingData | null>(null);

  const setCaseId = (caseId: string) => {
    setState(prev => ({ ...prev, caseId }));
  };

  const executeWorkflow = async () => {
    if (!state.caseId) return;

    setState(prev => ({ ...prev, status: 'login', error: undefined }));

    try {
      const response = await fetch('/api/billing-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: state.caseId })
      });

      if (!response.ok) {
        throw new Error('Workflow execution failed');
      }

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          status: 'complete',
          progress: result.steps
        }));

        // Fetch billing data after successful workflow
        await fetchBillingData(state.caseId);
      } else {
        throw new Error(result.error || 'Workflow failed');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  const fetchBillingData = async (caseId: string) => {
    try {
      const response = await fetch(`/api/billing-data?caseId=${caseId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }

      const data = await response.json();
      setBillingData(data);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    }
  };

  const reset = () => {
    setState({
      caseId: '',
      status: 'idle',
      progress: {
        login: false,
        navigation: false,
        extraction: false,
        storage: false
      }
    });
    setBillingData(null);
  };

  return {
    state,
    billingData,
    setCaseId,
    executeWorkflow,
    reset
  };
}