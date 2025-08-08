// UI-only types for case processing module

export type WorkflowStatus = 'ready' | 'running' | 'paused' | 'stopped'

export type WorkflowStep = 
  | 'validation'
  | 'property-verification'
  | 'template-selection'
  | 'update-generation'
  | 'update-review'
  | 'submission'
  | 'notification'
  | 'completion'

export interface WorkflowStepProps {
  onNext: () => void
  onPrevious: () => void
  onSkip?: () => void
}

export interface CaseProcessingLayoutProps {
  // Props will be passed from parent component
  workflowStatus?: WorkflowStatus
  currentCase?: string | null
  currentStep?: WorkflowStep | null
  onStartWorkflow?: () => void
  onPauseWorkflow?: () => void
  onStopWorkflow?: () => void
  onStepComplete?: (step: WorkflowStep) => void
}

// Module integration types
export type ModuleStatus = 'idle' | 'running' | 'completed' | 'error'

export interface ModuleProgress {
  module: 'module1' | 'module2'
  status: ModuleStatus
  message: string
}

export interface WorkflowProgress {
  module1: {
    status: ModuleStatus
    message: string
  }
  module2: {
    status: ModuleStatus
    message: string
  }
}