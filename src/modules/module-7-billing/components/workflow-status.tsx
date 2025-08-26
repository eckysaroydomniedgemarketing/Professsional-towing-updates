'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";

interface WorkflowStatusProps {
  status: string;
  progress: {
    login: boolean;
    navigation: boolean;
    extraction: boolean;
    storage: boolean;
  };
  error?: string;
}

export function WorkflowStatus({ status, progress, error }: WorkflowStatusProps) {
  const steps = [
    { key: 'login', label: 'RDN Portal Login', completed: progress.login },
    { key: 'navigation', label: 'Navigate to Case', completed: progress.navigation },
    { key: 'extraction', label: 'Extract Data', completed: progress.extraction },
    { key: 'storage', label: 'Store & Display', completed: progress.storage },
  ];

  const getStepIcon = (step: typeof steps[0], currentStatus: string) => {
    if (step.completed) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (currentStatus === step.key) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
    return <Circle className="h-5 w-5 text-gray-300" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center space-x-3">
            {getStepIcon(step, status)}
            <span className={`text-sm ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
          </div>
        ))}

        {error && (
          <div className="flex items-start space-x-2 p-3 bg-destructive/10 rounded-md">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}