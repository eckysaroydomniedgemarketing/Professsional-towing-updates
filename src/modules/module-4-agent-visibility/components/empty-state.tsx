'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileX2, Play } from 'lucide-react';

interface EmptyStateProps {
  onStart: () => void;
}

export function EmptyState({ onStart }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileX2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Cases to Process</h3>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
          There are no cases with agent updates that need visibility changes. 
          Click the button below to check for new cases.
        </p>
        <Button onClick={onStart} size="lg">
          <Play className="mr-2 h-4 w-4" />
          Start Processing
        </Button>
      </CardContent>
    </Card>
  );
}