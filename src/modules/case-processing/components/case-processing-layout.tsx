"use client"

import { useState, useEffect, useRef } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { WorkflowSidebar } from "./workflow-sidebar"
import { WorkflowControl } from "@/modules/module-1-rdn-portal/components/workflow-control"
import { ValidationStep } from "./workflow-steps/validation-step"
import { PropertyVerificationStep } from "./workflow-steps/property-verification-step"
import { UpdateAssistant } from "./update-assistant"
import { TemplateSelectionStep } from "./workflow-steps/template-selection-step"
import { UpdateGenerationStep } from "./workflow-steps/update-generation-step"
import { UpdateReviewStep } from "./workflow-steps/update-review-step"
import { SubmissionStep } from "./workflow-steps/submission-step"
import { NotificationStep } from "./workflow-steps/notification-step"
import { CompletionStep } from "./workflow-steps/completion-step"
import type { WorkflowStatus, WorkflowStep } from "../types"
import type { Case } from "../types/case.types"
import { fetchCaseById } from "../services/supabase-case.service"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function CaseProcessingLayout() {
  // Mock state for UI demo - will be replaced with props
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('ready')
  const [currentCase, setCurrentCase] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<WorkflowStep | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [hasCompletedCase, setHasCompletedCase] = useState(false)
  const [isModulesRunning, setIsModulesRunning] = useState(false)
  const [modulesCompleted, setModulesCompleted] = useState(false)
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [validationResults, setValidationResults] = useState<any>(null)
  const [showUpdateAssistant, setShowUpdateAssistant] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string>('')

  const steps: WorkflowStep[] = [
    'validation',
    'property-verification',
    'template-selection',
    'update-generation',
    'update-review',
    'submission',
    'notification',
    'completion'
  ]

  // Called when Module 1 & 2 complete successfully
  const handleWorkflowComplete = async (extractedCaseId?: string, sessionId?: string) => {
    console.log('Workflow complete, received case ID:', extractedCaseId, 'session ID:', sessionId)
    
    // Mark modules as completed and start case processing
    setIsModulesRunning(false)
    setModulesCompleted(true)
    setWorkflowStatus('running')
    
    // Use the actual case ID from Module 2
    if (!extractedCaseId) {
      console.error('No case ID received from Module 2')
      return
    }
    
    const caseId = extractedCaseId
    setCurrentCase(caseId)
    
    // Store session ID if provided, otherwise try to get it from database
    if (sessionId) {
      setCurrentSessionId(sessionId)
    } else {
      // Try to get the latest session for this case
      const { data: sessionData } = await supabase
        .from('processing_sessions')
        .select('id')
        .eq('case_id', caseId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()
      
      if (sessionData) {
        setCurrentSessionId(sessionData.id)
        console.log('Found session ID from database:', sessionData.id)
      }
    }
    
    // Fetch case data from Supabase
    console.log('Fetching case data for ID:', caseId)
    const data = await fetchCaseById(caseId)
    
    if (data) {
      console.log('Case data fetched successfully')
      setCaseData(data)
    } else {
      console.error('Failed to fetch case data, using empty structure')
      // Set empty structure if fetch fails
      setCaseData({
        id: caseId,
        order_type: '',
        status: '',
        address: '',
        zip_code: '',
        vin: '',
        updates: []
      })
    }
    
    setCurrentStep('validation')
    setStepIndex(0)
  }

  const handleStartWorkflow = () => {
    // Start modules
    setIsModulesRunning(true)
    setWorkflowStatus('running')
  }

  const handlePauseWorkflow = () => {
    setWorkflowStatus('paused')
  }

  const handleStopWorkflow = () => {
    setWorkflowStatus('stopped')
    setCurrentCase(null)
    setCurrentStep(null)
    setStepIndex(0)
    setIsModulesRunning(false)
    // Don't reset modulesCompleted - they can still use Get Next Case
  }

  const handleLoadCase = async (caseId: string) => {
    console.log('Loading case:', caseId)
    setWorkflowStatus('running')
    setCurrentCase(caseId)
    setShowUpdateAssistant(false)
    
    // Get the latest session for this case
    const { data: sessionData } = await supabase
      .from('processing_sessions')
      .select('id')
      .eq('case_id', caseId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()
    
    if (sessionData) {
      setCurrentSessionId(sessionData.id)
    }
    
    // Fetch case data from Supabase
    const data = await fetchCaseById(caseId)
    if (data) {
      console.log('Case loaded successfully')
      setCaseData(data)
    } else {
      console.error('Failed to load case data')
      // Set empty structure if fetch fails
      setCaseData({
        id: caseId,
        order_type: '',
        status: '',
        address: '',
        zip_code: '',
        vin: '',
        updates: []
      })
    }
    
    setCurrentStep('validation')
    setStepIndex(0)
    setHasCompletedCase(false)
  }

  const handleGetNextCase = async () => {
    // Get next case from queue
    setWorkflowStatus('running')
    setShowUpdateAssistant(false)
    
    // In production, this will get the next case ID from the queue
    // For MVP, using timestamp-based ID
    const caseId = `CASE-${Date.now()}`
    setCurrentCase(caseId)
    
    // Get the latest session for this case if it exists
    const { data: sessionData } = await supabase
      .from('processing_sessions')
      .select('id')
      .eq('case_id', caseId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()
    
    if (sessionData) {
      setCurrentSessionId(sessionData.id)
    }
    
    // Fetch case data from Supabase
    const data = await fetchCaseById(caseId)
    if (data) {
      setCaseData(data)
    } else {
      // Set empty structure if fetch fails
      setCaseData({
        id: caseId,
        order_type: '',
        status: '',
        address: '',
        zip_code: '',
        vin: '',
        updates: []
      })
    }
    
    setCurrentStep('validation')
    setStepIndex(0)
    setHasCompletedCase(false)
  }

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1)
      setCurrentStep(steps[stepIndex + 1])
    } else if (stepIndex === steps.length - 1) {
      // Case completed
      setHasCompletedCase(true)
      setWorkflowStatus('ready')
      setCurrentCase(null)
      setCurrentStep(null)
      setStepIndex(0)
    }
  }

  const handlePrevious = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1)
      setCurrentStep(steps[stepIndex - 1])
    }
  }

  const handleSkip = () => {
    handleNext()
  }

  const handleSkipUpdate = () => {
    // Skip current case and load next
    setShowUpdateAssistant(false)
    handleGetNextCase()
  }

  const handlePostUpdate = async (content: string, addressId: string) => {
    // TODO: Implement post update functionality
    console.log('Post update not implemented yet', { content, addressId })
  }

  const renderCurrentStep = () => {
    const props = {
      onNext: handleNext,
      onPrevious: handlePrevious,
      onSkip: handleSkip
    }

    switch (currentStep) {
      case 'validation':
        return <ValidationStep {...props} caseData={caseData} onValidationComplete={setValidationResults} onShowUpdateAssistant={() => setShowUpdateAssistant(true)} />
      case 'property-verification':
        return <PropertyVerificationStep {...props} />
      case 'template-selection':
        return <TemplateSelectionStep {...props} />
      case 'update-generation':
        return <UpdateGenerationStep {...props} />
      case 'update-review':
        return <UpdateReviewStep {...props} />
      case 'submission':
        return <SubmissionStep {...props} />
      case 'notification':
        return <NotificationStep {...props} />
      case 'completion':
        return <CompletionStep {...props} />
      default:
        return null
    }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-[calc(100vh-4rem)]">
        <WorkflowSidebar
          workflowStatus={workflowStatus}
          currentCase={currentCase}
          onStartWorkflow={handleStartWorkflow}
          onPauseWorkflow={handlePauseWorkflow}
          onStopWorkflow={handleStopWorkflow}
          hasCompletedCase={hasCompletedCase || modulesCompleted}
          onLoadCase={handleLoadCase}
          onGetNextCase={handleGetNextCase}
          showWorkflowControl={isModulesRunning}
          currentStep={stepIndex}
          totalSteps={steps.length}
        />

        <SidebarInset className="flex flex-col flex-1">
          {currentCase ? (
            <div className="flex-1 p-6">
              <div className="max-w-5xl mx-auto h-full">
                {renderCurrentStep()}
              </div>
            </div>
          ) : (
            /* Welcome State or WorkflowControl */
            <div className="flex-1 flex items-center justify-center p-6">
              {isModulesRunning ? (
                <div className="max-w-2xl w-full">
                  <WorkflowControl onWorkflowComplete={handleWorkflowComplete} autoStart={true} />
                </div>
              ) : (
                <Card className="max-w-md">
                  <CardHeader>
                    <CardTitle>Ready to Process Cases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {modulesCompleted 
                        ? "Workflow modules completed successfully. Click 'Post Next Update' to continue processing."
                        : "Click 'Post Case Update' to begin posting updates to RDN portal."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </SidebarInset>
        
        {/* Third Column - Update Assistant (conditional) */}
        {showUpdateAssistant && caseData && (
          <div className="flex-1 border-l">
            <div className=" p-6">
              <UpdateAssistant
                caseData={caseData}
                sessionId={currentSessionId}
                onSkip={handleSkipUpdate}
                onPostUpdate={handlePostUpdate}
              />
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  )
}