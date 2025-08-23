export type ProcessingMode = 'manual' | 'automatic';

export type WorkflowStatus = 
  | 'idle' 
  | 'processing' 
  | 'paused' 
  | 'completed' 
  | 'error';

export type ActionTaken = 'status_changed' | 'skipped' | 'failed';

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

export interface ProcessingResult {
  success: boolean;
  caseId: string;
  message: string;
  error?: string;
}

export interface CaseDetails {
  caseId: string;
  vin?: string;
  status?: string;
}

export interface PendingCloseLog {
  id?: string;
  case_id: string;
  vin_number?: string;
  previous_status?: string;
  new_status?: string;
  action_taken?: ActionTaken;
  processing_mode?: ProcessingMode;
  processed_at?: Date;
  processed_by?: string;
  error_message?: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface WorkflowStats {
  total: number;
  success: number;
  failed: number;
}