'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Play, Square } from 'lucide-react';

interface WorkflowControlProps {
  isRunning: boolean;
  mode: 'manual' | 'automatic';
  status: 'idle' | 'processing' | 'error' | 'completed' | 'session_lost';
  sessionLostAtCase?: string;
  onStart: () => void;
  onStop: () => void;
  onModeChange: (mode: 'manual' | 'automatic') => void;
}

export function WorkflowControl({
  isRunning,
  mode,
  status,
  sessionLostAtCase,
  onStart,
  onStop,
  onModeChange
}: WorkflowControlProps) {
  const getStatusBadgeVariant = () => {
    switch (status) {
      case 'idle':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'error':
        return 'destructive';
      case 'session_lost':
        return 'destructive';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Idle';
      case 'processing':
        return 'Processing';
      case 'error':
        return 'Error';
      case 'session_lost':
        return sessionLostAtCase ? `Session Lost at Case ${sessionLostAtCase}` : 'Session Lost';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Control</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Start/Stop Button */}
          <div>
            {isRunning ? (
              <Button
                onClick={onStop}
                variant="destructive"
                size="lg"
                className="min-w-[160px]"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop Processing
              </Button>
            ) : (
              <Button
                onClick={onStart}
                size="lg"
                className="min-w-[160px]"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Processing
              </Button>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center space-x-3">
            <Label htmlFor="mode-switch" className="text-sm font-medium">
              Manual
            </Label>
            <Switch
              id="mode-switch"
              checked={mode === 'automatic'}
              onCheckedChange={(checked) => onModeChange(checked ? 'automatic' : 'manual')}
              disabled={isRunning}
            />
            <Label htmlFor="mode-switch" className="text-sm font-medium">
              Automatic
            </Label>
          </div>

          {/* Status Badge */}
          <Badge variant={getStatusBadgeVariant()} className="px-3 py-1">
            <span className="mr-2">●</span>
            {getStatusText()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}