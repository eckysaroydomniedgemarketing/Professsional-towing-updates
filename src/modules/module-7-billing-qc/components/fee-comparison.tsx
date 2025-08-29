'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, TrendingDown, Equal } from 'lucide-react';
import { FeeMatch, FeeDiscrepancy } from '../types';

interface FeeComparisonProps {
  matchingFees?: FeeMatch[];
  missingFees?: FeeDiscrepancy[];
  extraFees?: FeeDiscrepancy[];
  matchPercentage?: number;
  totalDifference?: number;
}

export function FeeComparison({
  matchingFees = [],
  missingFees = [],
  extraFees = [],
  matchPercentage = 0,
  totalDifference = 0
}: FeeComparisonProps) {
  const getMatchIcon = () => {
    if (matchPercentage >= 90) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (matchPercentage >= 70) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getMatchBadgeVariant = () => {
    if (matchPercentage >= 90) return 'default';
    if (matchPercentage >= 70) return 'secondary';
    return 'destructive';
  };

  const getDifferenceIcon = () => {
    if (totalDifference > 0) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (totalDifference < 0) {
      return <TrendingDown className="h-4 w-4 text-yellow-500" />;
    } else {
      return <Equal className="h-4 w-4 text-green-500" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'approved':
        return 'Approved Fees';
      case 'invoice':
        return 'Invoice';
      case 'ai':
        return 'AI Extracted';
      default:
        return source;
    }
  };

  return (
    <div className="space-y-4">
      {/* Match Summary */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          {getMatchIcon()}
          <div>
            <div className="font-medium text-sm">Match Rate</div>
            <div className="text-xs text-muted-foreground">
              {matchingFees.length} matching fees found
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={getMatchBadgeVariant()}>
            {matchPercentage}% Match
          </Badge>
          <div className="flex items-center gap-1">
            {getDifferenceIcon()}
            <span className="text-sm font-medium">
              {totalDifference > 0 ? '+' : ''}{totalDifference !== 0 ? `$${Math.abs(totalDifference).toFixed(2)}` : 'Balanced'}
            </span>
          </div>
        </div>
      </div>

      {/* Matching Fees */}
      {matchingFees.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Matching Fees
          </h4>
          <div className="space-y-1">
            {matchingFees.map((fee, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm p-2 bg-green-50 dark:bg-green-950/20 rounded">
                <span>{fee.fee_type}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">${fee.amount.toFixed(2)}</span>
                  <div className="flex gap-1">
                    {fee.sources.map((source, sIdx) => (
                      <Badge key={sIdx} variant="outline" className="text-xs">
                        {getSourceLabel(source)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Fees */}
      {missingFees.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            Missing Fees
          </h4>
          <div className="space-y-1">
            {missingFees.map((fee, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                <span>{fee.fee_type}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">${fee.amount.toFixed(2)}</span>
                  <Badge variant="outline" className="text-xs">
                    Missing from {getSourceLabel(fee.source)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extra Fees */}
      {extraFees.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            Extra/Unmatched Fees
          </h4>
          <div className="space-y-1">
            {extraFees.map((fee, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm p-2 bg-red-50 dark:bg-red-950/20 rounded">
                <span>{fee.fee_type}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">${fee.amount.toFixed(2)}</span>
                  <Badge variant="outline" className="text-xs">
                    Only in {getSourceLabel(fee.source)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data State */}
      {matchingFees.length === 0 && missingFees.length === 0 && extraFees.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No fee comparison data available
        </div>
      )}
    </div>
  );
}