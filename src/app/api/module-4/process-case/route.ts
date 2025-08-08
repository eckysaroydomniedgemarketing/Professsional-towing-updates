import { NextRequest, NextResponse } from 'next/server';
import { workflowManagerService } from '@/modules/module-4-agent-visibility/services/workflow-manager.service';

export async function POST(request: NextRequest) {
  try {
    // Get current state
    const currentState = workflowManagerService.getState();
    
    // Check if workflow is running in manual mode
    if (!currentState.isRunning) {
      return NextResponse.json(
        { 
          error: 'Workflow is not running. Please start the workflow first.' 
        },
        { status: 400 }
      );
    }

    if (currentState.mode !== 'manual') {
      return NextResponse.json(
        { 
          error: 'Workflow is in automatic mode. Manual processing not allowed.' 
        },
        { status: 400 }
      );
    }

    // Process the next case
    const processed = await workflowManagerService.processNextCase();
    
    if (!processed) {
      return NextResponse.json({
        success: true,
        message: 'No more cases to process',
        completed: true,
        state: workflowManagerService.getState()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Case processed successfully',
      completed: false,
      state: workflowManagerService.getState()
    });
  } catch (error) {
    console.error('Error processing case:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process case',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}