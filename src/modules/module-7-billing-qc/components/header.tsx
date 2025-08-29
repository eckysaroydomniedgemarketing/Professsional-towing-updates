'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface HeaderProps {
  caseId: string;
  onCaseIdChange: (value: string) => void;
  onLoadCase: () => void;
  onClearCase: () => void;
  status: 'ready' | 'loading' | 'loaded' | 'error';
  isLoading?: boolean;
  error?: string | null;
}

export function Header({
  caseId,
  onCaseIdChange,
  onLoadCase,
  onClearCase,
  status,
  isLoading = false,
  error = null
}: HeaderProps) {
  const [showValidation, setShowValidation] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Validate case ID format (simple validation for demo)
  const validateCaseId = (value: string) => {
    if (!value.trim()) {
      setValidationMessage('Case ID is required');
      return false;
    }
    if (value.length < 3) {
      setValidationMessage('Case ID must be at least 3 characters');
      return false;
    }
    if (!/^[A-Za-z0-9-]+$/.test(value)) {
      setValidationMessage('Case ID can only contain letters, numbers, and hyphens');
      return false;
    }
    setValidationMessage('');
    return true;
  };

  const handleCaseIdChange = (value: string) => {
    onCaseIdChange(value);
    if (showValidation) {
      validateCaseId(value);
    }
  };

  const handleLoadClick = () => {
    const isValid = validateCaseId(caseId);
    setShowValidation(true);
    if (isValid) {
      onLoadCase();
    }
  };

  const handleClearClick = () => {
    setShowValidation(false);
    setValidationMessage('');
    onClearCase();
  };

  // Reset validation when status changes to loaded
  useEffect(() => {
    if (status === 'loaded') {
      setShowValidation(false);
      setValidationMessage('');
    }
  }, [status]);

  const getStatusVariant = () => {
    switch (status) {
      case 'error':
        return 'destructive';
      case 'loaded':
        return 'default';
      case 'loading':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'loaded':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Module 7: Billing QC Review
            </h1>
            <Separator className="mt-3 bg-primary/20" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label htmlFor="case-id-input" className="font-medium whitespace-nowrap">
                Case ID:
              </label>
              <div className="relative">
                <Input
                  id="case-id-input"
                  type="text"
                  placeholder="Enter case ID (e.g., CASE-12345)"
                  value={caseId}
                  onChange={(e) => handleCaseIdChange(e.target.value)}
                  className={`w-64 pr-10 ${showValidation && validationMessage ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleLoadClick();
                    }
                  }}
                />
                {isLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <Button
                onClick={handleLoadClick}
                disabled={isLoading}
                variant="default"
                className="transition-all duration-200 hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load'
                )}
              </Button>
              <Button
                onClick={handleClearClick}
                variant="outline"
                disabled={isLoading}
                className="transition-all duration-200 hover:scale-105"
              >
                Clear
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge variant={getStatusVariant()} className="flex items-center gap-1">
                {getStatusIcon()}
                {getStatusText()}
              </Badge>
            </div>
          </div>

          {/* Validation Message */}
          {showValidation && validationMessage && (
            <Alert variant="destructive" className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationMessage}</AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {status === 'error' && error && (
            <Alert variant="destructive" className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {status === 'loaded' && (
            <Alert className="mt-3 border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Case {caseId} loaded successfully. Ready for QC review.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </Card>
  );
}