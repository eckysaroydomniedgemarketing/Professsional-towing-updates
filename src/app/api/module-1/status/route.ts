import { NextResponse } from 'next/server'
import { 
  getPortalService, 
  getWorkflowError,
  getNavigationData,
  getPageInfo,
  getNavigationStep
} from '@/modules/module-1-rdn-portal/services/workflow-state.service'
import { NavigationStep } from '@/modules/module-1-rdn-portal/types'

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
    const pageInfo = getPageInfo()
    const navStep = getNavigationStep()
    
    console.log('[STATUS API] Returning navigation data:', navigationData)
    
    // Check if we're in PAGE_SELECTION state
    const currentStep = navStep === NavigationStep.PAGE_SELECTION ? NavigationStep.PAGE_SELECTION : state.currentStep
    
    return NextResponse.json({
      ...state,
      currentStep,
      currentUrl,
      workflowError: workflowError || undefined,
      data: navigationData || undefined,
      pageInfo: currentStep === NavigationStep.PAGE_SELECTION ? pageInfo : undefined
    })
  } catch (error) {
    return NextResponse.json({ 
      currentStep: 'ERROR',
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Failed to get status' 
    }, { status: 500 })
  }
}