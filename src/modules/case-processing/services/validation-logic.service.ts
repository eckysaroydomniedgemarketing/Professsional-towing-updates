import { Case, CaseValidationResult } from '../types/case.types'
import { updateCaseStatus } from './supabase-case.service'
import { CaseValidationService } from './case-validation.service'

export class ValidationLogicService {
  // Validation constants
  private static readonly VALID_ORDER_TYPES = ['Involuntary Repo', 'Investigate Repo']
  private static readonly VALID_STATUS = 'Open'

  /**
   * Check if order type is valid
   */
  static isValidOrderType(orderType: string): boolean {
    return this.VALID_ORDER_TYPES.includes(orderType)
  }

  /**
   * Check if status is valid
   */
  static isValidStatus(status: string): boolean {
    return status === this.VALID_STATUS
  }

  /**
   * Validate case and update database status
   */
  static async validateCaseAndUpdateStatus(caseData: Case): Promise<CaseValidationResult> {
    console.log('ValidationLogicService - validating case:', caseData.id)
    
    try {
      // Use existing CaseValidationService for validation
      const result = await CaseValidationService.validateCase(caseData)
      console.log('Validation result:', result)
      
      // Save validation status to database
      if (result.passed) {
        // Case passed validation - save as accepted
        await updateCaseStatus(caseData.id, 'accepted')
        console.log('Case marked as accepted in database')
      } else {
        // Case failed validation - save as rejected with reasons
        const rejectionReason = result.reasons.join('; ')
        await updateCaseStatus(caseData.id, 'rejected', rejectionReason)
        console.log('Case marked as rejected in database with reasons:', rejectionReason)
      }
      
      return result
    } catch (error) {
      console.error('Validation error:', error)
      throw error
    }
  }

  /**
   * Get validation summary message
   */
  static getValidationSummary(validationResult: CaseValidationResult): {
    title: string
    description: string
    variant: 'success' | 'error'
  } {
    if (validationResult.passed) {
      return {
        title: 'Case Eligible for Update Posting',
        description: 'This case meets all validation criteria and can proceed to the next step.',
        variant: 'success'
      }
    } else {
      return {
        title: 'Case Not Eligible for Processing',
        description: 'This case cannot proceed due to validation failures.',
        variant: 'error'
      }
    }
  }

  /**
   * Get ZIP code validation message
   */
  static getZipCodeMessage(isValid: boolean): string {
    return isValid ? 'In Coverage' : 'Not in Coverage'
  }

  /**
   * Get order type validation message
   */
  static getOrderTypeMessage(orderType: string): string {
    return this.isValidOrderType(orderType) 
      ? 'Eligible order type' 
      : 'Not eligible for processing'
  }

  /**
   * Get status validation message
   */
  static getStatusMessage(status: string): string {
    return this.isValidStatus(status) 
      ? 'Case is open' 
      : 'Case must be open'
  }
}