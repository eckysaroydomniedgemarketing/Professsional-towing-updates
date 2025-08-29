/**
 * Hook for AI fee extraction (placeholder for OpenRouter integration)
 */

import { useState, useCallback } from 'react';
import { AIExtractedFee, AIExtractionResult } from '../types';
import { BillingQCService } from '../services/billing-qc-service';

export interface UseAIExtractionResult {
  extractedFees: AIExtractedFee[];
  extractionResult: AIExtractionResult | null;
  isExtracting: boolean;
  error: string | null;
  confidenceScore: number;
  totalExtractedAmount: number;
  extractFees: (text: string) => Promise<void>;
  reExtractFees: () => Promise<void>;
  clearExtraction: () => void;
}

export function useAIExtraction(): UseAIExtractionResult {
  const [extractedFees, setExtractedFees] = useState<AIExtractedFee[]>([]);
  const [extractionResult, setExtractionResult] = useState<AIExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [totalExtractedAmount, setTotalExtractedAmount] = useState(0);
  const [lastText, setLastText] = useState<string>('');

  const extractFees = useCallback(async (text: string) => {
    if (!text || !text.trim()) {
      setError('No text provided for extraction');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setLastText(text);

    try {
      const result = await BillingQCService.extractFeesWithAI(text);
      
      setExtractionResult(result);
      setExtractedFees(result.fees);
      setConfidenceScore(result.confidence_score);
      setTotalExtractedAmount(result.total_amount);
      setError(null);
    } catch (err) {
      setError('Failed to extract fees using AI');
      setExtractedFees([]);
      setExtractionResult(null);
      setConfidenceScore(0);
      setTotalExtractedAmount(0);
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const reExtractFees = useCallback(async () => {
    if (!lastText) {
      setError('No previous text to re-extract');
      return;
    }

    await extractFees(lastText);
  }, [lastText, extractFees]);

  const clearExtraction = useCallback(() => {
    setExtractedFees([]);
    setExtractionResult(null);
    setConfidenceScore(0);
    setTotalExtractedAmount(0);
    setError(null);
    setIsExtracting(false);
    setLastText('');
  }, []);

  return {
    extractedFees,
    extractionResult,
    isExtracting,
    error,
    confidenceScore,
    totalExtractedAmount,
    extractFees,
    reExtractFees,
    clearExtraction
  };
}