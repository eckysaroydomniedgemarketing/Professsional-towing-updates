'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, InfoIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BillingStaticPage() {
  // Real data from database - Case 2036410535 with actual invoice data
  const sampleCaseInfo = {
    caseId: "2036410535",
    clientName: "Select Remarketing Group",
    lienHolder: "LOANMAX SOUTH HILL",
    status: "Voluntary Repo",
    orderDate: "2015-01-27",
    refNumber: "51607"
  };

  const sampleVehicleInfo = {
    vin: "1G2NW52E32M556247",
    make: "Pontiac",
    model: "Grand Am",
    year: "2002",
    color: "Silver",
    licenseplate: "N/A"
  };

  const sampleAddresses = [
    {
      type: "Borrower - Home",
      street: "609 E Atlantic St",
      city: "South Hill",
      state: "VA",
      zipCode: "23970",
      isCovered: false
    }
  ];

  // Fee rates from Credit Acceptance (as example since Select Remarketing Group has no rates defined)
  const sampleFeeRates = {
    "Voluntary": [
      { id: 1, fee_type: "Via LPS", fee_amount: "250.00", has_condition: true, condition: "Via LPS only" },
      { id: 2, fee_type: "Standard", fee_amount: "225.00", has_condition: false },
    ],
    "Involuntary": [
      { id: 3, fee_type: "Via LPS", fee_amount: "375.00", has_condition: true, condition: "Via LPS only" },
      { id: 4, fee_type: "Standard", fee_amount: "395.00", has_condition: false },
    ],
    "Storage": [
      { id: 5, fee_type: "Not Allowed", fee_amount: "0.00", has_condition: true, condition: "No storage allowed" },
    ],
    "Additional": [
      { id: 6, fee_type: "Other Fee", fee_amount: "75.00", has_condition: true, condition: "$75 or $35 depending on case" },
    ],
  };

  // Real invoice data from database
  const sampleInvoiceData = {
    "46368": [
      { service_date: "2015-01-28", service_name: "Voluntary", cost: "225.00" },
    ],
  };
  
  // Additional invoice data from second case for demonstration
  const additionalInvoiceData = {
    "94524": [
      { service_date: "2020-11-18", service_name: "Involuntary", cost: "395.00" },
    ],
  };

  // Calculate totals
  const calculateInvoiceTotal = () => {
    let total = 0;
    Object.values(sampleInvoiceData).forEach(items => {
      items.forEach(item => {
        total += parseFloat(item.cost);
      });
    });
    return total;
  };

  const subtotal = calculateInvoiceTotal();
  const tax = subtotal * 0.053; // 5.3% tax rate for Virginia
  const total = subtotal + tax;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Billing Management</h1>
          <p className="text-muted-foreground">Complete billing overview with real invoice data from database</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Invoice Data from Database
        </Badge>
      </div>

      {/* Case Details Bar */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription className="flex gap-4 flex-wrap">
          <span><strong>Case ID:</strong> {sampleCaseInfo.caseId}</span>
          <span><strong>Ref #:</strong> {sampleCaseInfo.refNumber}</span>
          <span><strong>Client:</strong> {sampleCaseInfo.clientName}</span>
          <span><strong>Lien Holder:</strong> {sampleCaseInfo.lienHolder}</span>
          <span><strong>Status:</strong> {sampleCaseInfo.status}</span>
          <span><strong>Order Date:</strong> {new Date(sampleCaseInfo.orderDate).toLocaleDateString()}</span>
        </AlertDescription>
      </Alert>

      {/* Three Main Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Client Fee Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Standard Fee Rates</CardTitle>
            <CardDescription>
              Fee structure (Credit Acceptance rates shown as example)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {Object.entries(sampleFeeRates).map(([category, rates]) => (
                <div key={category}>
                  <h4 className="font-medium text-sm mb-2">{category}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rates.map((rate) => (
                        <TableRow key={rate.id}>
                          <TableCell className="text-xs py-2">{rate.fee_type}</TableCell>
                          <TableCell className="text-xs py-2">${rate.fee_amount}</TableCell>
                          <TableCell className="text-xs py-2">
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
          </CardContent>
        </Card>

        {/* Card 2: Case Invoice Data */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Data (From Database)</CardTitle>
            <CardDescription>
              Actual invoices for case {sampleCaseInfo.caseId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              <div className="bg-blue-50 p-2 rounded text-xs">
                <strong>Note:</strong> This is real data from the invoice_data table
              </div>
              
              {Object.entries(sampleInvoiceData).map(([invoiceNumber, items]) => (
                <div key={invoiceNumber}>
                  <h4 className="font-medium text-sm mb-2">Invoice #: {invoiceNumber}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Service</TableHead>
                        <TableHead className="text-xs text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={`${invoiceNumber}-${index}`}>
                          <TableCell className="text-xs py-2">
                            {new Date(item.service_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs py-2">{item.service_name}</TableCell>
                          <TableCell className="text-xs py-2 text-right">
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
                  <span className="font-medium">Invoice Total:</span>
                  <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Fee Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Summary</CardTitle>
            <CardDescription>
              Total billing calculation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax (5.3% VA)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-green-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <h4 className="font-medium text-sm mb-2">Services Breakdown</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Voluntary Repo Service</span>
                  <span>$225.00</span>
                </div>
              </div>
              
              <div className="mt-3 p-2 bg-gray-50 rounded">
                <p className="text-xs text-muted-foreground">
                  <strong>Database Info:</strong> This case has 1 invoice record in the invoice_data table.
                  Invoice #46368 dated {new Date("2015-01-28").toLocaleDateString()}.
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Generate Invoice
              </Button>
              <Button variant="outline" className="w-full">
                Export as PDF
              </Button>
              <Button variant="outline" className="w-full">
                Send to Client
              </Button>
            </div>

            <div className="pt-4 space-y-2">
              <div className="text-xs text-muted-foreground">
                <p><strong>Payment Terms:</strong> Net 30 days</p>
                <p><strong>Due Date:</strong> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                <p><strong>Invoice Generated:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">VIN:</span>
                <span>{sampleVehicleInfo.vin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Year/Make/Model:</span>
                <span>{sampleVehicleInfo.year} {sampleVehicleInfo.make} {sampleVehicleInfo.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Color:</span>
                <span>{sampleVehicleInfo.color}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">License Plate:</span>
                <span>{sampleVehicleInfo.licenseplate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {sampleAddresses.map((addr, idx) => (
                <div key={idx} className="pb-2 border-b last:border-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground font-medium">{addr.type}:</span>
                    <Badge variant={addr.isCovered ? "success" : "secondary"} className="text-xs">
                      {addr.isCovered ? "Covered" : "Not Covered"}
                    </Badge>
                  </div>
                  <div className="text-xs">
                    <p>{addr.street}</p>
                    <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                  </div>
                </div>
              ))}
              
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-muted-foreground">
                  <p><strong>Service Type:</strong> {sampleCaseInfo.status}</p>
                  <p><strong>Service Date:</strong> {new Date("2015-01-28").toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}