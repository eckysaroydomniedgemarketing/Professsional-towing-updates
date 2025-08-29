'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSearch, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  onGetStarted?: () => void;
}

export function EmptyState({ onGetStarted }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/5">
      <div className="p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <FileSearch className="h-10 w-10 text-primary/60" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs text-primary-foreground font-bold">QC</span>
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">No Case Loaded</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
          Enter a case ID and click Load to begin the billing QC review process. 
          The system will automatically fetch fees, invoice data, and perform variance analysis.
        </p>
        
        {onGetStarted && (
          <Button 
            onClick={onGetStarted}
            className="transition-all duration-200 hover:scale-105"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        
        <div className="mt-8 pt-6 border-t border-muted-foreground/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-primary mb-1">Step 1</div>
              <div className="text-muted-foreground">Enter Case ID</div>
            </div>
            <div>
              <div className="font-medium text-primary mb-1">Step 2</div>
              <div className="text-muted-foreground">Load & Analyze</div>
            </div>
            <div>
              <div className="font-medium text-primary mb-1">Step 3</div>
              <div className="text-muted-foreground">Review & Approve</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}