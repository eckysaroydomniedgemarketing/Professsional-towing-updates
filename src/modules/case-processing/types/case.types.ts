// Case data types for case processing module

export interface CaseUpdate {
  id: string
  type: string
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
}

export interface Case {
  id: string
  order_type: string
  status: string
  address: string
  zip_code: string
  vin: string
  updates: CaseUpdate[]
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
  hasAgentUpdate?: boolean
  agentUpdateDetails?: {
    hasAgentUpdate: boolean
    agentUpdateCount: number
    agentUpdateAuthors?: string[]
    validationMessage: string
    latestExtractionDate?: string
    totalUpdatesInBatch?: number
  }
  exclusionKeywordResults?: ExclusionKeywordResults
  reasons: string[]
}