import { Case, CaseValidationResult } from '../types/case.types'
import { createClient } from '@supabase/supabase-js'
import { checkAgentUpdateExists } from './agent-update-validation.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export class CaseValidationService {
  // Valid order types for processing
  private static readonly VALID_ORDER_TYPES = ['Involuntary Repo', 'Investigate Repo']
  
  // Valid status for processing
  private static readonly VALID_STATUS = 'Open'

  static validateOrderType(orderType: string): boolean {
    return this.VALID_ORDER_TYPES.includes(orderType)
  }

  static validateStatus(status: string): boolean {
    return status === this.VALID_STATUS
  }

  static async validateZipCodes(addresses: { zip_code?: string }[]): Promise<boolean> {
    console.log('validateZipCodes called with addresses:', addresses)
    
    if (!addresses || addresses.length === 0) {
      console.log('No addresses provided')
      return false
    }

    // Get all zip codes from addresses
    const zipCodes = addresses
      .map(addr => addr.zip_code)
      .filter(zip => zip && zip.length > 0)

    console.log('Extracted ZIP codes:', zipCodes)

    if (zipCodes.length === 0) {
      console.log('No valid ZIP codes found')
      return false
    }

    // Check if ANY zip code is covered
    const { data, error } = await supabase
      .from('zip_codes')
      .select('zip_code')
      .in('zip_code', zipCodes)
      .eq('is_active', true)

    if (error) {
      console.error('Error checking zip codes:', error)
      return false
    }

    // If any zip code is found in active coverage, return true
    return data && data.length > 0
  }


  static async validateCase(caseData: Case): Promise<CaseValidationResult> {
    console.log('validateCase called with:', {
      id: caseData.id,
      order_type: caseData.order_type,
      status: caseData.status,
      addressCount: caseData.addresses?.length || 0
    })
    
    const reasons: string[] = []
    
    const orderTypeValid = this.validateOrderType(caseData.order_type)
    const statusValid = this.validateStatus(caseData.status)
    const zipCodeValid = await this.validateZipCodes(caseData.addresses || [])
    
    // Check for agent updates after ZIP code validation
    const agentUpdateCheck = await checkAgentUpdateExists(caseData.id)
    const hasAgentUpdate = agentUpdateCheck.hasAgentUpdate
    
    if (!orderTypeValid) {
      reasons.push(`Invalid order type: ${caseData.order_type}. Must be 'Involuntary Repo' or 'Investigate Repo'`)
    }
    
    if (!statusValid) {
      reasons.push(`Invalid status: ${caseData.status}. Must be 'Open'`)
    }

    if (!zipCodeValid) {
      const zipCount = caseData.addresses?.length || 0
      reasons.push(`None of the ${zipCount} address(es) are in coverage area`)
    }
    
    if (!hasAgentUpdate) {
      reasons.push(agentUpdateCheck.validationMessage)
    }
    
    return {
      passed: orderTypeValid && statusValid && zipCodeValid && hasAgentUpdate,
      orderTypeValid,
      statusValid,
      zipCodeValid,
      hasAgentUpdate,
      agentUpdateDetails: agentUpdateCheck,
      reasons
    }
  }
}