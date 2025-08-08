export interface VisibilityLogEntry {
  id?: string;
  case_id: string;
  updates_made_visible: number;
  processing_mode: 'manual' | 'automatic';
  created_at?: string;
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
  currentStatus: 'idle' | 'authenticating' | 'navigating' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface CaseUpdate {
  updateId: string;
  author: string;
  isAgent: boolean;
  visibility: 'visible' | 'not_visible';
  content: string;
  timestamp: string;
}

export interface ProcessCaseResult {
  caseId: string;
  updatesProcessed: number;
  success: boolean;
  error?: string;
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
  isAgent: boolean;
  isVisible: boolean;
}