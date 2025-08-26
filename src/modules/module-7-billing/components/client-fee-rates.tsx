'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClientFeeRate } from "../types";

interface ClientFeeRatesProps {
  clientName?: string;
  feeRates: ClientFeeRate[];
}

export function ClientFeeRates({ clientName, feeRates }: ClientFeeRatesProps) {
  const groupedRates = feeRates.reduce((acc, rate) => {
    if (!acc[rate.fee_category]) {
      acc[rate.fee_category] = [];
    }
    acc[rate.fee_category].push(rate);
    return acc;
  }, {} as Record<string, ClientFeeRate[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Fee Rates</CardTitle>
        <CardDescription>
          {clientName ? `Fee structure for ${clientName}` : 'No client selected'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {feeRates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fee rates available</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedRates).map(([category, rates]) => (
              <div key={category}>
                <h4 className="font-medium text-sm mb-2">{category}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Condition</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="text-sm">{rate.fee_type}</TableCell>
                        <TableCell className="text-sm">${rate.fee_amount}</TableCell>
                        <TableCell>
                          {rate.has_condition && (
                            <Badge variant="secondary" className="text-xs">
                              Conditional
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}