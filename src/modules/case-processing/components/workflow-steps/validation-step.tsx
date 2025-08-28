"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { ChevronRight, AlertCircle, Loader2, X } from "lucide-react"
import { WorkflowStepProps } from "../../types"
import { Case, CaseValidationResult } from "../../types/case.types"
import { UpdateHistoryDisplay } from "./update-history-display"
import { ValidationOrderStatus } from "../validation/validation-order-status"
import { ValidationZipCode } from "../validation/validation-zipcode"
import { ValidationKeywordAnalysis } from "../validation/validation-keyword-analysis"

// Import new sections
import { AgentUpdateSection } from "../validation-sections/agent-update-section"
import { UserUpdateSection } from "../validation-sections/user-update-section"
import { ClientExclusionSection } from "../validation-sections/client-exclusion-section"
import { AutoSkipCountdown } from "../validation-sections/auto-skip-countdown"
import { ValidationResultAlert } from "../validation-sections/validation-result-alert"

// Import new hooks
import { useValidationLogic } from "../../hooks/use-validation-logic"
import { useKeywordAnalysis } from "../../hooks/use-keyword-analysis"
import { useAutoSkip } from "../../hooks/use-auto-skip"

interface ValidationStepProps extends WorkflowStepProps {
  caseData?: Case
  onValidationComplete?: (result: CaseValidationResult | null) => void
  onShowUpdateAssistant?: (selectedAgentUpdate?: any) => void
  onGetNextCase?: () => void
  automaticMode?: boolean
}

