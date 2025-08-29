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
  drnOverriddenByAgent?: boolean  // True if DRN found but Agent update exists after it
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
    let drnFoundAt: Date | null = null
    let drnResult: DatabaseKeywordResult | null = null
    
    for (const update of updates) {
      if (!update.update_content) continue
      
      const contentUpper = update.update_content.toUpperCase()
      
      for (const { pattern, keywords } of exclusionPatterns) {
        for (const keyword of keywords) {
          if (contentUpper.includes(keyword.toUpperCase())) {
            console.log(`[KeywordCheck] Found keyword "${keyword}" in update from ${update.update_author}`)
            
            // Special handling for DRN - save ONLY the first (most recent) occurrence
            if (pattern === 'DRN') {
              if (!drnFoundAt) {
                // Save the first DRN found (which is the most recent since updates are ordered DESC)
                console.log(`[KeywordCheck] Found MOST RECENT DRN at ${update.update_date} from ${update.update_author}`)
                drnFoundAt = new Date(update.update_date)
                drnResult = {
                  hasExclusionKeyword: true,
                  keywordFound: keyword,
                  updateAuthor: update.update_author,
                  updateDate: update.update_date,
                  updateContent: update.update_content,
                  matchedPattern: pattern,
                  drnOverriddenByAgent: false
                }
              } else {
                console.log(`[KeywordCheck] Skipping older DRN at ${update.update_date} - already have most recent DRN from ${drnFoundAt}`)
              }
              // Continue checking for other keywords and Agent updates
              break
            } else {
              // For non-DRN keywords, return immediately (no exceptions)
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
    }
    
    // Step 5: If DRN was found, check for Agent updates after it
    if (drnFoundAt && drnResult) {
      console.log(`[KeywordCheck] Most recent DRN found at ${drnFoundAt.toISOString()}, checking for Agent updates after this timestamp`)
      
      let agentUpdatesChecked = 0
      let agentUpdatesFound = 0
      
      for (const update of updates) {
        if (!update.update_date) continue
        
        const updateDate = new Date(update.update_date)
        
        // Check if this update is by an Agent
        if (update.update_author) {
          const authorLower = update.update_author.toLowerCase()
          const isAgent = authorLower.includes('(agent)') || authorLower.includes('agent')
          
          if (isAgent) {
            agentUpdatesChecked++
            
            // Check if this Agent update is AFTER the most recent DRN
            if (updateDate > drnFoundAt) {
              agentUpdatesFound++
              console.log(`[KeywordCheck] ✓ Found Agent update AFTER most recent DRN: ${update.update_author} at ${update.update_date}`)
              console.log(`[KeywordCheck] DRN override VALID - Case is ELIGIBLE`)
              
              // DRN is overridden by Agent update
              return {
                hasExclusionKeyword: false,  // Case is eligible
                keywordFound: 'DRN',
                updateAuthor: drnResult.updateAuthor,
                updateDate: drnResult.updateDate,
                updateContent: drnResult.updateContent,
                matchedPattern: 'DRN',
                drnOverriddenByAgent: true
              }
            } else {
              console.log(`[KeywordCheck] ✗ Agent update found but BEFORE most recent DRN: ${update.update_author} at ${update.update_date}`)
            }
          }
        }
      }
      
      console.log(`[KeywordCheck] Checked ${agentUpdatesChecked} Agent updates, ${agentUpdatesFound} were after DRN`)
      console.log(`[KeywordCheck] No Agent update found after most recent DRN - Case is NOT ELIGIBLE`)
      
      // DRN found but no Agent update after it
      return drnResult
    }
    
    console.log('[KeywordCheck] No exclusion keywords found in database')
    return { hasExclusionKeyword: false }
    
  } catch (error) {
    console.error('[KeywordCheck] Error checking keywords:', error)
    // For MVP, return false on error to avoid blocking
    return { hasExclusionKeyword: false }
  }
}