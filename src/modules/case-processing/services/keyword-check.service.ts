import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface DatabaseKeywordResult {
  hasExclusionKeyword: boolean
  keywordFound?: string
  updateAuthor?: string
  updateDate?: string
  updateContent?: string
  matchedPattern?: string
}

export async function checkExclusionKeywordsInDatabase(caseId: string): Promise<DatabaseKeywordResult> {
  try {
    console.log('[KeywordCheck] Checking database for exclusion keywords in case:', caseId)
    
    // Step 1: Get the latest extraction timestamp
    const { data: latestUpdate, error: timestampError } = await supabase
      .from('case_update_history')
      .select('created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (timestampError || !latestUpdate) {
      console.log('[KeywordCheck] No updates found for case')
      return { hasExclusionKeyword: false }
    }
    
    const latestTimestamp = latestUpdate.created_at
    console.log('[KeywordCheck] Latest extraction timestamp:', latestTimestamp)
    
    // Step 2: Get all updates from the latest extraction batch (within 2 minutes)
    const timeWindowStart = new Date(new Date(latestTimestamp).getTime() - 120000).toISOString()
    const timeWindowEnd = new Date(new Date(latestTimestamp).getTime() + 120000).toISOString()
    
    const { data: updates, error: updateError } = await supabase
      .from('case_update_history')
      .select('update_author, update_date, update_content, created_at')
      .eq('case_id', caseId)
      .gte('created_at', timeWindowStart)
      .lte('created_at', timeWindowEnd)
      .order('update_date', { ascending: false })
    
    if (updateError || !updates || updates.length === 0) {
      console.log('[KeywordCheck] Error fetching updates or no updates in batch')
      return { hasExclusionKeyword: false }
    }
    
    console.log(`[KeywordCheck] Checking ${updates.length} updates from latest batch`)
    
    // Step 3: Define exclusion keyword patterns
    const exclusionPatterns = [
      { pattern: 'DRN', keywords: ['DRN', 'D.R.N'] },
      { pattern: 'LPR', keywords: ['LPR', 'L.P.R'] },
      { pattern: 'GPS', keywords: ['GPS', 'G.P.S'] },
      { pattern: 'SURRENDER', keywords: ['surrender', 'surrendered'] }
    ]
    
    // Step 4: Check each update for exclusion keywords
    for (const update of updates) {
      if (!update.update_content) continue
      
      const contentUpper = update.update_content.toUpperCase()
      
      for (const { pattern, keywords } of exclusionPatterns) {
        for (const keyword of keywords) {
          if (contentUpper.includes(keyword.toUpperCase())) {
            console.log(`[KeywordCheck] Found keyword "${keyword}" in update from ${update.update_author}`)
            
            return {
              hasExclusionKeyword: true,
              keywordFound: keyword,
              updateAuthor: update.update_author,
              updateDate: update.update_date,
              updateContent: update.update_content,
              matchedPattern: pattern
            }
          }
        }
      }
    }
    
    console.log('[KeywordCheck] No exclusion keywords found in database')
    return { hasExclusionKeyword: false }
    
  } catch (error) {
    console.error('[KeywordCheck] Error checking keywords:', error)
    // For MVP, return false on error to avoid blocking
    return { hasExclusionKeyword: false }
  }
}