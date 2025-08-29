/**
 * Hook for fetching case updates with lazy loading
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { CaseUpdateHistory, LazyLoadState } from '../types';
import { BillingQCService } from '../services/billing-qc-service';

export interface UseCaseUpdatesResult {
  updates: CaseUpdateHistory[];
  lazyLoadState: LazyLoadState;
  isInitialLoading: boolean;
  error: string | null;
  loadInitialUpdates: (caseId: string) => Promise<void>;
  loadMoreUpdates: () => Promise<void>;
  clearUpdates: () => void;
  observerRef: (element: HTMLElement | null) => void;
}

export function useCaseUpdates(pageSize: number = 10): UseCaseUpdatesResult {
  const [updates, setUpdates] = useState<CaseUpdateHistory[]>([]);
  const [caseId, setCaseId] = useState<string>('');
  const [lazyLoadState, setLazyLoadState] = useState<LazyLoadState>({
    hasMore: false,
    isLoading: false,
    page: 1,
    pageSize,
    total: 0
  });
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const observerTarget = useRef<HTMLElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const loadInitialUpdates = useCallback(async (newCaseId: string) => {
    if (!newCaseId) {
      setError('Case ID is required');
      return;
    }

    setCaseId(newCaseId);
    setIsInitialLoading(true);
    setError(null);
    setUpdates([]);

    try {
      const result = await BillingQCService.fetchCaseUpdates(newCaseId, 1, pageSize);
      
      setUpdates(result.updates);
      setLazyLoadState({
        hasMore: result.hasMore,
        isLoading: false,
        page: 1,
        pageSize,
        total: result.total
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch case updates');
      setUpdates([]);
      setLazyLoadState({
        hasMore: false,
        isLoading: false,
        page: 1,
        pageSize,
        total: 0
      });
    } finally {
      setIsInitialLoading(false);
    }
  }, [pageSize]);

  const loadMoreUpdates = useCallback(async () => {
    if (!caseId || !lazyLoadState.hasMore || lazyLoadState.isLoading) {
      return;
    }

    setLazyLoadState(prev => ({ ...prev, isLoading: true }));
    setError(null);

    try {
      const nextPage = lazyLoadState.page + 1;
      const result = await BillingQCService.fetchCaseUpdates(caseId, nextPage, pageSize);
      
      setUpdates(prev => [...prev, ...result.updates]);
      setLazyLoadState(prev => ({
        ...prev,
        hasMore: result.hasMore,
        isLoading: false,
        page: nextPage,
        total: result.total
      }));
      setError(null);
    } catch (err) {
      setError('Failed to load more updates');
      setLazyLoadState(prev => ({ ...prev, isLoading: false }));
    }
  }, [caseId, lazyLoadState.hasMore, lazyLoadState.isLoading, lazyLoadState.page, pageSize]);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
    setCaseId('');
    setLazyLoadState({
      hasMore: false,
      isLoading: false,
      page: 1,
      pageSize,
      total: 0
    });
    setError(null);
    setIsInitialLoading(false);
  }, [pageSize]);

  // Setup IntersectionObserver for automatic lazy loading
  const observerRef = useCallback((element: HTMLElement | null) => {
    // Disconnect previous observer
    if (observer.current) {
      observer.current.disconnect();
    }

    // Store the element reference
    observerTarget.current = element;

    // Create new observer if element exists
    if (element) {
      observer.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && lazyLoadState.hasMore && !lazyLoadState.isLoading) {
            loadMoreUpdates();
          }
        },
        {
          root: null,
          rootMargin: '100px',
          threshold: 0.1
        }
      );

      observer.current.observe(element);
    }
  }, [lazyLoadState.hasMore, lazyLoadState.isLoading, loadMoreUpdates]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return {
    updates,
    lazyLoadState,
    isInitialLoading,
    error,
    loadInitialUpdates,
    loadMoreUpdates,
    clearUpdates,
    observerRef
  };
}