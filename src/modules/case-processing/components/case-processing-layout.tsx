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
import { UpdateAssistant } from "./update-assistant"
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
  const [selectedAgentUpdate, setSelectedAgentUpdate] = useState<any>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [isGetNextCase, setIsGetNextCase] = useState(false)
  const [workflowKey, setWorkflowKey] = useState(0)
  const [automaticMode, setAutomaticMode] = useState(false)
  const [autoClickProtocol, setAutoClickProtocol] = useState(false)
  const [targetCaseId, setTargetCaseId] = useState<string | null>(null)

  const steps: WorkflowStep[] = [
    'validation',
    'update-review',
    'submission',
    'notification',
    'completion'
  ]

  // Called when Module 1 completes successfully
  const handleWorkflowComplete = async (extractedCaseId?: string, sessionId?: string, navigationData?: any) => {
    console.log('Workflow complete, received case ID:', extractedCaseId, 'session ID:', sessionId, 'data:', navigationData)
    
    // Use the actual case ID from Module 1
    if (!extractedCaseId) {
      console.error('No case ID received from Module 1')
      return
    }
    
    const caseId = extractedCaseId
    
    // Module 1 has already extracted all the data we need
    // Check if we have a session ID from the navigation data
    const finalSessionId = sessionId || navigationData?.sessionId
    console.log('Using data extracted by Module 1 for case:', caseId, 'with session:', finalSessionId)
    
    // Mark modules as completed and start case processing
    setIsModulesRunning(false)
    setModulesCompleted(true)
    setWorkflowStatus('running')
    setIsGetNextCase(false) // Reset the flag
    setTargetCaseId(null) // Reset target case ID
    
    setCurrentCase(caseId)
    
    // Store session ID if provided, otherwise try to get it from database
    if (finalSessionId) {
      setCurrentSessionId(finalSessionId)
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
      // Module 1 should have extracted the data already
      console.log('Waiting for case data to be available...')
      // Try fetching again after a short delay
      setTimeout(async () => {
        const retryData = await fetchCaseById(caseId)
        if (retryData) {
          console.log('Case data fetched on retry')
          setCaseData(retryData)
        } else {
          console.error('Case data not available after retry')
          // Set empty structure as fallback
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
      }, 2000)
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
    
    // Set target case ID and trigger Module 1 to navigate to RDN portal
    setTargetCaseId(caseId)
    setWorkflowStatus('running')
    setShowUpdateAssistant(false)
    setIsModulesRunning(true)
    setModulesCompleted(false)
    
    // Reset current case state
    setCurrentCase(null)
    setCaseData(null)
    setCurrentStep(null)
    setStepIndex(0)
    setHasCompletedCase(false)
    
    // Increment workflow key to force WorkflowControl remount with target case ID
    setWorkflowKey(prev => prev + 1)
    
    // WorkflowControl will be triggered with targetCaseId
    console.log('Starting Module 1 to navigate to case:', caseId)
  }

  const handleGetNextCase = async () => {
    // Start modules to get next case from RDN portal
    console.log('Getting next case from RDN portal...')
    setWorkflowStatus('running')
    setShowUpdateAssistant(false)
    setIsGetNextCase(true)
    setIsModulesRunning(true)
    setModulesCompleted(false)
    
    // Reset current case state
    setCurrentCase(null)
    setCaseData(null)
    setCurrentStep(null)
    setStepIndex(0)
    setHasCompletedCase(false)
    
    // Increment workflow key to force WorkflowControl remount
    setWorkflowKey(prev => prev + 1)
    
    // WorkflowControl will be triggered with isGetNextCase flag
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
        return <ValidationStep {...props} caseData={caseData} automaticMode={automaticMode} onValidationComplete={setValidationResults} onShowUpdateAssistant={(agentUpdate) => {
          setSelectedAgentUpdate(agentUpdate)
          setShowUpdateAssistant(true)
        }} onGetNextCase={handleGetNextCase} />
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
          automaticMode={automaticMode}
          onAutomaticModeChange={setAutomaticMode}
          autoClickProtocol={autoClickProtocol}
          onAutoClickProtocolChange={setAutoClickProtocol}
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
                  <WorkflowControl 
                    key={workflowKey}
                    onWorkflowComplete={handleWorkflowComplete} 
                    autoStart={true} 
                    isGetNextCase={isGetNextCase}
                    targetCaseId={targetCaseId}
                  />
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
                automaticMode={automaticMode}
                onGetNextCase={handleGetNextCase}
                selectedAgentUpdate={selectedAgentUpdate}
                autoClickProtocol={autoClickProtocol}
              />
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  )
}