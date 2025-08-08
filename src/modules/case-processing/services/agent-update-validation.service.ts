import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface AgentUpdateValidation {
  hasAgentUpdate: boolean
  agentUpdateCount: number
  firstAgentUpdateDate?: string
  validationMessage: string
  agentUpdateAuthors?: string[]
  latestExtractionDate?: string
  totalUpdatesInBatch?: number
}

export async function checkAgentUpdateExists(caseId: string): Promise<AgentUpdateValidation> {
  try {
    // Step 1: Get ALL updates for this case, ordered by created_at
    const { data: allUpdates, error } = await supabase
      .from('case_update_history')
      .select('update_author, update_date, created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching update history:', error)
      return {
        hasAgentUpdate: false,
        agentUpdateCount: 0,
        validationMessage: 'Error checking agent updates',
      }
    }

    if (!allUpdates || allUpdates.length === 0) {
      return {
        hasAgentUpdate: false,
        agentUpdateCount: 0,
        validationMessage: 'No update history found for this case',
      }
    }

    // Step 2: Identify the latest extraction batch
    // Updates within 5 minutes of each other are considered same batch
    const BATCH_TIME_THRESHOLD = 5 * 60 * 1000 // 5 minutes in milliseconds
    
    const latestUpdate = allUpdates[0]
    const latestBatchTime = new Date(latestUpdate.created_at).getTime()
    
    // Filter updates that belong to the latest batch
    const latestBatch = allUpdates.filter(update => {
      const updateTime = new Date(update.created_at).getTime()
      const timeDiff = latestBatchTime - updateTime
      return timeDiff <= BATCH_TIME_THRESHOLD
    })

    // Step 3: Check for agent updates in the latest batch only
    const agentUpdates = latestBatch.filter(update => {
      if (!update.update_author) return false
      const updateAuthor = update.update_author.toLowerCase()
      
      // Check if author contains 'agent' (case-insensitive)
      return updateAuthor.includes('agent')
    })

    // Step 4: Get unique agent authors
    const uniqueAgentAuthors = [...new Set(agentUpdates.map(u => u.update_author).filter(Boolean))]

    return {
      hasAgentUpdate: agentUpdates.length > 0,
      agentUpdateCount: agentUpdates.length,
      agentUpdateAuthors: uniqueAgentAuthors,
      firstAgentUpdateDate: agentUpdates.length > 0 ? agentUpdates[0].update_date : undefined,
      latestExtractionDate: latestUpdate.created_at,
      totalUpdatesInBatch: latestBatch.length,
      validationMessage: agentUpdates.length > 0 
        ? `Found ${agentUpdates.length} agent update(s) in latest batch of ${latestBatch.length} total updates`
        : `No agent updates found in latest batch of ${latestBatch.length} updates. Case not eligible for processing.`
    }
  } catch (error) {
    console.error('Error in checkAgentUpdateExists:', error)
    return {
      hasAgentUpdate: false,
      agentUpdateCount: 0,
      validationMessage: 'Error checking agent updates',
    }
  }
}