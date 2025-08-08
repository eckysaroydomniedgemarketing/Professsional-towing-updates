import { NextRequest, NextResponse } from 'next/server';
import { visibilityLogService } from '@/modules/module-4-agent-visibility/services/visibility-log.service';
import { convertToCSV } from '@/modules/module-4-agent-visibility/utils/csv-export.utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse date parameters
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    // Validate dates
    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start date' },
        { status: 400 }
      );
    }
    
    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid end date' },
        { status: 400 }
      );
    }

    // Get report data with timeout
    let data = null;
    let error = null;
    
    try {
      const reportPromise = visibilityLogService.getVisibilityReport(startDate, endDate);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 10000)
      );
      
      const result = await Promise.race([reportPromise, timeoutPromise]) as any;
      data = result?.data;
      error = result?.error;
    } catch (fetchError) {
      error = fetchError;
    }
    
    if (error) {
      console.error('Error fetching report:', error);
      // Return empty report instead of failing
      return NextResponse.json({
        success: false,
        message: 'Unable to fetch report data. Database may be temporarily unavailable.',
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No data available for the specified date range'
      });
    }

    // Convert to CSV
    const csvContent = convertToCSV(data);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `visibility-report-${timestamp}.csv`;

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { 
        error: 'Failed to export report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate } = body;
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Get report data with timeout
    let data = null;
    let error = null;
    
    try {
      const reportPromise = visibilityLogService.getVisibilityReport(start, end);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 10000)
      );
      
      const result = await Promise.race([reportPromise, timeoutPromise]) as any;
      data = result?.data;
      error = result?.error;
    } catch (fetchError) {
      error = fetchError;
    }
    
    if (error) {
      console.error('Error fetching report:', error);
      // Return empty data instead of failing completely
      return NextResponse.json({
        success: false,
        data: [],
        count: 0,
        message: 'Unable to fetch report data. Database may be temporarily unavailable.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch report data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}