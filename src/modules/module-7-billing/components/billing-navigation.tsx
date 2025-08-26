'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlayCircle, Loader2 } from "lucide-react";

interface BillingNavigationProps {
  caseId: string;
  onCaseIdChange: (value: string) => void;
  onStartWorkflow: () => void;
  isProcessing: boolean;
  status: string;
}

export function BillingNavigation({ 
  caseId, 
  onCaseIdChange, 
  onStartWorkflow,
  isProcessing,
  status
}: BillingNavigationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Workflow</CardTitle>
        <CardDescription>
          Enter case ID to start billing process
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="case-id">Case ID</Label>
          <Input
            id="case-id"
            placeholder="Enter case ID"
            value={caseId}
            onChange={(e) => onCaseIdChange(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        <Button 
          onClick={onStartWorkflow}
          disabled={!caseId || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Billing Workflow
            </>
          )}
        </Button>

        {status !== 'idle' && (
          <div className="text-sm text-muted-foreground">
            Status: {status}
          </div>
        )}
      </CardContent>
    </Card>
  );
}