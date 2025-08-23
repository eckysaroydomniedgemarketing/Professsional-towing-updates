'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WorkflowState } from '../types';

interface CaseDisplayProps {
  workflowState: WorkflowState;
  onNextCase?: () => void;
  showNextButton?: boolean;
}

export function CaseDisplay({ 
  workflowState, 
  onNextCase,
  showNextButton = false 
}: CaseDisplayProps) {
  const progressPercentage = workflowState.totalCount > 0
    ? (workflowState.processedCount / workflowState.totalCount) * 100
    : 0;
    
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'default';
      case 'paused': return 'secondary';
      case 'completed': return 'default';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Current Processing Status</span>
          <Badge variant={getStatusColor(workflowState.status)}>
            {workflowState.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Cases Found</p>
            <p className="text-2xl font-bold">{workflowState.totalCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Processed</p>
            <p className="text-2xl font-bold">
              {workflowState.processedCount} of {workflowState.totalCount}
            </p>
          </div>
        </div>
        
        {workflowState.currentCase && (
          <div>
            <p className="text-sm text-muted-foreground">Current Case</p>
            <p className="text-lg font-mono">{workflowState.currentCase}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} />
        </div>
        
        {workflowState.status === 'processing' && (
          <div className="text-sm text-muted-foreground">
            Action: Changing status to Hold...
          </div>
        )}
        
        {showNextButton && workflowState.mode === 'manual' && workflowState.status === 'paused' && (
          <Button onClick={onNextCase} className="w-full">
            Continue to Next Case
          </Button>
        )}
        
        {workflowState.errors.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">Errors:</p>
            {workflowState.errors.slice(-3).map((error, index) => (
              <p key={index} className="text-xs text-destructive">
                {error}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}