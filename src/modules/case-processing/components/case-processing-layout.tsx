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
import { TemplateSelectionStep } from "./workflow-steps/template-selection-step"
import { UpdateGenerationStep } from "./workflow-steps/update-generation-step"
import { UpdateReviewStep } from "./workflow-steps/update-review-step"
import { SubmissionStep } from "./workflow-steps/submission-step"
import { NotificationStep } from "./workflow-steps/notification-step"
import { CompletionStep } from "./workflow-steps/completion-step"
import type { WorkflowStatus, WorkflowStep } from "../types"
import type { Case } from "../types/case.types"
import { fetchCaseById } from "../services/supabase-case.service"

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
  const handleWorkflowComplete = async (extractedCaseId?: string) => {
    console.log('Workflow complete, received case ID:', extractedCaseId)
    
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
    
    // In production, this will get the next case ID from the queue
    // For MVP, using timestamp-based ID
    const caseId = `CASE-${Date.now()}`
    setCurrentCase(caseId)
    
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

  const renderCurrentStep = () => {
    const props = {
      onNext: handleNext,
      onPrevious: handlePrevious,
      onSkip: handleSkip
    }

    switch (currentStep) {
      case 'validation':
        return <ValidationStep {...props} caseData={caseData} onValidationComplete={setValidationResults} />
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

        <SidebarInset className="flex flex-col">
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
                  <WorkflowControl onWorkflowComplete={handleWorkflowComplete} />
                </div>
              ) : (
                <Card className="max-w-md">
                  <CardHeader>
                    <CardTitle>Ready to Process Cases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {modulesCompleted 
                        ? "Workflow modules completed successfully. Click 'Get Next Case' to start processing."
                        : "Click 'Start Workflow' to begin the RDN portal automation."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}