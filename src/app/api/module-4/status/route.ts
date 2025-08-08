import { NextRequest, NextResponse } from 'next/server';
import { workflowManagerService } from '@/modules/module-4-agent-visibility/services/workflow-manager.service';
import { visibilityLogService } from '@/modules/module-4-agent-visibility/services/visibility-log.service';

export async function GET(request: NextRequest) {
  try {
    // Get current workflow state
    const workflowState = workflowManagerService.getState();
    
    // Initialize default stats
    let stats = {
      totalCases: 0,
      totalUpdates: 0,
      manualCases: 0,
      automaticCases: 0,
      skippedCases: 0
    };
    
    // Try to get today's processing statistics with timeout
    try {
      const statsPromise = visibilityLogService.getProcessingStats();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Stats fetch timeout')), 5000)
      );
      
      const result = await Promise.race([statsPromise, timeoutPromise]) as any;
      
      if (result?.data) {
        stats = result.data;
      } else if (result?.error) {
        console.warn('Stats fetch error (non-critical):', result.error);
      }
    } catch (statsError) {
      // Log but don't fail the entire request
      console.warn('Failed to fetch processing stats (non-critical):', statsError);
    }

    return NextResponse.json({
      success: true,
      workflow: workflowState,
      statistics: stats,
      health: {
        database: stats !== null ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    console.error('Error getting workflow status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get workflow status',
        details: error instanceof Error ? error.message : 'Unknown error',
        workflow: {
          status: 'error',
          isRunning: false
        },
        statistics: {
          totalCases: 0,
          totalUpdates: 0,
          manualCases: 0,
          automaticCases: 0,
          skippedCases: 0
        }
      },
      { status: 500 }
    );
  }
}