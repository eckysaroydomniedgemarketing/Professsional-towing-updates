import { NextResponse } from 'next/server'
import { portalService } from '../start-workflow/route'

export async function GET() {
  try {
    if (!portalService) {
      return NextResponse.json({ 
        currentStep: 'INITIAL',
        error: 'No active workflow' 
      })
    }
    
    const state = await portalService.getState()
    const currentUrl = await portalService.getCurrentUrl()
    
    return NextResponse.json({
      ...state,
      currentUrl
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get status' 
    }, { status: 500 })
  }
}