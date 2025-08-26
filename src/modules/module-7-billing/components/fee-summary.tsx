'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";

interface FeeSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
  onGenerateInvoice: () => void;
  hasData: boolean;
}

export function FeeSummary({ subtotal, tax, total, onGenerateInvoice, hasData }: FeeSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Summary</CardTitle>
        <CardDescription>
          Total billing calculation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <p className="text-sm text-muted-foreground">No billing data available</p>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Button 
              onClick={onGenerateInvoice}
              className="w-full"
              disabled={total === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}