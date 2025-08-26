'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface InvoiceDisplayItem {
  id: number;
  case_id: string;
  invoice_number: string;
  service_date: string;
  service_name: string;
  cost: number;
}

interface InvoiceDataDisplayProps {
  invoiceData: InvoiceDisplayItem[];
  caseId: string;
}

export function InvoiceDataDisplay({ invoiceData, caseId }: InvoiceDataDisplayProps) {
  // Group items by invoice number
  const groupedData = invoiceData.reduce((acc, item) => {
    if (!acc[item.invoice_number]) {
      acc[item.invoice_number] = [];
    }
    acc[item.invoice_number].push(item);
    return acc;
  }, {} as Record<string, InvoiceDisplayItem[]>);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cost);
  };

  if (invoiceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Data - Case #{caseId}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No invoice data found for this case
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedData).map(([invoiceNumber, items]) => (
        <Card key={invoiceNumber}>
          <CardHeader>
            <CardTitle className="text-lg">
              Invoice #{invoiceNumber}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Service Rendered</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.service_date)}</TableCell>
                    <TableCell>{item.service_name}</TableCell>
                    <TableCell className="text-right">
                      {formatCost(item.cost)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} className="font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCost(items.reduce((sum, item) => sum + item.cost, 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Grand Total</span>
            <span className="text-lg font-bold">
              {formatCost(invoiceData.reduce((sum, item) => sum + item.cost, 0))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}