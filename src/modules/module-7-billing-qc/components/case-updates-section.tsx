'use client';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CaseUpdateHistory } from '../types';
import { useRef, useEffect, useState } from 'react';
import { Loader2, ChevronDown, Clock, User, MapPin } from 'lucide-react';

interface CaseUpdatesSectionProps {
  updates: CaseUpdateHistory[];
  hasMore: boolean;
  isLoading: boolean;
  totalUpdates?: number;
  onLoadMore?: () => void;
  observerRef?: (element: HTMLElement | null) => void;
}

export function CaseUpdatesSection({
  updates,
  hasMore,
  isLoading,
  totalUpdates = 0,
  onLoadMore,
  observerRef
}: CaseUpdatesSectionProps) {
  const loadMoreButtonRef = useRef<HTMLButtonElement>(null);
  const [expandedUpdates, setExpandedUpdates] = useState<Set<string>>(new Set());
  const [loadingMore, setLoadingMore] = useState(false);

  // Format date to display format
  const formatUpdateDate = (dateString?: string | null) => {
    if (!dateString) return 'Unknown Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle update expansion
  const toggleUpdateExpansion = (updateId: string) => {
    setExpandedUpdates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(updateId)) {
        newSet.delete(updateId);
      } else {
        newSet.add(updateId);
      }
      return newSet;
    });
  };

  // Handle load more click
  const handleLoadMore = async () => {
    setLoadingMore(true);
    if (onLoadMore) {
      await onLoadMore();
    }
    // Simulate loading delay for UI feedback
    setTimeout(() => setLoadingMore(false), 500);
  };

  // Set up observer reference if provided
  useEffect(() => {
    if (observerRef && loadMoreButtonRef.current) {
      observerRef(loadMoreButtonRef.current);
    }
  }, [observerRef]);

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">ALL CASE UPDATES</h2>
          {totalUpdates > 0 && (
            <Badge variant="outline">
              {updates.length} of {totalUpdates} updates
            </Badge>
          )}
        </div>
        <Separator className="mb-4" />

        {/* Updates List */}
        <div className="space-y-3">
          {updates.length > 0 ? (
            updates.map((update, index) => {
              const isExpanded = expandedUpdates.has(update.id);
              const hasLongContent = update.update_content && update.update_content.length > 150;
              const displayContent = hasLongContent && !isExpanded 
                ? update.update_content?.substring(0, 150) + '...' 
                : update.update_content;

              return (
                <div 
                  key={update.id || index} 
                  className="pb-3 border-b last:border-0 transition-all duration-200 hover:bg-muted/50 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Badge variant="secondary" className="font-mono">
                          #{index + 1}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatUpdateDate(update.update_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{update.update_author || 'System'}</span>
                        </div>
                        {update.update_type && (
                          <Badge variant="outline" className="text-xs">
                            {update.update_type}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm mt-2 leading-relaxed">
                        "{displayContent || 'No content available'}"
                      </div>
                      {update.address_associated && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <MapPin className="h-3 w-3" />
                          <span>{update.address_associated}</span>
                        </div>
                      )}
                    </div>
                    {hasLongContent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUpdateExpansion(update.id)}
                        className="mt-1"
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <Alert>
              <AlertDescription className="text-center py-4">
                No case updates available for this case.
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {hasMore && !isLoading && (
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center">
              <Button
                ref={loadMoreButtonRef}
                variant="outline"
                className="bg-background px-6 transition-all duration-200 hover:scale-105"
                onClick={handleLoadMore}
                disabled={loadingMore || isLoading}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading More...
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Load More Updates ({totalUpdates - updates.length} remaining)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* End of Updates Message */}
        {!hasMore && updates.length > 0 && (
          <div className="text-center text-sm text-muted-foreground mt-6 py-4 border-t">
            All updates loaded
          </div>
        )}
      </div>
    </Card>
  );
}