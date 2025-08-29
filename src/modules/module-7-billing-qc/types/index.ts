/**
 * Type definitions for Module 7: Billing QC
 * Matches database table schemas from Supabase
 */

/**
 * Interface matching client_approved_fees table
 */
export interface ClientApprovedFee {
  id: number;
  client_name: string;
  fee_category: string;
  fee_type: string;
  fee_amount: number;
  has_condition?: boolean;
  condition_details?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface matching invoice_data table
 */
export interface InvoiceData {
  id: number;
  case_id: string;
  invoice_number?: string | null;
  service_date?: string | null;
  service_name?: string | null;
  cost?: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface matching case_details table
 */
export interface CaseDetails {
  id: string;
  case_id: string;
  order_date?: string | null;
  ref_number?: string | null;
  order_type?: string | null;
  status?: string | null;
  client?: string | null;
  collector?: string | null;
  lien_holder?: string | null;
  client_account_number?: string | null;
  created_at?: string;
  session_id?: string | null;
  my_summary_additional_info?: string | null;
}

/**
 * Interface matching case_update_history table
 */
export interface CaseUpdateHistory {
  id: string;
  case_id: string;
  update_date?: string | null;
  update_type?: string | null;
  update_author?: string | null;
  update_content?: string | null;
  created_at?: string;
  address_associated?: string | null;
  contains_exclusion_keyword?: boolean | null;
  exclusion_keywords?: string[] | null;
  is_visible?: boolean | null;
  session_id?: string | null;
}

/**
 * Interface for AI-extracted fees from text
 */
export interface AIExtractedFee {
  fee_type: string;
  amount: number;
  confidence?: number;
  matched?: boolean;
  source?: 'additional_info' | 'updates' | 'combined';
  details?: string;
}

/**
 * Interface for QC decision summary
 */
export interface QCDecision {
  decision_type: 'match' | 'warning' | 'error';
  message: string;
  severity?: 'info' | 'warning' | 'error';
  fee_type?: string;
  amount?: number;
}

/**
 * Interface for variance analysis between fees
 */
export interface VarianceAnalysis {
  comparison_type: 'approved_vs_invoice' | 'ai_vs_invoice' | 'approved_vs_ai';
  missing_fees: FeeDiscrepancy[];
  extra_fees: FeeDiscrepancy[];
  matching_fees: FeeMatch[];
  total_difference: number;
  match_percentage: number;
}

/**
 * Interface for fee discrepancies
 */
export interface FeeDiscrepancy {
  fee_type: string;
  amount: number;
  source: 'approved' | 'invoice' | 'ai';
}

/**
 * Interface for matching fees
 */
export interface FeeMatch {
  fee_type: string;
  amount: number;
  sources: ('approved' | 'invoice' | 'ai')[];
}

/**
 * Combined billing QC data interface
 */
export interface BillingQCData {
  caseDetails?: CaseDetails;
  clientApprovedFees: ClientApprovedFee[];
  invoiceData: InvoiceData[];
  caseUpdates: CaseUpdateHistory[];
  aiExtractedFees: AIExtractedFee[];
  qcDecisions: QCDecision[];
  varianceAnalysis?: VarianceAnalysis;
}

/**
 * Interface for grouped invoice data by date
 */
export interface GroupedInvoiceData {
  service_date: string;
  items: InvoiceData[];
  total: number;
}

/**
 * Interface for grouped approved fees by category
 */
export interface GroupedApprovedFees {
  category: string;
  fees: ClientApprovedFee[];
  total: number;
}

/**
 * Interface for AI extraction result
 */
export interface AIExtractionResult {
  fees: AIExtractedFee[];
  total_amount: number;
  confidence_score: number;
  extraction_date: string;
  source_text?: string;
}

/**
 * Interface for QC workflow state
 */
export interface QCWorkflowState {
  caseId: string;
  status: 'idle' | 'loading' | 'loaded' | 'error' | 'processing';
  error?: string;
  currentStep?: 'load_case' | 'fetch_fees' | 'extract_ai' | 'analyze' | 'complete';
}

/**
 * Interface for action button handlers
 */
export interface QCActionHandlers {
  onApprove: () => void;
  onReject: () => void;
  onFlag: () => void;
  onReExtract: () => void;
  onNextCase: () => void;
}

/**
 * Interface for lazy loading state
 */
export interface LazyLoadState {
  hasMore: boolean;
  isLoading: boolean;
  page: number;
  pageSize: number;
  total?: number;
}

/**
 * Fee categories enum
 */
export enum FeeCategory {
  TOWING = 'Towing',
  STORAGE = 'Storage',
  ADMINISTRATIVE = 'Administrative',
  SPECIAL = 'Special',
  OTHER = 'Other'
}

/**
 * QC status enum
 */
export enum QCStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
  REPROCESS = 'reprocess'
}

/**
 * Processing mode enum
 */
export enum ProcessingMode {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic'
}

/**
 * Type guard to check if a fee is approved
 */
export const isApprovedFee = (fee: any): fee is ClientApprovedFee => {
  return fee && typeof fee.client_name === 'string' && typeof fee.fee_category === 'string';
};

/**
 * Type guard to check if data is invoice data
 */
export const isInvoiceData = (data: any): data is InvoiceData => {
  return data && typeof data.case_id === 'string' && 'cost' in data;
};

/**
 * Type guard to check if update is case update
 */
export const isCaseUpdate = (update: any): update is CaseUpdateHistory => {
  return update && typeof update.case_id === 'string' && 'update_content' in update;
};