'use client';

import { Card } from '@/components/ui/card';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Processing...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
      <Card className="p-8 shadow-lg border-primary/20">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 animate-pulse" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{message}</p>
        </div>
      </Card>
    </div>
  );
}