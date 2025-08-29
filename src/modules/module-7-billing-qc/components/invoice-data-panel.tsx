'use client';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle, Receipt, TrendingUp } from 'lucide-react';
import { GroupedInvoiceData, VarianceAnalysis } from '../types';

interface InvoiceDataPanelProps {
  invoiceNumber?: string | null;
  totalItems: number;
  dateRange: { start: string | null; end: string | null };
  groupedInvoiceData: GroupedInvoiceData[];
  invoiceTotal: number;
  varianceAnalysis?: VarianceAnalysis | null;
  matchPercentage?: number;
  isLoading?: boolean;
}

export function InvoiceDataPanel({
  invoiceNumber,
  totalItems,
  dateRange,
  groupedInvoiceData,
  invoiceTotal,
  varianceAnalysis,
  matchPercentage = 0,
  isLoading = false
}: InvoiceDataPanelProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const getMatchBadgeVariant = () => {
    if (matchPercentage >= 90) return 'default';
    if (matchPercentage >= 70) return 'secondary';
    return 'destructive';
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="p-6">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Separator className="mb-4" />
          <div className="space-y-4">
            <div>
              <Skeleton className="h-5 w-32 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <Separator />
            <div>
              <Skeleton className="h-5 w-40 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">ACTUAL INVOICE DATA (invoice_data table)</h2>
        <Separator className="mb-4" />

        {/* Invoice Summary Section */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-base">INVOICE SUMMARY</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice #:</span>
              <span className="font-medium">{invoiceNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Line Items:</span>
              <span className="font-medium">{totalItems} items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date Range:</span>
              <span className="font-medium">
                {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
              </span>
            </div>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Invoice Line Items Section */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-base">INVOICE LINE ITEMS</h3>
          
          {groupedInvoiceData.length > 0 ? (
            <div className="space-y-3">
              {groupedInvoiceData.map((group, idx) => (
                <div key={idx}>
                  <div className="text-sm text-muted-foreground mb-1">
                    Service Date: {formatDate(group.service_date)}
                  </div>
                  <div className="pl-4 space-y-1">
                    {group.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex justify-between items-center text-sm">
                        <span>• {item.service_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            ${(item.cost || 0).toFixed(2)}
                          </span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <Separator className="my-3" />
              <div className="flex justify-between font-semibold text-sm">
                <span>Invoice Total:</span>
                <span>${invoiceTotal.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Receipt className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No invoice data available</p>
              <p className="text-xs mt-1">Invoice will appear when case is loaded</p>
            </div>
          )}
        </div>

        {/* Match Alert */}
        {matchPercentage > 0 && (
          <Alert className="mb-4" variant={matchPercentage >= 90 ? 'default' : undefined}>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Invoice matches approved fees ({matchPercentage}% match)
            </AlertDescription>
          </Alert>
        )}

        <Separator className="mb-4" />

        {/* Variance Analysis Section */}
        <div>
          <h3 className="font-semibold mb-3 text-base">VARIANCE ANALYSIS</h3>
          
          {varianceAnalysis ? (
            <div className="space-y-3">
              {/* Client Approved vs Invoice */}
              <div>
                <div className="font-medium text-sm mb-1">Client Approved vs Invoice:</div>
                <div className="pl-4 text-sm space-y-1">
                  {varianceAnalysis.missing_fees.filter(f => f.source === 'approved').map((fee, idx) => (
                    <div key={idx} className="text-muted-foreground">
                      • Missing: {fee.fee_type} ${fee.amount.toFixed(2)}
                    </div>
                  ))}
                  {varianceAnalysis.missing_fees.filter(f => f.source === 'approved').length === 0 && (
                    <div className="text-green-600">• All approved fees found</div>
                  )}
                </div>
              </div>

              {/* AI Extracted vs Invoice */}
              <div>
                <div className="font-medium text-sm mb-1">AI Extracted vs Invoice:</div>
                <div className="pl-4 text-sm space-y-1">
                  {varianceAnalysis.extra_fees.filter(f => f.source === 'ai').map((fee, idx) => (
                    <div key={idx} className="text-muted-foreground">
                      • Extra: {fee.fee_type} ${fee.amount.toFixed(2)}
                    </div>
                  ))}
                  {varianceAnalysis.total_difference !== 0 && (
                    <div className="text-muted-foreground">
                      • Difference: {varianceAnalysis.total_difference > 0 ? '+' : ''}${varianceAnalysis.total_difference.toFixed(2)}
                    </div>
                  )}
                  {varianceAnalysis.extra_fees.filter(f => f.source === 'ai').length === 0 && 
                   varianceAnalysis.total_difference === 0 && (
                    <div className="text-green-600">• Perfect match with AI extraction</div>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex gap-2 mt-4">
                <Badge variant={getMatchBadgeVariant()}>
                  {matchPercentage}% Match
                </Badge>
                {varianceAnalysis.missing_fees.length > 0 && (
                  <Badge variant="secondary">Missing Fees</Badge>
                )}
                {varianceAnalysis.extra_fees.length > 0 && (
                  <Badge variant="secondary">Extra Fees</Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No variance analysis available</div>
          )}
        </div>
      </div>
    </Card>
  );
}