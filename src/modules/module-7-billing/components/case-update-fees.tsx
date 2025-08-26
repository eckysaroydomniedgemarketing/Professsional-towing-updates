'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceData } from "../types";

interface CaseUpdateFeesProps {
  invoiceData: InvoiceData[];
  caseId?: string;
}

export function CaseUpdateFees({ invoiceData, caseId }: CaseUpdateFeesProps) {
  const groupedByInvoice = invoiceData.reduce((acc, item) => {
    if (!acc[item.invoice_number]) {
      acc[item.invoice_number] = [];
    }
    acc[item.invoice_number].push(item);
    return acc;
  }, {} as Record<string, InvoiceData[]>);

  const calculateTotal = () => {
    return invoiceData.reduce((sum, item) => {
      const cost = parseFloat(item.cost) || 0;
      return sum + cost;
    }, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Invoice Data</CardTitle>
        <CardDescription>
          {caseId ? `Extracted fees for case ${caseId}` : 'No case selected'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoiceData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoice data available</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByInvoice).map(([invoiceNumber, items]) => (
              <div key={invoiceNumber}>
                <h4 className="font-medium text-sm mb-2">Invoice: {invoiceNumber}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={`${invoiceNumber}-${index}`}>
                        <TableCell className="text-sm">
                          {new Date(item.service_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">{item.service_name}</TableCell>
                        <TableCell className="text-sm text-right">
                          ${parseFloat(item.cost).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="font-bold">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}