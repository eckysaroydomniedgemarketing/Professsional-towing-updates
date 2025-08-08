import { NextResponse } from 'next/server'
import { 
  getPortalService, 
  getWorkflowError,
  getNavigationData 
} from '@/modules/module-1-rdn-portal/services/workflow-state.service'

export async function GET() {
  try {
    const portalService = getPortalService()
    const workflowError = getWorkflowError()
    
    if (!portalService) {
      return NextResponse.json({ 
        currentStep: 'INITIAL',
        isAuthenticated: false,
        error: 'No active workflow' 
      })
    }
    
    const state = await portalService.getState()
    const currentUrl = await portalService.getCurrentUrl()
    const navigationData = getNavigationData()
    
    return NextResponse.json({
      ...state,
      currentUrl,
      workflowError: workflowError || undefined,
      data: navigationData || undefined
    })
  } catch (error) {
    return NextResponse.json({ 
      currentStep: 'ERROR',
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Failed to get status' 
    }, { status: 500 })
  }
}