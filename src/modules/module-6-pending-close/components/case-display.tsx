'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight } from 'lucide-react';
import type { WorkflowState } from '../types';

interface CaseDisplayProps {
  workflowState: WorkflowState;
  onNextCase: () => void;
  showNextButton: boolean;
}

export function CaseDisplay({ workflowState, onNextCase, showNextButton }: CaseDisplayProps) {
  const progress = workflowState.totalCount > 0 
    ? (workflowState.processedCount / workflowState.totalCount) * 100
    : 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Progress</CardTitle>
        <CardDescription>
          Processing status and current case information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Badge variant={
            workflowState.status === 'processing' ? 'default' :
            workflowState.status === 'paused' ? 'secondary' :
            workflowState.status === 'completed' ? 'outline' :
            workflowState.status === 'error' ? 'destructive' :
            'outline'
          }>
            {workflowState.status}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Mode</span>
          <Badge variant="outline">{workflowState.mode}</Badge>
        </div>
        
        {workflowState.currentCase && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Case</span>
            <span className="font-mono text-sm">{workflowState.currentCase}</span>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span>
              {workflowState.processedCount} / {workflowState.totalCount} cases
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {showNextButton && (
          <Button 
            onClick={onNextCase}
            className="w-full"
            variant="secondary"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Process Next Case
          </Button>
        )}
      </CardContent>
    </Card>
  );
}