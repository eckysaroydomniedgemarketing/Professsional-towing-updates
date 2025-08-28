import { NextRequest, NextResponse } from 'next/server'
import { OpenRouterService } from '@/modules/case-processing/services/openrouter.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { selectedAddress, agentUpdate, selectedTemplate } = body

    // Validate input
    if (!selectedAddress || !agentUpdate || !selectedTemplate) {
      return NextResponse.json(
        { error: 'Missing required fields: selectedAddress, agentUpdate, and selectedTemplate' },
        { status: 400 }
      )
    }

    // Process through OpenRouter
    const result = await OpenRouterService.processAgentUpdate({
      selectedAddress,
      agentUpdate,
      selectedTemplate
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        processedContent: result.processedContent
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to process update'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('[Process Agent Update API] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process agent update'
    }, { status: 500 })
  }
}