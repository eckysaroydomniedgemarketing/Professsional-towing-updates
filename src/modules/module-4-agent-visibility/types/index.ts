export interface VisibilityLogEntry {
  id?: string;
  case_id: string;
  updates_made_visible: number;
  processing_mode: 'manual' | 'automatic';
  company?: string;
  update_text?: string;
  created_at?: string;
  transfer_to_client_clicked?: boolean;
  client_button_clicked?: boolean;
  collector_button_clicked?: boolean;
  buttons_available?: ButtonAvailability;
}

export interface ButtonAvailability {
  transfer_to_client?: boolean;
  client?: boolean;
  collector?: boolean;
}

export interface ButtonClickResult {
  transfer_to_client_clicked: boolean;
  client_button_clicked: boolean;
  collector_button_clicked: boolean;
  buttons_available: ButtonAvailability;
}

export interface VisibilityReport {
  id?: string;
  date_ist: string;
  case_id: string;
  updates_made_visible: number;
  processing_mode: string;
  status: 'Processed' | 'Skipped';
}

export interface ProcessingStats {
  totalCases: number;
  totalUpdates: number;
  manualCases: number;
  automaticCases: number;
  skippedCases: number;
  companyFilteredCount?: number;
}

export interface DailySummary {
  date: string;
  total_cases: number;
  total_updates_made_visible: number;
  manual_cases: number;
  automatic_cases: number;
  skipped_cases: number;
}

export interface WorkflowState {
  isRunning: boolean;
  currentCaseId: string | null;
  mode: 'manual' | 'automatic';
  processedCount: number;
  totalProcessed: number;
  currentStatus: 'idle' | 'authenticating' | 'navigating' | 'processing' | 'completed' | 'error' | 'session_lost';
  error?: string;
  sessionLostAtCase?: string; // Track which case ID the session was lost at
}

export interface CaseUpdate {
  updateId: string;
  author: string;
  company?: string;
  isAgent: boolean;
  visibility: 'visible' | 'not_visible';
  content: string;
  timestamp: string;
}

export interface ProcessCaseResult {
  caseId: string;
  updatesProcessed: number;
  companyFilteredCount?: number;
  company?: string;
  updateText?: string;
  success: boolean;
  error?: string;
  buttonClicks?: ButtonClickResult;
}

export interface WorkflowConfig {
  mode: 'manual' | 'automatic';
  continueOnError: boolean;
  minPageLoadTime: number; // in seconds
}

export interface UpdateElement {
  updateId: string;
  authorElement: Element;
  visibilityButton: Element;
  company?: string;
  updateText?: string;
  isAgent: boolean;
  isVisible: boolean;
}