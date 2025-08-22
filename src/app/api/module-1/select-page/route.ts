import { NextResponse } from 'next/server'
import { 
  getPortalService,
  setSelectedPage,
  setNavigationStep,
  setNavigationData
} from '@/modules/module-1-rdn-portal/services/workflow-state.service'
import { NavigationStep } from '@/modules/module-1-rdn-portal/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pageNumber } = body
    
    if (!pageNumber || typeof pageNumber !== 'number') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid page number' 
      }, { status: 400 })
    }
    
    const portalService = getPortalService()
    if (!portalService) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active workflow session' 
      }, { status: 400 })
    }
    
    // Store the selected page
    setSelectedPage(pageNumber)
    
    // Update navigation step to continue workflow
    setNavigationStep(NavigationStep.CASE_LISTING)
    
    // Trigger page navigation
    const navResult = await portalService.navigateToPage(pageNumber)
    
    if (!navResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: navResult.error || 'Failed to navigate to page' 
      }, { status: 500 })
    }
    
    // Continue workflow after successful page navigation
    console.log('[SELECT-PAGE API] Page navigation successful, continuing workflow')
    const continueResult = await portalService.continueAfterPageSelection()
    
    if (!continueResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: continueResult.error || 'Failed to continue workflow after page selection' 
      }, { status: 500 })
    }
    
    // Store the navigation data
    if (continueResult.data) {
      console.log('[SELECT-PAGE API] Storing navigation data:', continueResult.data)
      setNavigationData(continueResult.data)
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Navigated to page ${pageNumber} and continued workflow`,
      data: continueResult.data
    })
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to select page' 
    }, { status: 500 })
  }
}