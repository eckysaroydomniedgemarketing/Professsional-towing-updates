/**
 * Hook for comparing fees and generating QC decisions
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  ClientApprovedFee, 
  InvoiceData, 
  AIExtractedFee, 
  VarianceAnalysis, 
  QCDecision 
} from '../types';
import { BillingQCService } from '../services/billing-qc-service';

export interface UseQCAnalysisResult {
  varianceAnalysis: VarianceAnalysis | null;
  qcDecisions: QCDecision[];
  isAnalyzing: boolean;
  error: string | null;
  matchPercentage: number;
  totalVariance: number;
  hasWarnings: boolean;
  hasErrors: boolean;
  analyzeFees: (
    approvedFees: ClientApprovedFee[],
    invoiceData: InvoiceData[],
    aiExtractedFees: AIExtractedFee[]
  ) => Promise<void>;
  clearAnalysis: () => void;
}

export function useQCAnalysis(): UseQCAnalysisResult {
  const [varianceAnalysis, setVarianceAnalysis] = useState<VarianceAnalysis | null>(null);
  const [qcDecisions, setQCDecisions] = useState<QCDecision[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchPercentage, setMatchPercentage] = useState(0);
  const [totalVariance, setTotalVariance] = useState(0);
  const [hasWarnings, setHasWarnings] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);

  const analyzeFees = useCallback(async (
    approvedFees: ClientApprovedFee[],
    invoiceData: InvoiceData[],
    aiExtractedFees: AIExtractedFee[]
  ) => {
    // Validate inputs
    if (!approvedFees.length && !invoiceData.length && !aiExtractedFees.length) {
      setError('No fee data available for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Perform variance analysis
      const variance = await BillingQCService.analyzeVariance(
        approvedFees,
        invoiceData,
        aiExtractedFees
      );
      setVarianceAnalysis(variance);
      
      // Generate QC decisions based on variance
      const decisions = await BillingQCService.generateQCDecisions(variance);
      setQCDecisions(decisions);
      
      // Set summary metrics
      setMatchPercentage(variance.match_percentage);
      setTotalVariance(variance.total_difference);
      
      // Check for warnings and errors
      const warnings = decisions.filter(d => d.severity === 'warning').length > 0;
      const errors = decisions.filter(d => d.severity === 'error').length > 0;
      setHasWarnings(warnings);
      setHasErrors(errors);
      
      setError(null);
    } catch (err) {
      setError('Failed to analyze fee variance');
      setVarianceAnalysis(null);
      setQCDecisions([]);
      setMatchPercentage(0);
      setTotalVariance(0);
      setHasWarnings(false);
      setHasErrors(false);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setVarianceAnalysis(null);
    setQCDecisions([]);
    setMatchPercentage(0);
    setTotalVariance(0);
    setHasWarnings(false);
    setHasErrors(false);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    varianceAnalysis,
    qcDecisions,
    isAnalyzing,
    error,
    matchPercentage,
    totalVariance,
    hasWarnings,
    hasErrors,
    analyzeFees,
    clearAnalysis
  };
}