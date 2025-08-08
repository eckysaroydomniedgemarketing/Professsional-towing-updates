import { createClient } from '@supabase/supabase-js'
import { Case, CaseUpdate } from '../types/case.types'
import { AgentUpdateValidation } from './agent-update-validation.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function fetchCaseById(caseId: string): Promise<Case | null> {
  try {
    console.log('Fetching case data for:', caseId)
    
    // Fetch case details - get the most recent record
    const { data: caseDetailsArray, error: caseError } = await supabase
      .from('case_details')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (caseError || !caseDetailsArray || caseDetailsArray.length === 0) {
      console.error('Error fetching case details:', caseError)
      return null
    }

    const caseDetails = caseDetailsArray[0]
    console.log('Case details found:', caseDetails)

    // Fetch vehicle info - get the most recent record
    const { data: vehicleArray } = await supabase
      .from('case_vehicles')
      .select('vin')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1)
    
    const vehicle = vehicleArray?.[0]
    console.log('Vehicle found:', vehicle)

    // Get the timestamp of the most recent case_details record to filter related data
    const latestExtractionTime = caseDetails.created_at
    
    // Fetch addresses from the same extraction time window (within 1 minute)
    const { data: addressArray } = await supabase
      .from('case_addresses')
      .select('*')
      .eq('case_id', caseId)
      .gte('created_at', new Date(new Date(latestExtractionTime).getTime() - 60000).toISOString())
      .lte('created_at', new Date(new Date(latestExtractionTime).getTime() + 60000).toISOString())
      .order('created_at', { ascending: false })
    
    console.log('Addresses found from latest extraction:', addressArray?.length || 0)

    // Fetch update history from the same extraction time window
    const { data: updates } = await supabase
      .from('case_update_history')
      .select('*')
      .eq('case_id', caseId)
      .gte('created_at', new Date(new Date(latestExtractionTime).getTime() - 60000).toISOString())
      .lte('created_at', new Date(new Date(latestExtractionTime).getTime() + 60000).toISOString())
      .order('created_at', { ascending: false })
    
    console.log('Updates found from latest extraction:', updates?.length || 0)

    // Fetch the latest case status from case_updates table
    const { data: caseUpdateArray } = await supabase
      .from('case_updates')
      .select('status')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1)
    
    const latestStatus = caseUpdateArray?.[0]?.status || caseDetails.status || ''
    console.log('Latest case status:', latestStatus)

    // Get primary address info for backwards compatibility
    const primaryAddress = addressArray?.find(addr => addr.is_primary) || addressArray?.[0]
    
    // Transform to Case interface
    const caseData: Case = {
      id: caseId,
      order_type: caseDetails.order_type || '',
      status: latestStatus,
      address: primaryAddress?.full_address || '',
      zip_code: primaryAddress?.zip_code || '',
      vin: vehicle?.vin || '',
      updates: updates?.map((update: any) => ({
        id: update.id,
        type: update.update_type || '',
        details: update.update_content || '',
        created_at: update.created_at,
        visible: update.is_visible !== false
      })) || [],
      addresses: addressArray || [],
      client_name: caseDetails.client_name,
      last_update_date: caseDetails.last_update_date
    }

    console.log('Transformed case data:', {
      id: caseData.id,
      order_type: caseData.order_type,
      status: caseData.status,
      zip_code: caseData.zip_code,
      addressCount: caseData.addresses?.length || 0,
      addresses: caseData.addresses
    })

    return caseData
  } catch (error) {
    console.error('Error fetching case data:', error)
    return null
  }
}

export async function checkAgentUpdateExists(caseId: string): Promise<AgentUpdateValidation> {
  try {
    // Get ALL updates for this case, ordered by created_at
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

    // Identify the latest extraction batch (5 minute window)
    const BATCH_TIME_THRESHOLD = 5 * 60 * 1000
    const latestUpdate = allUpdates[0]
    const latestBatchTime = new Date(latestUpdate.created_at).getTime()
    
    const latestBatch = allUpdates.filter(update => {
      const updateTime = new Date(update.created_at).getTime()
      const timeDiff = latestBatchTime - updateTime
      return timeDiff <= BATCH_TIME_THRESHOLD
    })

    // Check for agent updates using flexible pattern matching
    const agentUpdates = latestBatch.filter(update => {
      if (!update.update_author) return false
      const updateAuthor = update.update_author.toLowerCase()
      
      // Check if author contains 'agent' (case-insensitive)
      return updateAuthor.includes('agent')
    })

    const uniqueAgentAuthors = [...new Set(agentUpdates.map(u => u.update_author).filter(Boolean))]

    return {
      hasAgentUpdate: agentUpdates.length > 0,
      agentUpdateCount: agentUpdates.length,
      agentUpdateAuthors: uniqueAgentAuthors,
      firstAgentUpdateDate: agentUpdates.length > 0 ? agentUpdates[0].update_date : undefined,
      latestExtractionDate: latestUpdate.created_at,
      totalUpdatesInBatch: latestBatch.length,
      validationMessage: agentUpdates.length > 0 
        ? `Found ${agentUpdates.length} agent update(s) in latest batch`
        : `No agent updates found. Case not eligible for processing.`
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