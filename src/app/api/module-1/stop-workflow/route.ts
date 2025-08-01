import { NextResponse } from 'next/server'
import { portalService } from '../start-workflow/route'

export async function POST() {
  try {
    if (portalService) {
      await portalService.close()
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