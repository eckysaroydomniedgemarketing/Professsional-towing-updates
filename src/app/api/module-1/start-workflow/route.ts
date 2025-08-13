import { NextResponse } from 'next/server'
import { RDNPortalService } from '@/modules/module-1-rdn-portal/services/rdn-portal-service'
import { 
  setPortalService, 
  setWorkflowError, 
  clearWorkflowState,
  setNavigationData,
  getBrowserInitialized,
  setBrowserInitialized,
  getPortalService
} from '@/modules/module-1-rdn-portal/services/workflow-state.service'

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { isGetNextCase = false } = body
    
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
    
    let portalService: RDNPortalService
    
    // Check if we need to reuse existing browser for Get Next Case
    if (isGetNextCase && getBrowserInitialized() && getPortalService()) {
      // Reuse existing portal service
      portalService = getPortalService()!
      portalService.setGetNextCase(true)
      console.log('[API] Reusing existing browser for Get Next Case')
    } else {
      // Create new service instance
      portalService = new RDNPortalService(credentials, isGetNextCase)
      setPortalService(portalService)
      
      // Initialize the browser only for first time
      await portalService.initialize()
      setBrowserInitialized(true)
      console.log('[API] New browser initialized')
    }
    
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
            console.log('[API] Storing navigation data:', result.data)
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