'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square } from 'lucide-react';
import { ProcessingMode } from '../types';

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
        <CardTitle>Workflow Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Processing Mode</Label>
          <RadioGroup 
            value={mode} 
            onValueChange={(value) => onModeChange(value as ProcessingMode)}
            disabled={!canStart}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual">Manual</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="automatic" id="automatic" />
              <Label htmlFor="automatic">Automatic</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={onStart}
            disabled={!canStart}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start
          </Button>
          
          <Button
            onClick={onPause}
            disabled={!canPause && !isPaused}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Pause className="h-4 w-4" />
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          
          <Button
            onClick={onStop}
            disabled={!canStop}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Stop
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}