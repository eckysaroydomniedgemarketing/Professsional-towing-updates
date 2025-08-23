'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square } from 'lucide-react';
import type { ProcessingMode } from '../types';

interface WorkflowControlProps {
  mode: ProcessingMode;
  onModeChange: (mode: ProcessingMode) => void;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  canStart: boolean;
  canPause: boolean;
  canStop: boolean;
  isPaused: boolean;
}

export function WorkflowControl({
  mode,
  onModeChange,
  onStart,
  onPause,
  onStop,
  canStart,
  canPause,
  canStop,
  isPaused
}: WorkflowControlProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Control</CardTitle>
        <CardDescription>
          Manage the Pending Close processing workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Processing Mode</Label>
          <RadioGroup value={mode} onValueChange={(value) => onModeChange(value as ProcessingMode)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual">
                Manual - Process one case at a time with confirmation
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="automatic" id="automatic" />
              <Label htmlFor="automatic">
                Automatic - Process all cases continuously
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={onStart}
            disabled={!canStart}
            className="flex-1"
          >
            <Play className="w-4 h-4 mr-2" />
            Start
          </Button>
          
          <Button
            onClick={onPause}
            disabled={!canPause && !isPaused}
            variant={isPaused ? "secondary" : "outline"}
            className="flex-1"
          >
            <Pause className="w-4 h-4 mr-2" />
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          
          <Button
            onClick={onStop}
            disabled={!canStop}
            variant="destructive"
            className="flex-1"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}