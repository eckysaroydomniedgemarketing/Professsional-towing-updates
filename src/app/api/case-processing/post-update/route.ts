import { NextRequest, NextResponse } from 'next/server'
import { getPortalService } from '@/modules/module-1-rdn-portal/services/workflow-state.service'
import { saveUpdateHistory } from '@/modules/case-processing/services/update-history.service'

export async function POST(request: NextRequest) {
  console.log('[Post Update API] Endpoint called')
  
  let body: any = null
  let historySaved = false
  
  try {
    // Parse request body
    body = await request.json()
    const { caseId, addressId, draftContent, addressText, postingMode = 'manual', sessionId, autoClickProtocol = false } = body
    
    console.log('[Post Update API] Request received:', {
      caseId,
      addressId,
      hasContent: !!draftContent,
      addressText,
      postingMode
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
    const result = await portalService.postUpdate(addressId, draftContent, addressText, caseId, autoClickProtocol)
    
    // Save to database regardless of success/failure
    await saveUpdateHistory({
      case_id: caseId,
      update_content: draftContent,
      address_associated: addressText,
      posting_mode: postingMode as 'manual' | 'automatic',
      posting_status: result.success ? 'success' : 'failed',
      session_id: sessionId,
      error_message: result.success ? undefined : (result.error || 'Unknown error')
    })
    historySaved = true
    
    if (result.success) {
      console.log('[Post Update API] Update posted successfully and saved to database')
      return NextResponse.json({
        success: true,
        message: result.message || 'Update posted successfully to RDN portal'
      })
    } else {
      throw new Error(result.error || 'Failed to post update')
    }

  } catch (error) {
    console.error('[Post Update API] Error:', error)
    
    // Save failed attempt to database (if not already saved)
    if (body && !historySaved) {
      const { caseId, draftContent, addressText, postingMode = 'manual', sessionId } = body
      if (caseId && draftContent) {
        await saveUpdateHistory({
          case_id: caseId,
          update_content: draftContent,
          address_associated: addressText,
          posting_mode: postingMode as 'manual' | 'automatic',
          posting_status: 'failed',
          session_id: sessionId,
          error_message: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to post update'
    }, { status: 500 })
  }
}