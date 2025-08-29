'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, XCircle, Loader2, ArrowRight, RefreshCw, Flag, Ban, Check } from 'lucide-react';
import { QCDecision, QCActionHandlers } from '../types';

interface QCDecisionSummaryProps {
  decisions: QCDecision[];
  isVisible: boolean;
  actionHandlers?: QCActionHandlers;
  isProcessing?: boolean;
}

export function QCDecisionSummary({
  decisions,
  isVisible,
  actionHandlers,
  isProcessing = false
}: QCDecisionSummaryProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!isVisible) return null;

  const getDecisionIcon = (type: QCDecision['decision_type']) => {
    switch (type) {
      case 'match':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const handleAction = async (action: keyof QCActionHandlers, actionLabel: string) => {
    if (actionHandlers && actionHandlers[action]) {
      setActiveAction(actionLabel);
      setActionFeedback(null);
      
      // Call the action handler
      await actionHandlers[action]();
      
      // Show feedback
      if (action !== 'onNextCase') {
        setActionFeedback(`${actionLabel} action completed`);
        setTimeout(() => {
          setActionFeedback(null);
          setActiveAction(null);
        }, 2000);
      } else {
        setActiveAction(null);
      }
    }
  };

  // Calculate decision summary
  const matchCount = decisions.filter(d => d.decision_type === 'match').length;
  const warningCount = decisions.filter(d => d.decision_type === 'warning').length;
  const errorCount = decisions.filter(d => d.decision_type === 'error').length;

  return (
    <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            QC DECISION SUMMARY
          </h2>
          <div className="flex items-center gap-2">
            {matchCount > 0 && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {matchCount} Match
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {warningCount} Warning{warningCount > 1 ? 's' : ''}
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {errorCount} Error{errorCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
        
        {decisions.length > 0 ? (
          <Alert className="mb-4">
            <AlertDescription>
              <div className="space-y-2">
                {decisions.map((decision, index) => (
                  <div key={index} className="flex items-start gap-2">
                    {getDecisionIcon(decision.decision_type)}
                    <span className="text-sm">{decision.message}</span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-4">
            <AlertDescription>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>No QC decisions available. Analyzing fees...</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Feedback */}
        {actionFeedback && (
          <Alert className="mb-4 border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {actionFeedback}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="default"
            onClick={() => handleAction('onApprove', 'Approve')}
            disabled={isProcessing || activeAction !== null}
            className="transition-all duration-200 hover:scale-105"
          >
            {activeAction === 'Approve' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Approve
              </>
            )}
          </Button>
          <Button 
            variant="secondary"
            onClick={() => handleAction('onFlag', 'Flag')}
            disabled={isProcessing || activeAction !== null}
            className="transition-all duration-200 hover:scale-105"
          >
            {activeAction === 'Flag' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Flag className="mr-2 h-4 w-4" />
                Flag for Review
              </>
            )}
          </Button>
          <Button 
            variant="destructive"
            onClick={() => handleAction('onReject', 'Reject')}
            disabled={isProcessing || activeAction !== null}
            className="transition-all duration-200 hover:scale-105"
          >
            {activeAction === 'Reject' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Reject
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleAction('onReExtract', 'Re-extract')}
            disabled={isProcessing || activeAction !== null}
            className="transition-all duration-200 hover:scale-105"
          >
            {activeAction === 'Re-extract' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Re-extracting...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Request AI Re-extraction
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleAction('onNextCase', 'Next Case')}
            disabled={isProcessing || activeAction !== null}
            className="transition-all duration-200 hover:scale-105"
          >
            {activeAction === 'Next Case' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Next...
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4" />
                Next Case
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}