import { NextRequest, NextResponse } from 'next/server';
import { BillingWorkflowService } from '@/modules/module-7-billing/services/billing-workflow.service';

export async function POST(request: NextRequest) {
  try {
    const { caseId } = await request.json();

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    const workflowService = new BillingWorkflowService();
    const result = await workflowService.executeWorkflow(caseId);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          steps: result.steps 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      steps: result.steps
    });

  } catch (error) {
    console.error('API billing-workflow error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Server error',
        steps: {
          login: false,
          navigation: false,
          extraction: false,
          storage: false
        }
      },
      { status: 500 }
    );
  }
}