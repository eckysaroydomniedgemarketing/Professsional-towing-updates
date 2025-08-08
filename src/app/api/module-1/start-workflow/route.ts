import { NextResponse } from 'next/server'
import { RDNPortalService } from '@/modules/module-1-rdn-portal/services/rdn-portal-service'
import { 
  setPortalService, 
  setWorkflowError, 
  clearWorkflowState,
  setNavigationData 
} from '@/modules/module-1-rdn-portal/services/workflow-state.service'

export async function POST() {
  try {
    // Get credentials from environment variables
    const credentials = {
      username: process.env.RDN_USERNAME || '',
      password: process.env.RDN_PASSWORD || '',
      securityCode: process.env.RDN_SECURITY_CODE || ''
    }
    
    if (!credentials.username || !credentials.password || !credentials.securityCode) {
      throw new Error('Missing RDN credentials in environment variables')
    }
    
    // Clear any previous state
    clearWorkflowState()
    
    // Create new service instance
    const portalService = new RDNPortalService(credentials)
    setPortalService(portalService)
    
    // Initialize the browser
    await portalService.initialize()
    
    // Start the workflow in the background
    portalService.executeFullWorkflow()
      .then(result => {
        if (!result.success) {
          const error = result.error || 'Workflow failed'
          setWorkflowError(error)
          console.error('Workflow error:', error)
        } else {
          // Store the navigation data including case ID
          if (result.data) {
            setNavigationData(result.data)
          }
        }
      })
      .catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setWorkflowError(errorMessage)
        console.error('Workflow execution error:', error)
      })
    
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