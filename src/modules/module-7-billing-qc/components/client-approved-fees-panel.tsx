'use client';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle, FileX } from 'lucide-react';
import { CaseDetails, GroupedApprovedFees, AIExtractedFee } from '../types';

interface ClientApprovedFeesPanelProps {
  caseDetails?: CaseDetails | null;
  groupedApprovedFees: GroupedApprovedFees[];
  aiExtractedFees: AIExtractedFee[];
  aiConfidence?: number;
  aiTotalAmount?: number;
  isLoading?: boolean;
}

export function ClientApprovedFeesPanel({
  caseDetails,
  groupedApprovedFees,
  aiExtractedFees,
  aiConfidence = 0,
  aiTotalAmount = 0,
  isLoading = false
}: ClientApprovedFeesPanelProps) {
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
        <h2 className="text-lg font-semibold mb-4 text-foreground">CLIENT APPROVED FEES & AI EXTRACTION</h2>
        <Separator className="mb-4" />

        {/* Client Information Section */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-base">CLIENT INFORMATION</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client:</span>
              <span className="font-medium">{caseDetails?.client || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lien Holder:</span>
              <span className="font-medium">{caseDetails?.lien_holder || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Status:</span>
              <span className="font-medium">{caseDetails?.status || 'N/A'}</span>
            </div>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Client Approved Fees Section */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-base">CLIENT APPROVED FEES</h3>
          <div className="text-xs text-muted-foreground mb-3">(from client_approved_fees table)</div>
          
          {groupedApprovedFees.length > 0 ? (
            <div className="space-y-3">
              {groupedApprovedFees.map((group, idx) => (
                <div key={idx}>
                  <div className="font-medium text-sm mb-1">Category: {group.category}</div>
                  <div className="pl-4 space-y-1">
                    {group.fees.map((fee, feeIdx) => (
                      <div key={feeIdx} className="flex justify-between text-sm">
                        <span>• {fee.fee_type}:</span>
                        <span className="font-medium">${fee.fee_amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <FileX className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No approved fees available</p>
              <p className="text-xs mt-1">Fees will appear once loaded</p>
            </div>
          )}
        </div>

        <Separator className="mb-4" />

        {/* AI-Extracted Fees Section */}
        <div>
          <h3 className="font-semibold mb-2 text-base">AI-EXTRACTED FEES FROM TEXT</h3>
          <div className="text-xs text-muted-foreground mb-3">Source: Additional Info & Updates</div>
          
          {aiExtractedFees.length > 0 ? (
            <>
              <div className="space-y-1 mb-3">
                {aiExtractedFees.map((fee, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span>• {fee.fee_type}:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">${fee.amount.toFixed(2)}</span>
                      {fee.matched ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-2 border-t">
                <div className="flex justify-between font-medium text-sm">
                  <span>AI Total:</span>
                  <span>${aiTotalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Confidence:</span>
                  <span>{(aiConfidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Warning for unmatched fees */}
              {aiExtractedFees.some(fee => !fee.matched) && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Some extracted fees not in approved list
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No AI-extracted fees yet</p>
              <p className="text-xs mt-1">AI extraction will run automatically</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}