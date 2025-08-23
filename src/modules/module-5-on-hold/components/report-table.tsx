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
import { Download, RefreshCw } from 'lucide-react';

interface ReportTableProps {
  cases: any[];
  stats: {
    total: number;
    success: number;
    failed: number;
  };
  onRefresh: () => void;
  onExport: () => void;
  isLoading?: boolean;
}

export function ReportTable({ 
  cases, 
  stats, 
  onRefresh, 
  onExport,
  isLoading = false 
}: ReportTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Processed Cases Report</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <div>
              Total: <span className="font-bold">{stats.total}</span>
            </div>
            <div>
              Success: <span className="font-bold text-green-600">{stats.success}</span>
            </div>
            <div>
              Failed: <span className="font-bold text-red-600">{stats.failed}</span>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Case ID</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No cases processed yet
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.slice(0, 10).map((caseItem, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(caseItem.created_at)}</TableCell>
                      <TableCell className="font-mono">{caseItem.case_id}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {caseItem.vin_number ? 
                          `${caseItem.vin_number.substring(0, 8)}...` : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={caseItem.new_status === 'Hold' ? 'default' : 'destructive'}>
                          {caseItem.new_status || 'Error'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {caseItem.processing_mode}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}