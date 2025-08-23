import { NextRequest, NextResponse } from 'next/server'
import { getPortalService } from '@/modules/module-1-rdn-portal/services/workflow-state.service'

export async function POST(request: NextRequest) {
  console.log('[Post Update API] Endpoint called')
  
  try {
    // Parse request body
    const body = await request.json()
    const { caseId, addressId, draftContent, addressText } = body
    
    console.log('[Post Update API] Request received:', {
      caseId,
      addressId,
      hasContent: !!draftContent,
      addressText
    })

    // Validate input
    if (!caseId || !addressId || !draftContent) {
      return NextResponse.json(
        { error: 'Missing required fields: caseId, addressId, and draftContent are required' },
        { status: 400 }
      )
    }

    // Get the existing portal service with active browser session
    const portalService = getPortalService()
    
    if (!portalService) {
      return NextResponse.json(
        { error: 'No active RDN portal session. Please start Module 1 workflow first.' },
        { status: 400 }
      )
    }

    // Use the portal service to post the update (pass caseId for auto-navigation)
    const result = await portalService.postUpdate(addressId, draftContent, addressText, caseId)
    
    if (result.success) {
      console.log('[Post Update API] Update posted successfully')
      return NextResponse.json({
        success: true,
        message: result.message || 'Update posted successfully to RDN portal'
      })
    } else {
      throw new Error(result.error || 'Failed to post update')
    }

  } catch (error) {
    console.error('[Post Update API] Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to post update'
    }, { status: 500 })
  }
}