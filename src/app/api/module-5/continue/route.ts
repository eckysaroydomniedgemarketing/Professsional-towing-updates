import { NextResponse } from 'next/server';
import { workflowService } from '../start-workflow/route';

export async function POST() {
  try {
    if (!workflowService) {
      return NextResponse.json(
        { error: 'Workflow service not initialized' },
        { status: 400 }
      );
    }

    await workflowService.continueToNext();
    const state = workflowService.getState();
    
    return NextResponse.json({
      success: true,
      message: 'Continuing to next case',
      state
    });
  } catch (error) {
    console.error('[MODULE-5] Error continuing workflow:', error);
    return NextResponse.json(
      { 
        error: 'Failed to continue workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}