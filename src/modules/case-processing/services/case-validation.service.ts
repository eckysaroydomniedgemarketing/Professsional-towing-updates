import { Case, CaseValidationResult } from '../types/case.types'
import { createClient } from '@supabase/supabase-js'
import { checkAgentUpdateExists } from './agent-update-validation.service'
import { ClientExclusionService } from './client-exclusion.service'
import { VALID_STATUSES } from '@/modules/data-extraction/utils/status-normalizer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export class CaseValidationService {
  // Valid order types for processing
  private static readonly VALID_ORDER_TYPES = ['Involuntary Repo', 'Investigate Repo', 'Investigate/Repo']
  
  // Valid statuses for processing - imported from status normalizer
  private static readonly VALID_STATUSES = VALID_STATUSES

  static validateOrderType(orderType: string): boolean {
    return this.VALID_ORDER_TYPES.includes(orderType)
  }

  static validateStatus(status: string): boolean {
    return this.VALID_STATUSES.includes(status)
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


  static async checkUserUpdateExists(updates: any[]): Promise<{
    hasUserUpdate: boolean
    userUpdateCount: number
    userUpdateAuthors: string[]
    validationMessage: string
    isAuthorizedUser: boolean
  }> {
    if (!updates || updates.length === 0) {
      return {
        hasUserUpdate: false,
        userUpdateCount: 0,
        userUpdateAuthors: [],
        validationMessage: 'No updates found in case history',
        isAuthorizedUser: false
      }
    }

    // Filter for updates posted by Users (not Agents)
    const userUpdates = updates.filter(update => {
      if (!update.update_author) return false
      const author = update.update_author.toLowerCase()
      // Check for role designation (User) not just 'user' anywhere in string
      return author.includes('(user)') && !author.includes('(agent)')
    })

    const uniqueUserAuthors = [...new Set(userUpdates.map(u => u.update_author).filter(Boolean))]
    
    // Check if authorized_users table has any records
    const { data: tableCheck, error: tableError } = await supabase
      .from('authorized_users')
      .select('user_name')
      .limit(1)
    
    // If table is empty or has error, use original validation (backward compatible)
    if (tableError || !tableCheck || tableCheck.length === 0) {
      console.log('Authorized users table is empty or not accessible - using default validation')
      return {
        hasUserUpdate: userUpdates.length > 0,
        userUpdateCount: userUpdates.length,
        userUpdateAuthors: uniqueUserAuthors,
        validationMessage: userUpdates.length > 0 
          ? `Found ${userUpdates.length} user update(s) with property details`
          : 'Update with no property details description present. Manually post an update with property detailed description.',
        isAuthorizedUser: userUpdates.length > 0 // Consider authorized if table is empty
      }
    }
    
    // Table has records, check if user is authorized
    let isAuthorizedUser = false
    if (uniqueUserAuthors.length > 0) {
      // Extract just the user names without the (User) designation for database lookup
      const userNames = uniqueUserAuthors.map(author => {
        // Remove the (User) designation to get just the name
        return author.replace(/\s*\(user\)/i, '').trim()
      })
      
      // Get all active authorized users
      const { data: authorizedUsers, error } = await supabase
        .from('authorized_users')
        .select('user_name')
        .eq('is_active', true)
        
      if (!error && authorizedUsers && authorizedUsers.length > 0) {
        // Check if any authorized user name is found within the update author names
        for (const updateAuthor of userNames) {
          const updateAuthorLower = updateAuthor.toLowerCase()
          
          // Check if any authorized user's name appears in this update author
          const matchFound = authorizedUsers.some(authUser => {
            const authUserLower = authUser.user_name.toLowerCase()
            // Check if the authorized name appears anywhere in the update author
            return updateAuthorLower.includes(authUserLower)
          })
          
          if (matchFound) {
            isAuthorizedUser = true
            console.log(`Authorized user found in: ${updateAuthor}`)
            break
          }
        }
      }
    }

    // Different validation messages based on whether user is authorized
    let validationMessage = ''
    if (userUpdates.length === 0) {
      validationMessage = 'Update with no property details description present. Manually post an update with property detailed description.'
    } else if (!isAuthorizedUser) {
      // User found but not in authorized list - needs first update
      validationMessage = 'Update with no property details description present. Manually post an update with property detailed description.'
    } else {
      validationMessage = `Found ${userUpdates.length} user update(s) with property details from authorized user`
    }

    return {
      hasUserUpdate: userUpdates.length > 0 && isAuthorizedUser,
      userUpdateCount: userUpdates.length,
      userUpdateAuthors: uniqueUserAuthors,
      validationMessage,
      isAuthorizedUser
    }
  }

  static async validateCase(caseData: Case): Promise<CaseValidationResult> {
    console.log('validateCase called with:', {
      id: caseData.id,
      order_type: caseData.order_type,
      status: caseData.status,
      addressCount: caseData.addresses?.length || 0
    })
    
    const reasons: string[] = []
    
    // Check if status exists
    if (!caseData.status) {
      reasons.push('Status is missing - extraction may have failed')
      return {
        passed: false,
        orderTypeValid: false,
        statusValid: false,
        reasons
      }
    }
    
    const orderTypeValid = this.validateOrderType(caseData.order_type)
    const statusValid = this.validateStatus(caseData.status)
    const zipCodeValid = await this.validateZipCodes(caseData.addresses || [])
    
    // Check for client exclusion after ZIP code validation
    const clientExclusionService = ClientExclusionService.getInstance()
    const clientExclusionResult = await clientExclusionService.checkClientExclusion(caseData.client_name)
    const isClientExcluded = clientExclusionResult.isExcluded
    const skipClientExclusionValidation = clientExclusionResult.skipValidation || false
    
    // Check for agent updates
    const agentUpdateCheck = await checkAgentUpdateExists(caseData.id)
    const hasAgentUpdate = agentUpdateCheck.hasAgentUpdate
    
    // Check for user updates (NEW validation) - use allUpdates if available, otherwise updates
    const userUpdateCheck = await this.checkUserUpdateExists(caseData.allUpdates || caseData.updates || [])
    const hasUserUpdate = userUpdateCheck.hasUserUpdate
    
    if (!orderTypeValid) {
      reasons.push(`Invalid order type: ${caseData.order_type}. Must be 'Involuntary Repo', 'Investigate Repo', or 'Investigate/Repo'`)
    }
    
    if (!statusValid) {
      reasons.push(`Invalid status: ${caseData.status}. Must be one of: ${this.VALID_STATUSES.join(', ')}`)
    }

    if (!zipCodeValid) {
      const zipCount = caseData.addresses?.length || 0
      reasons.push(`None of the ${zipCount} address(es) are in coverage area`)
    }
    
    // Only check client exclusion if validation is not skipped
    if (!skipClientExclusionValidation && isClientExcluded) {
      reasons.push(clientExclusionResult.reason || 'Client is on exclusion list')
    }
    
    if (!hasAgentUpdate) {
      reasons.push(agentUpdateCheck.validationMessage)
    }
    
    if (!hasUserUpdate) {
      reasons.push(userUpdateCheck.validationMessage)
    }
    
    // Include client exclusion in passed check only if validation is not skipped
    const clientExclusionPassed = skipClientExclusionValidation || !isClientExcluded
    
    return {
      passed: orderTypeValid && statusValid && zipCodeValid && clientExclusionPassed && hasAgentUpdate && hasUserUpdate,
      orderTypeValid,
      statusValid,
      zipCodeValid,
      clientExclusionPassed,
      skipClientExclusionValidation,
      hasAgentUpdate,
      agentUpdateDetails: agentUpdateCheck,
      hasUserUpdate,
      userUpdateDetails: userUpdateCheck,
      reasons
    }
  }
}