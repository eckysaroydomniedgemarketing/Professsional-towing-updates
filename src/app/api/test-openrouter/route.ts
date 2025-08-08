import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OpenRouterService } from '@/modules/case-processing/services/openrouter.service'
import { checkAgentUpdateExists } from '@/modules/case-processing/services/agent-update-validation.service'

export async function GET(request: Request) {
  try {
    // Get case ID from query params (optional)
    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId') || 'test-case-001'
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // STEP 1: Check for Agent Updates FIRST
    console.log('Checking for agent updates for case:', caseId)
    const agentUpdateValidation = await checkAgentUpdateExists(caseId)
    
    // If no agent updates found, reject the case immediately
    if (!agentUpdateValidation.hasAgentUpdate) {
      return NextResponse.json({
        success: false,
        caseId: caseId,
        eligibilityStatus: 'REJECTED',
        rejectionReason: 'NO_AGENT_UPDATES',
        validation: {
          hasAgentUpdate: false,
          message: agentUpdateValidation.validationMessage,
          agentUpdateCount: 0,
          totalUpdatesInBatch: agentUpdateValidation.totalUpdatesInBatch || 0
        },
        recommendation: 'Case not eligible for processing. No agent updates found. Please select next case.',
        nextAction: 'GET_NEXT_CASE'
      })
    }
    
    // Fetch real update history from Supabase
    const { data: updates, error } = await supabase
      .from('case_update_history')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Error fetching updates:', error)
      // Use sample data if database fetch fails
      const sampleUpdates = [
        'Called customer no answer',
        'Unit located via DRN hit at parking lot',
        'Attempted recovery but gate was locked'
      ]
      
      // Call OpenRouter with sample data
      const result = await OpenRouterService.analyzeUpdateHistory(sampleUpdates)
      
      return NextResponse.json({
        success: true,
        source: 'sample_data',
        caseId: caseId,
        agentUpdateValidation: {
          hasAgentUpdate: true,
          agentUpdateCount: agentUpdateValidation.agentUpdateCount,
          agentUpdateAuthors: agentUpdateValidation.agentUpdateAuthors,
          message: 'Agent updates found (sample mode)'
        },
        updates: sampleUpdates,
        analysisResult: result,
        error: 'Database fetch failed, using sample data'
      })
    }
    
    // Extract update details
    const updateTexts = updates
      ?.map(u => u.update_content)
      ?.filter(content => content && content.trim()) || []
    
    // If no valid updates, use sample data
    if (updateTexts.length === 0) {
      const sampleUpdates = [
        'Called customer no answer',
        'Unit located via DRN hit at parking lot',
        'Attempted recovery but gate was locked'
      ]
      
      const result = await OpenRouterService.analyzeUpdateHistory(sampleUpdates)
      
      return NextResponse.json({
        success: true,
        source: 'sample_data',
        reason: updates ? 'All updates empty' : 'No updates found',
        caseId: caseId,
        agentUpdateValidation: {
          hasAgentUpdate: true,
          agentUpdateCount: agentUpdateValidation.agentUpdateCount,
          agentUpdateAuthors: agentUpdateValidation.agentUpdateAuthors,
          message: 'Agent updates found (sample mode)'
        },
        sampleUpdates: sampleUpdates,
        analysisResult: result
      })
    }
    
    // Call OpenRouter service with real data
    const analysisResult = await OpenRouterService.analyzeUpdateHistory(updateTexts)
    
    return NextResponse.json({
      success: true,
      source: 'database',
      caseId: caseId,
      eligibilityStatus: analysisResult.hasExclusionKeyword ? 'REJECTED' : 'ELIGIBLE',
      agentUpdateValidation: {
        hasAgentUpdate: true,
        agentUpdateCount: agentUpdateValidation.agentUpdateCount,
        agentUpdateAuthors: agentUpdateValidation.agentUpdateAuthors,
        totalUpdatesInBatch: agentUpdateValidation.totalUpdatesInBatch
      },
      updateCount: updateTexts.length,
      updates: updateTexts,
      exclusionKeywordAnalysis: analysisResult,
      rawResponse: analysisResult.details.rawResponse,
      markdownDetected: analysisResult.details.rawResponse?.includes('```'),
      recommendation: analysisResult.hasExclusionKeyword 
        ? 'Case has exclusion keywords. Not eligible for update.'
        : 'Case is eligible for update. Proceed to property verification.'
    })
    
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}