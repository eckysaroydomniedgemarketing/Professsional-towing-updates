import { NextResponse } from 'next/server';
import { workflowService } from '../start-workflow/route';

export async function GET() {
  try {
    if (!workflowService) {
      return NextResponse.json({
        success: true,
        state: {
          status: 'idle',
          mode: 'manual',
          currentCase: null,
          processedCount: 0,
          totalCount: 0,
          errors: [],
          startTime: null,
          endTime: null
        }
      });
    }

    const state = workflowService.getState();
    
    return NextResponse.json({
      success: true,
      state
    });
  } catch (error) {
    console.error('[MODULE-6] Error getting status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get workflow status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}