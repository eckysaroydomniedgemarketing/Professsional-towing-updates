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

    workflowService.stopWorkflow();
    const state = workflowService.getState();
    
    return NextResponse.json({
      success: true,
      message: 'Workflow stopped',
      state
    });
  } catch (error) {
    console.error('[MODULE-6] Error stopping workflow:', error);
    return NextResponse.json(
      { 
        error: 'Failed to stop workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}