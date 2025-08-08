import { NextResponse } from 'next/server'
import { 
  getPortalService, 
  clearWorkflowState 
} from '@/modules/module-1-rdn-portal/services/workflow-state.service'

export async function POST() {
  try {
    const portalService = getPortalService()
    
    if (portalService) {
      await portalService.close()
      clearWorkflowState()
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Workflow stopped' 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to stop workflow' 
    }, { status: 500 })
  }
}