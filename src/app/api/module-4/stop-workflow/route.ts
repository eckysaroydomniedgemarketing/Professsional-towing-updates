import { NextRequest, NextResponse } from 'next/server';
import { workflowManagerService } from '@/modules/module-4-agent-visibility/services/workflow-manager.service';

export async function POST(request: NextRequest) {
  try {
    // Get current state
    const currentState = workflowManagerService.getState();
    
    if (!currentState.isRunning) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Workflow is not running' 
        },
        { status: 400 }
      );
    }

    // Stop the workflow
    workflowManagerService.stopWorkflow();

    return NextResponse.json({
      success: true,
      message: 'Workflow stopped',
      finalState: {
        processedCount: currentState.processedCount,
        totalUpdates: currentState.totalProcessed
      }
    });
  } catch (error) {
    console.error('Error stopping workflow:', error);
    return NextResponse.json(
      { 
        error: 'Failed to stop workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}