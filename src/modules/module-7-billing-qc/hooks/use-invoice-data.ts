/**
 * Hook for fetching invoice data
 */

import { useState, useCallback } from 'react';
import { InvoiceData, GroupedInvoiceData } from '../types';
import { BillingQCService } from '../services/billing-qc-service';

export interface UseInvoiceDataResult {
  invoiceData: InvoiceData[];
  groupedInvoiceData: GroupedInvoiceData[];
  invoiceNumber: string | null;
  totalAmount: number;
  totalItems: number;
  dateRange: { start: string | null; end: string | null };
  isLoading: boolean;
  error: string | null;
  fetchInvoiceData: (caseId: string) => Promise<void>;
  clearInvoiceData: () => void;
}

export function useInvoiceData(): UseInvoiceDataResult {
  const [invoiceData, setInvoiceData] = useState<InvoiceData[]>([]);
  const [groupedInvoiceData, setGroupedInvoiceData] = useState<GroupedInvoiceData[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoiceData = useCallback(async (caseId: string) => {
    if (!caseId) {
      setError('Case ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await BillingQCService.fetchInvoiceData(caseId);
      setInvoiceData(data);
      
      // Group by service date
      const grouped = BillingQCService.groupInvoiceByDate(data);
      setGroupedInvoiceData(grouped);
      
      // Extract invoice number (assuming all items have same invoice number)
      if (data.length > 0 && data[0].invoice_number) {
        setInvoiceNumber(data[0].invoice_number);
      }
      
      // Calculate total amount
      const total = data.reduce((sum, item) => sum + (item.cost || 0), 0);
      setTotalAmount(total);
      
      // Set total items count
      setTotalItems(data.length);
      
      // Calculate date range
      const dates = data
        .map(item => item.service_date)
        .filter(date => date !== null) as string[];
      
      if (dates.length > 0) {
        const sortedDates = dates.sort();
        setDateRange({
          start: sortedDates[0],
          end: sortedDates[sortedDates.length - 1]
        });
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch invoice data');
      setInvoiceData([]);
      setGroupedInvoiceData([]);
      setInvoiceNumber(null);
      setTotalAmount(0);
      setTotalItems(0);
      setDateRange({ start: null, end: null });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearInvoiceData = useCallback(() => {
    setInvoiceData([]);
    setGroupedInvoiceData([]);
    setInvoiceNumber(null);
    setTotalAmount(0);
    setTotalItems(0);
    setDateRange({ start: null, end: null });
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    invoiceData,
    groupedInvoiceData,
    invoiceNumber,
    totalAmount,
    totalItems,
    dateRange,
    isLoading,
    error,
    fetchInvoiceData,
    clearInvoiceData
  };
}