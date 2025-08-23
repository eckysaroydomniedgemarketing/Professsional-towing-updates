export type ProcessingMode = 'manual' | 'automatic';

export type WorkflowStatus = 'idle' | 'processing' | 'paused' | 'completed' | 'error';

export interface OnHoldCase {
  id: string;
  caseId: string;
  vinNumber: string;
  previousStatus: string;
  newStatus: string;
  processingMode: ProcessingMode;
  timestamp: Date;
}

export interface WorkflowState {
  status: WorkflowStatus;
  mode: ProcessingMode;
  currentCase: string | null;
  processedCount: number;
  totalCount: number;
  errors: string[];
  startTime: Date | null;
  endTime: Date | null;
}

export interface CaseDetails {
  caseId: string;
  vin: string;
  debtor?: string;
  vehicle?: string;
  orderType?: string;
  orderDate?: string;
  status: string;
}

export interface OnHoldLogEntry {
  case_id: string;
  vin_number?: string;
  previous_status?: string;
  new_status?: string;
  action_taken?: string;
  processing_mode?: ProcessingMode;
  processed_by?: string;
  notes?: string;
}

export interface ProcessingResult {
  success: boolean;
  caseId: string;
  message: string;
  error?: string;
}