'use client';

import { useState, useEffect } from 'react';
import { InvoiceDataDisplay } from './invoice-data-display';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface InvoicePageProps {
  caseId: string;
  onComplete?: () => void;
}

export function InvoicePage({ caseId, onComplete }: InvoicePageProps) {
  const [invoiceData, setInvoiceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchInvoiceData = async () => {
    try {
      const response = await fetch(`/api/invoice-data?caseId=${caseId}`);
      const data = await response.json();
      setInvoiceData(data);
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      setMessage('Error loading invoice data');
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, [caseId]);

  const handleExtractInvoices = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/extract-invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caseId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(result.message);
        // Refresh the data
        await fetchInvoiceData();
      } else {
        setMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToUpdates = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoice Data Extraction</h2>
        <div className="space-x-2">
          <Button 
            onClick={handleExtractInvoices}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Extract Invoices
          </Button>
          <Button 
            variant="outline"
            onClick={handleProceedToUpdates}
          >
            Proceed to Updates Tab
          </Button>
        </div>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <InvoiceDataDisplay 
        invoiceData={invoiceData} 
        caseId={caseId}
      />
    </div>
  );
}