export function ValidationStep({ 
  onNext, 
  onPrevious, 
  onSkip, 
  caseData, 
  onValidationComplete, 
  onShowUpdateAssistant, 
  onGetNextCase,
  automaticMode = false
}: ValidationStepProps) {
  // Track selected agent update
  const [selectedAgentUpdate, setSelectedAgentUpdate] = useState<any>(null)
  
  // Use custom hooks
  const { validationResult, isLoading, showClientExclusion } = useValidationLogic(
    caseData,
    onValidationComplete
  )

  const { 
    keywordAnalysis, 
    isAnalyzingKeywords, 
    databaseKeywordResult, 
    analyzeExclusionKeywords 
  } = useKeywordAnalysis(caseData, validationResult?.hasAgentUpdate)

  const autoSkipCountdown = useAutoSkip(automaticMode, validationResult, onGetNextCase)
  
  // Auto-click Update Draft button in automatic mode
  const [autoClickCountdown, setAutoClickCountdown] = useState<number | null>(null)
  const [isAutoClickCancelled, setIsAutoClickCancelled] = useState(false)
  const [hasAutoClicked, setHasAutoClicked] = useState(false)
  const autoClickIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    // Reset cancelled and completion state when validation result changes
    if (!validationResult?.passed) {
      setIsAutoClickCancelled(false)
      setHasAutoClicked(false)
    }
  }, [validationResult])
  
  // Start countdown effect
  useEffect(() => {
    // Only check conditions when countdown is not running and hasn't completed
    if (autoClickCountdown === null && autoClickIntervalRef.current === null) {
      const shouldStartCountdown = 
        automaticMode && 
        validationResult?.passed && 
        !isLoading && 
        !isAnalyzingKeywords &&
        !keywordAnalysis?.hasExclusionKeywords &&
        !isAutoClickCancelled &&
        !hasAutoClicked
      
      console.log('[Auto-Click Debug]', {
        automaticMode,
        validationPassed: validationResult?.passed,
        isLoading,
        isAnalyzingKeywords,
        hasCountdown: autoClickCountdown !== null,
        hasInterval: autoClickIntervalRef.current !== null,
        hasExclusionKeywords: keywordAnalysis?.hasExclusionKeywords,
        isCancelled: isAutoClickCancelled,
        hasCompleted: hasAutoClicked,
        shouldStart: shouldStartCountdown
      })
      
      if (shouldStartCountdown) {
        console.log('[Auto-Click] ✅ Starting 10-second countdown for Update Draft button')
        setAutoClickCountdown(10)
      }
    }
  }, [automaticMode, validationResult, isLoading, isAnalyzingKeywords, keywordAnalysis, isAutoClickCancelled, hasAutoClicked, autoClickCountdown])

  // Handle the actual countdown
  useEffect(() => {
    if (autoClickCountdown !== null && autoClickCountdown > 0 && !autoClickIntervalRef.current) {
      console.log('[Auto-Click] Setting up interval for countdown:', autoClickCountdown)
      
      autoClickIntervalRef.current = setInterval(() => {
        setAutoClickCountdown(prev => {
          if (prev === null) return null
          
          console.log('[Auto-Click] Countdown tick:', prev - 1)
          
          if (prev <= 1) {
            // Clear interval
            if (autoClickIntervalRef.current) {
              clearInterval(autoClickIntervalRef.current)
              autoClickIntervalRef.current = null
            }
            
            if (prev === 1 && !isAutoClickCancelled) {
              console.log('[Auto-Click] Countdown complete, clicking button...')
              // Perform the click action
              setTimeout(() => {
                console.log('[Auto-Click] ✅ Auto-clicking Update Draft button NOW!')
                setHasAutoClicked(true)  // Mark as completed to prevent restart
                if (validationResult?.hasUserUpdate && onShowUpdateAssistant) {
                  onShowUpdateAssistant(selectedAgentUpdate)
                } else {
                  onNext()
                }
              }, 100)
            }
            
            return null
          }
          
          return prev - 1
        })
      }, 1000)
    }
    
    // Cleanup
    return () => {
      if (autoClickIntervalRef.current) {
        clearInterval(autoClickIntervalRef.current)
        autoClickIntervalRef.current = null
      }
    }
  }, [autoClickCountdown, isAutoClickCancelled, validationResult, onShowUpdateAssistant, onNext])
  
  const handleCancelAutoClick = () => {
    console.log('[Auto-Click] ❌ Cancelled by user')
    // Clear the interval if it's running
    if (autoClickIntervalRef.current) {
      clearInterval(autoClickIntervalRef.current)
      autoClickIntervalRef.current = null
    }
    setAutoClickCountdown(null)
    setIsAutoClickCancelled(true)
  }

  return (
    <Card className="max-w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Case Validation Review</CardTitle>
        {automaticMode && autoSkipCountdown !== null && (
          <AutoSkipCountdown countdown={autoSkipCountdown} />
        )}
        {automaticMode && autoClickCountdown !== null && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-base font-medium text-blue-900">
                  Auto-clicking "Update Draft" in {autoClickCountdown} seconds...
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelAutoClick}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
            <Progress 
              value={(10 - autoClickCountdown) * 10} 
              className="h-2 bg-blue-100" 
            />
          </div>
        )}
        <CardDescription>
          Reviewing case #{caseData?.id || 'N/A'} eligibility for update posting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Validating case data...</span>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ) : !caseData ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No case data available. Please select a case to validate.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Order Type & Status Section */}
            <ValidationOrderStatus caseData={caseData} validationResult={validationResult} />

            {/* ZIP Code Coverage Section */}
            <ValidationZipCode caseData={caseData} validationResult={validationResult} />

            {/* Client Exclusion Check Section */}
            <ClientExclusionSection 
              caseData={caseData}
              validationResult={validationResult}
              showClientExclusion={showClientExclusion}
            />

            {/* Agent Update Check Section */}
            <AgentUpdateSection validationResult={validationResult} />

            {/* Exclusion Keywords Check Section */}
            <ValidationKeywordAnalysis
              hasAgentUpdate={validationResult?.hasAgentUpdate || false}
              isAnalyzingKeywords={isAnalyzingKeywords}
              keywordAnalysis={keywordAnalysis}
              databaseKeywordResult={databaseKeywordResult}
              caseUpdateCount={caseData?.updates?.length}
              onRetryAnalysis={analyzeExclusionKeywords}
            />

            {/* Update History Analysis */}
            {caseData?.updates && keywordAnalysis?.analysisComplete && (
              <UpdateHistoryDisplay 
                updates={caseData.updates}
                keywordAnalysis={keywordAnalysis}
                databaseKeywordResult={databaseKeywordResult}
                automaticMode={automaticMode}
                onAgentUpdateSelected={setSelectedAgentUpdate}
              />
            )}

            {/* User Update Check Section */}
            <UserUpdateSection validationResult={validationResult} />

            {/* Overall Validation Result */}
            <ValidationResultAlert 
              validationResult={validationResult}
              keywordAnalysis={keywordAnalysis}
            />
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <Button variant="outline" onClick={onPrevious} disabled>
          <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
          Previous
        </Button>
        
        <div className="flex gap-2">
          {((validationResult && !validationResult.passed) || 
            keywordAnalysis?.hasExclusionKeywords || keywordAnalysis?.error) && (
            <Button variant="outline" onClick={onGetNextCase || onSkip}>
              Get Next Case
            </Button>
          )}
          <Button 
            onClick={() => {
              // If user update exists, show Update Assistant; otherwise continue to next step
              if (validationResult?.hasUserUpdate && onShowUpdateAssistant) {
                onShowUpdateAssistant(selectedAgentUpdate)
              } else {
                onNext()
              }
            }} 
            disabled={(() => {
              if (isLoading || !validationResult) return true
              
              // Only block if found exclusion keywords (not while analyzing)
              if (keywordAnalysis?.hasExclusionKeywords) return true
              
              // Don't block on errors - let validation result determine button state
              // Only allow if validation fully passed
              return !validationResult.passed
            })()}
            className="gap-2"
          >
            {isAnalyzingKeywords ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Keywords...
              </>
            ) : (
              <>
                Update Draft
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}