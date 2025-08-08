'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Info, ChevronRight } from 'lucide-react';

interface CurrentProcessingProps {
  caseId: string | null;
  updatesFound: number;
  updatesProcessed: number;
  progress: number;
  mode: 'manual' | 'automatic';
  onNextCase: () => void;
}

export function CurrentProcessing({
  caseId,
  updatesFound,
  updatesProcessed,
  progress,
  mode,
  onNextCase
}: CurrentProcessingProps) {
  if (!caseId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No case currently being processed. Click "Start Processing" to begin.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Processing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Case Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="space-y-1">
            <div className="font-semibold">
              Currently Processing: Case #{caseId}
            </div>
            <div className="text-sm">
              Updates Found: {updatesFound} | Updates Processed: {updatesProcessed}
            </div>
          </AlertDescription>
        </Alert>

        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {/* Next Case Button - Only visible in manual mode */}
            {mode === 'manual' && (
              <Button 
                onClick={onNextCase}
                variant="default"
                className="whitespace-nowrap"
              >
                Next Case
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {/* Progress Bar */}
            <div className="flex-1 space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-right">
                {progress}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}