// Case data types for case processing module

export type ProcessingMode = 'manual' | 'automatic';

export interface CaseUpdate {
  id: string
  type: string
  update_author?: string
  update_date?: string
  details: string
  created_at: string
  visible: boolean
}

export interface CaseAddress {
  id: string
  address_type?: string
  full_address?: string
  zip_code?: string
  street_address?: string
  city?: string
  state?: string
  is_primary?: boolean
}

export interface Case {
  id: string
  order_type: string
  status: string
  rejection_reason?: string  // Reason why case was rejected by validation
  address: string
  zip_code: string
  vin: string
  updates: CaseUpdate[]
  allUpdates?: CaseUpdate[]  // All updates for validation checks
  addresses?: CaseAddress[]
  client_name?: string
  last_update_date?: string
}

export interface KeywordCheckResult {
  found: boolean
  keyword: string
  description: string
  location?: string
  exactMatch?: string
}

export interface ExclusionKeywordResults {
  hasExclusionKeywords: boolean | undefined
  isAnalyzing?: boolean
  analysisComplete?: boolean
  keywords?: {
    DRN: KeywordCheckResult
    LPR: KeywordCheckResult
    GPS: KeywordCheckResult
    SURRENDER: KeywordCheckResult
    UNIT_SPOTTED: KeywordCheckResult
  }
  rawResponse?: string
  error?: string
  errorCode?: number
  detectedBy?: 'database' | 'ai'
}

export interface CaseValidationResult {
  passed: boolean
  orderTypeValid: boolean
  statusValid: boolean
  zipCodeValid?: boolean
  clientExclusionPassed?: boolean
  skipClientExclusionValidation?: boolean
  hasAgentUpdate?: boolean
  agentUpdateDetails?: {
    hasAgentUpdate: boolean
    agentUpdateCount: number
    agentUpdateAuthors?: string[]
    validationMessage: string
    latestExtractionDate?: string
    totalUpdatesInBatch?: number
  }
  hasUserUpdate?: boolean
  userUpdateDetails?: {
    hasUserUpdate: boolean
    userUpdateCount: number
    userUpdateAuthors?: string[]
    validationMessage: string
    isAuthorizedUser?: boolean
  }
  exclusionKeywordResults?: ExclusionKeywordResults
  reasons: string[]
}