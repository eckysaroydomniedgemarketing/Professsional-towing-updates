'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Trash2 } from 'lucide-react';

interface ReportTableProps {
  data: Array<{
    id?: string;
    date: string;
    caseId: string;
    updates: number;
    status: 'Processed' | 'Skipped';
  }>;
  onExport: () => void;
  onExportPDF?: () => void;
  onDelete?: (logId: string) => void;
}

export function ReportTable({ data, onExport, onExportPDF, onDelete }: ReportTableProps) {
  const getStatusBadge = (status: 'Processed' | 'Skipped') => {
    if (status === 'Processed') {
      return <Badge variant="default">Processed</Badge>;
    }
    return <Badge variant="secondary">Skipped</Badge>;
  };

  const handleDelete = (logId: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      onDelete?.(logId);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Processing Report</CardTitle>
        <div className="flex gap-2">
          <Button
            onClick={onExport}
            variant="secondary"
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
          {onExportPDF && (
            <Button
              onClick={onExportPDF}
              variant="secondary"
              size="sm"
            >
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date (IST)</TableHead>
                  <TableHead>Case ID</TableHead>
                  <TableHead className="text-center">Updates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={`${row.caseId}-${index}`}>
                    <TableCell className="font-medium">{row.date}</TableCell>
                    <TableCell>{row.caseId}</TableCell>
                    <TableCell className="text-center">{row.updates}</TableCell>
                    <TableCell>{getStatusBadge(row.status)}</TableCell>
                    <TableCell className="text-center">
                      {row.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(row.id!)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                          title="Delete record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No processing data available yet. Start processing cases to see the report.
          </div>
        )}
      </CardContent>
    </Card>
  );
}