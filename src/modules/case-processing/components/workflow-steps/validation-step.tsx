"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight, AlertCircle, Loader2 } from "lucide-react"
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
  onShowUpdateAssistant?: () => void
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

  return (
    <Card className="max-w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Case Validation Review</CardTitle>
        {automaticMode && autoSkipCountdown !== null && (
          <AutoSkipCountdown countdown={autoSkipCountdown} />
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
                onShowUpdateAssistant()
              } else {
                onNext()
              }
            }} 
            disabled={(() => {
              if (isLoading || !validationResult || isAnalyzingKeywords) return true
              if (keywordAnalysis?.hasExclusionKeywords || keywordAnalysis?.error !== undefined) return true
              
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