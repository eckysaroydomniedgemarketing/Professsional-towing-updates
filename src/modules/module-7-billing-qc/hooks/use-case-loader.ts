/**
 * Hook for loading case data by ID
 */

import { useState, useCallback } from 'react';
import { CaseDetails } from '../types';
import { BillingQCService } from '../services/billing-qc-service';

export interface UseCaseLoaderResult {
  caseDetails: CaseDetails | null;
  isLoading: boolean;
  error: string | null;
  loadCase: (caseId: string) => Promise<void>;
  clearCase: () => void;
}

export function useCaseLoader(): UseCaseLoaderResult {
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCase = useCallback(async (caseId: string) => {
    if (!caseId.trim()) {
      setError('Case ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const details = await BillingQCService.fetchCaseDetails(caseId);
      
      if (!details) {
        setError('Case not found');
        setCaseDetails(null);
      } else {
        setCaseDetails(details);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load case details');
      setCaseDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCase = useCallback(() => {
    setCaseDetails(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    caseDetails,
    isLoading,
    error,
    loadCase,
    clearCase
  };
}