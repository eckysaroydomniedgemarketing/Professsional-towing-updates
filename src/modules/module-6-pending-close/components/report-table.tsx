'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Download, CheckCircle, XCircle } from 'lucide-react';
import type { PendingCloseLog, WorkflowStats } from '../types';

interface ReportTableProps {
  cases: PendingCloseLog[];
  stats: WorkflowStats;
  onRefresh: () => void;
  onExport: () => void;
  isLoading: boolean;
}

export function ReportTable({ cases, stats, onRefresh, onExport, isLoading }: ReportTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Processing Report</CardTitle>
            <CardDescription>
              Cases processed today
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={cases.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Processed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.success}</p>
            <p className="text-sm text-muted-foreground">Successful</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-sm text-muted-foreground">Failed</p>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead>Status Change</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No cases processed today
                  </TableCell>
                </TableRow>
              ) : (
                cases.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono">{log.case_id}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.vin_number || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{log.previous_status}</Badge>
                        <span>→</span>
                        <Badge>{log.new_status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.action_taken === 'status_changed' ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Success
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <XCircle className="w-4 h-4 mr-1" />
                          Failed
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.processing_mode}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.processed_at 
                        ? new Date(log.processed_at).toLocaleTimeString()
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}