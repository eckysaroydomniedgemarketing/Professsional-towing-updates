/**
 * Hook for fetching client approved fees
 */

import { useState, useEffect, useCallback } from 'react';
import { ClientApprovedFee, GroupedApprovedFees } from '../types';
import { BillingQCService } from '../services/billing-qc-service';

export interface UseClientFeesResult {
  fees: ClientApprovedFee[];
  groupedFees: GroupedApprovedFees[];
  isLoading: boolean;
  error: string | null;
  fetchFees: (clientName: string) => Promise<void>;
  clearFees: () => void;
  totalAmount: number;
}

export function useClientFees(): UseClientFeesResult {
  const [fees, setFees] = useState<ClientApprovedFee[]>([]);
  const [groupedFees, setGroupedFees] = useState<GroupedApprovedFees[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchFees = useCallback(async (clientName: string) => {
    if (!clientName) {
      setError('Client name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedFees = await BillingQCService.fetchClientApprovedFees(clientName);
      setFees(fetchedFees);
      
      // Group fees by category
      const grouped = BillingQCService.groupFeesByCategory(fetchedFees);
      setGroupedFees(grouped);
      
      // Calculate total
      const total = fetchedFees.reduce((sum, fee) => sum + fee.fee_amount, 0);
      setTotalAmount(total);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch client approved fees');
      setFees([]);
      setGroupedFees([]);
      setTotalAmount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearFees = useCallback(() => {
    setFees([]);
    setGroupedFees([]);
    setTotalAmount(0);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    fees,
    groupedFees,
    isLoading,
    error,
    fetchFees,
    clearFees,
    totalAmount
  };
}