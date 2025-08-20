import { useEffect, useState } from "react"
import { Case, ExclusionKeywordResults } from "../types/case.types"
import { checkExclusionKeywordsInDatabase, DatabaseKeywordResult } from "../services/keyword-check.service"

export function useKeywordAnalysis(
  caseData: Case | undefined,
  hasAgentUpdate: boolean | undefined
) {
  const [keywordAnalysis, setKeywordAnalysis] = useState<ExclusionKeywordResults | null>(null)
  const [isAnalyzingKeywords, setIsAnalyzingKeywords] = useState(false)
  const [databaseKeywordResult, setDatabaseKeywordResult] = useState<DatabaseKeywordResult | null>(null)

  const analyzeExclusionKeywords = async () => {
    if (!caseData?.id) {
      setKeywordAnalysis({
        hasExclusionKeywords: false,
        analysisComplete: true,
        error: 'No case ID available'
      })
      return
    }

    setIsAnalyzingKeywords(true)
    try {
      // Step 1: Check database for obvious keywords
      console.log('[useKeywordAnalysis] Checking database for exclusion keywords...')
      const dbResult = await checkExclusionKeywordsInDatabase(caseData.id)
      setDatabaseKeywordResult(dbResult)
      
      if (dbResult.hasExclusionKeyword) {
        console.log('[useKeywordAnalysis] Database found exclusion keyword:', dbResult.keywordFound)
        // Set keyword analysis result from database check
        setKeywordAnalysis({
          hasExclusionKeywords: true,
          analysisComplete: true,
          keywords: {
            DRN: {
              found: dbResult.matchedPattern === 'DRN',
              keyword: 'DRN',
              description: 'Digital Recognition Network',
              location: dbResult.updateAuthor ? `Update by ${dbResult.updateAuthor}` : undefined,
              exactMatch: dbResult.keywordFound
            },
            LPR: {
              found: dbResult.matchedPattern === 'LPR',
              keyword: 'LPR',
              description: 'License Plate Reader',
              location: dbResult.updateAuthor ? `Update by ${dbResult.updateAuthor}` : undefined,
              exactMatch: dbResult.keywordFound
            },
            GPS: {
              found: dbResult.matchedPattern === 'GPS',
              keyword: 'GPS',
              description: 'Global Positioning System',
              location: dbResult.updateAuthor ? `Update by ${dbResult.updateAuthor}` : undefined,
              exactMatch: dbResult.keywordFound
            },
            SURRENDER: {
              found: dbResult.matchedPattern === 'SURRENDER',
              keyword: 'SURRENDER',
              description: 'Voluntary Surrender',
              location: dbResult.updateAuthor ? `Update by ${dbResult.updateAuthor}` : undefined,
              exactMatch: dbResult.keywordFound
            },
            UNIT_SPOTTED: {
              found: false,
              keyword: 'UNIT SPOTTED',
              description: 'Unit Spotted/Found',
            }
          },
          detectedBy: 'database'
        })
        setIsAnalyzingKeywords(false)
        return // Don't call OpenRouter API if database found keywords
      }
      
      console.log('[useKeywordAnalysis] No keywords found in database, proceeding to AI analysis...')
      
      // Step 2: If no keywords in database, continue with OpenRouter API
      if (!caseData.updates || caseData.updates.length === 0) {
        setKeywordAnalysis({
          hasExclusionKeywords: false,
          analysisComplete: true,
          error: 'No updates to analyze'
        })
        setIsAnalyzingKeywords(false)
        return
      }
      const updateTexts = caseData.updates.map(u => u.details).filter(Boolean)
      console.log('[useKeywordAnalysis] Sending', updateTexts.length, 'updates to API for analysis')
      
      // Call server-side API route instead of client-side service
      const response = await fetch('/api/case-processing/analyze-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates: updateTexts })
      })

      console.log('[useKeywordAnalysis] API response status:', response.status)
      const data = await response.json()
      console.log('[useKeywordAnalysis] API response data:', {
        success: data.success,
        hasExclusionKeyword: data.hasExclusionKeyword,
        keywordFound: data.details?.keywordFound
      })
      
      if (!data.success) {
        console.error('Keyword analysis failed:', data.details?.error)
        // For MVP, treat failures as no keywords found
        setKeywordAnalysis({
          hasExclusionKeywords: false,
          analysisComplete: true,
          error: data.details?.error || 'Analysis failed'
        })
        setIsAnalyzingKeywords(false)
        return
      }
      
      // Format result for UI
      const formattedResult: ExclusionKeywordResults = {
        hasExclusionKeywords: data.hasExclusionKeyword,
        analysisComplete: true,
        keywords: {
          DRN: {
            found: data.details?.keywordFound?.toLowerCase().includes('drn') || false,
            keyword: 'DRN',
            description: 'Digital Recognition Network',
            location: data.details?.keywordLocation,
            exactMatch: data.details?.keywordFound?.includes('DRN') ? data.details?.keywordFound : undefined
          },
          LPR: {
            found: data.details?.keywordFound?.toLowerCase().includes('lpr') || false,
            keyword: 'LPR',
            description: 'License Plate Reader',
            location: data.details?.keywordLocation,
            exactMatch: data.details?.keywordFound?.includes('LPR') ? data.details?.keywordFound : undefined
          },
          GPS: {
            found: data.details?.keywordFound?.toLowerCase().includes('gps') || false,
            keyword: 'GPS',
            description: 'Global Positioning System',
            location: data.details?.keywordLocation,
            exactMatch: data.details?.keywordFound?.includes('GPS') ? data.details?.keywordFound : undefined
          },
          SURRENDER: {
            found: data.details?.keywordFound?.toLowerCase().includes('surrender') || false,
            keyword: 'SURRENDER',
            description: 'Voluntary Surrender',
            location: data.details?.keywordLocation,
            exactMatch: data.details?.keywordFound?.includes('surrender') ? data.details?.keywordFound : undefined
          },
          UNIT_SPOTTED: {
            found: data.details?.keywordFound?.toLowerCase().includes('spotted') || 
                   data.details?.keywordFound?.toLowerCase().includes('found') || false,
            keyword: 'UNIT SPOTTED',
            description: 'Unit Spotted/Found',
            location: data.details?.keywordLocation,
            exactMatch: data.details?.keywordFound
          }
        },
        rawResponse: data.details?.rawResponse,
        detectedBy: 'ai'
      }
      
      setKeywordAnalysis(formattedResult)
    } catch (error) {
      console.error('Keyword analysis error:', error)
      // For MVP, treat errors as no keywords found to avoid blocking
      setKeywordAnalysis({
        hasExclusionKeywords: false,
        analysisComplete: true,
        error: 'Analysis service temporarily unavailable - defaulting to manual review'
      })
    }
    setIsAnalyzingKeywords(false)
  }

  // Trigger keyword analysis when agent update validation passes
  useEffect(() => {
    if (hasAgentUpdate && !keywordAnalysis) {
      analyzeExclusionKeywords()
    }
  }, [hasAgentUpdate])

  return {
    keywordAnalysis,
    isAnalyzingKeywords,
    databaseKeywordResult,
    analyzeExclusionKeywords
  }
}