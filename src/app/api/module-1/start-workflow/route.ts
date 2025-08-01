import { NextResponse } from 'next/server'
import { RDNPortalService } from '@/modules/module-1-rdn-portal/services/rdn-portal-service'

// Store service instance globally (in production, use a proper state management solution)
let portalService: RDNPortalService | null = null

export async function POST() {
  try {
    // Get credentials from environment variables
    const credentials = {
      username: 'Aayat',
      password: 'ProTow4711!',
      securityCode: '3107'
    }
    
    // Create new service instance
    portalService = new RDNPortalService(credentials)
    
    // Start the workflow in the background
    portalService.executeFullWorkflow().catch(console.error)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Workflow started' 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to start workflow' 
    }, { status: 500 })
  }
}

export { portalService }