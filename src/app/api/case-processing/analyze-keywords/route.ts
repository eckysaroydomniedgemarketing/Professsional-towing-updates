import { NextRequest, NextResponse } from 'next/server'
import { OpenRouterService } from '@/modules/case-processing/services/openrouter.service'

export async function POST(request: NextRequest) {
  console.log('[API Route] Analyze keywords endpoint called')
  
  try {
    // Parse request body
    const body = await request.json()
    const { updates } = body
    
    console.log('[API Route] Request received with', updates?.length || 0, 'updates')

    // Validate input
    if (!updates || !Array.isArray(updates)) {
      console.log('[API Route] Invalid input - updates array required')
      return NextResponse.json(
        { error: 'Invalid input: updates array required' },
        { status: 400 }
      )
    }

    // Call OpenRouter service on server-side where env variables are available
    console.log('[API Route] Calling OpenRouterService.analyzeUpdateHistory...')
    const result = await OpenRouterService.analyzeUpdateHistory(updates)
    console.log('[API Route] OpenRouter response:', {
      hasExclusionKeyword: result.hasExclusionKeyword,
      keywordFound: result.details.keywordFound
    })

    // Return formatted result
    return NextResponse.json({
      success: true,
      hasExclusionKeyword: result.hasExclusionKeyword,
      details: result.details
    })

  } catch (error) {
    console.error('API route error:', error)
    
    // For MVP, return safe default instead of blocking workflow
    return NextResponse.json({
      success: false,
      hasExclusionKeyword: false,
      details: {
        error: error instanceof Error ? error.message : 'Analysis failed',
        rawResponse: 'Service error - defaulting to no keywords found'
      }
    })
  }
}