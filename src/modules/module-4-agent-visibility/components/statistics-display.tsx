'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatisticsProps {
  stats: {
    totalCases: number;
    totalUpdates: number;
    manualCases: number;
    automaticCases: number;
    skippedCases: number;
  };
}

export function StatisticsDisplay({ stats }: StatisticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 justify-between">
          {/* Total Cases */}
          <div className="flex flex-col items-center">
            <Badge variant="default" className="px-4 py-2">
              <span className="text-lg font-semibold">{stats.totalCases}</span>
            </Badge>
            <span className="text-sm text-muted-foreground mt-1">Cases</span>
          </div>

          {/* Total Updates */}
          <div className="flex flex-col items-center">
            <Badge variant="secondary" className="px-4 py-2">
              <span className="text-lg font-semibold">{stats.totalUpdates}</span>
            </Badge>
            <span className="text-sm text-muted-foreground mt-1">Updates</span>
          </div>

          {/* Manual Cases */}
          <div className="flex flex-col items-center">
            <Badge variant="outline" className="px-4 py-2">
              <span className="text-lg font-semibold">{stats.manualCases}</span>
            </Badge>
            <span className="text-sm text-muted-foreground mt-1">Manual</span>
          </div>

          {/* Automatic Cases */}
          <div className="flex flex-col items-center">
            <Badge variant="outline" className="px-4 py-2">
              <span className="text-lg font-semibold">{stats.automaticCases}</span>
            </Badge>
            <span className="text-sm text-muted-foreground mt-1">Auto</span>
          </div>

          {/* Skipped Cases */}
          <div className="flex flex-col items-center">
            <Badge variant="secondary" className="px-4 py-2">
              <span className="text-lg font-semibold">{stats.skippedCases}</span>
            </Badge>
            <span className="text-sm text-muted-foreground mt-1">Skipped</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}