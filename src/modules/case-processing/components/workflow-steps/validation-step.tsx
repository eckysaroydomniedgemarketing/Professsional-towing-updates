"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle, AlertCircle, Loader2, ChevronRight } from "lucide-react"
import { WorkflowStepProps } from "../../types"
import { Case, CaseValidationResult, ExclusionKeywordResults } from "../../types/case.types"
import { checkExclusionKeywordsInDatabase, DatabaseKeywordResult } from "../../services/keyword-check.service"
import { UpdateHistoryDisplay } from "./update-history-display"
import { ValidationLogicService } from "../../services/validation-logic.service"
import { ValidationOrderStatus } from "../validation/validation-order-status"
import { ValidationZipCode } from "../validation/validation-zipcode"
import { ValidationKeywordAnalysis } from "../validation/validation-keyword-analysis"
import { ClientExclusionService } from "../../services/client-exclusion.service"
import { useEffect, useState } from "react"

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
  const [validationResult, setValidationResult] = useState<CaseValidationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [keywordAnalysis, setKeywordAnalysis] = useState<ExclusionKeywordResults | null>(null)
  const [isAnalyzingKeywords, setIsAnalyzingKeywords] = useState(false)
  const [databaseKeywordResult, setDatabaseKeywordResult] = useState<DatabaseKeywordResult | null>(null)
  const [autoSkipCountdown, setAutoSkipCountdown] = useState<number | null>(null)
  const [showClientExclusion, setShowClientExclusion] = useState(false)
  
  useEffect(() => {
    const validateCase = async () => {
      console.log('ValidationStep useEffect - caseData:', caseData)
      if (caseData) {
        setIsLoading(true)
        try {
          // Check if client exclusion table has data
          const clientExclusionService = ClientExclusionService.getInstance()
          const hasExclusions = await clientExclusionService.hasExclusions()
          setShowClientExclusion(hasExclusions)
          
          const result = await ValidationLogicService.validateCaseAndUpdateStatus(caseData)
          setValidationResult(result)
          
          if (onValidationComplete) {
            onValidationComplete(result)
          }
        } catch (error) {
          console.error('Validation error:', error)
        }
        setIsLoading(false)
      } else {
        console.log('No case data available')
        setIsLoading(false)
        if (onValidationComplete) {
          onValidationComplete(null)
        }
      }
    }
    
    validateCase()
  }, [caseData, onValidationComplete])

  // Analyze exclusion keywords
  const analyzeExclusionKeywords = async () => {
    if (!caseData?.id) {
      setKeywordAnalysis({
        hasExclusionKeywords: false,
        analysisComplete: true,
        error: 'No case ID available'
      })
      return
    }

    setIsAnalyzingKeywords(true)
    try {
      // Step 1: Check database for obvious keywords
      console.log('[ValidationStep] Checking database for exclusion keywords...')
      const dbResult = await checkExclusionKeywordsInDatabase(caseData.id)
      setDatabaseKeywordResult(dbResult)
      
      if (dbResult.hasExclusionKeyword) {
        console.log('[ValidationStep] Database found exclusion keyword:', dbResult.keywordFound)
        // Set keyword analysis result from database check
        setKeywordAnalysis({
          hasExclusionKeywords: true,
          analysisComplete: true,
          keywords: {
            DRN: {
              found: dbResult.matchedPattern === 'DRN',
              keyword: 'DRN',
              description: 'Digital Recognition Network',
              location: dbResult.updateAuthor ? `Update by ${dbResult.updateAuthor}` : undefined,
              exactMatch: dbResult.keywordFound
            },
            LPR: {
              found: dbResult.matchedPattern === 'LPR',
              keyword: 'LPR',
              description: 'License Plate Reader',
              location: dbResult.updateAuthor ? `Update by ${dbResult.updateAuthor}` : undefined,
              exactMatch: dbResult.keywordFound
            },
            GPS: {
              found: dbResult.matchedPattern === 'GPS',
              keyword: 'GPS',
              description: 'Global Positioning System',
              location: dbResult.updateAuthor ? `Update by ${dbResult.updateAuthor}` : undefined,
              exactMatch: dbResult.keywordFound
            },
            SURRENDER: {
              found: dbResult.matchedPattern === 'SURRENDER',
              keyword: 'SURRENDER',
              description: 'Voluntary Surrender',
              location: dbResult.updateAuthor ? `Update by ${dbResult.updateAuthor}` : undefined,
              exactMatch: dbResult.keywordFound
            },
            UNIT_SPOTTED: {
              found: false,
              keyword: 'UNIT SPOTTED',
              description: 'Unit Spotted/Found',
            }
          },
          detectedBy: 'database'
        })
        setIsAnalyzingKeywords(false)
        return // Don't call OpenRouter API if database found keywords
      }
      
      console.log('[ValidationStep] No keywords found in database, proceeding to AI analysis...')
      
      // Step 2: If no keywords in database, continue with OpenRouter API
      if (!caseData.updates || caseData.updates.length === 0) {
        setKeywordAnalysis({
          hasExclusionKeywords: false,
          analysisComplete: true,
          error: 'No updates to analyze'
        })
        setIsAnalyzingKeywords(false)
        return
      }
      const updateTexts = caseData.updates.map(u => u.details).filter(Boolean)
      console.log('[ValidationStep] Sending', updateTexts.length, 'updates to API for analysis')
      
      // Call server-side API route instead of client-side service
      const response = await fetch('/api/case-processing/analyze-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates: updateTexts })
      })

      console.log('[ValidationStep] API response status:', response.status)
      const data = await response.json()
      console.log('[ValidationStep] API response data:', {
        success: data.success,
        hasExclusionKeyword: data.hasExclusionKeyword,
        keywordFound: data.details?.keywordFound
      })
      
      if (!data.success) {
        console.error('Keyword analysis failed:', data.details?.error)
        // For MVP, treat failures as no keywords found
        setKeywordAnalysis({
          hasExclusionKeywords: false,
          analysisComplete: true,
          error: data.details?.error || 'Analysis failed'
        })
        setIsAnalyzingKeywords(false)
        return
      }
      
      // Format result for UI
      const formattedResult: ExclusionKeywordResults = {
        hasExclusionKeywords: data.hasExclusionKeyword,
        analysisComplete: true,
        keywords: {
          DRN: {
            found: data.details?.keywordFound?.toLowerCase().includes('drn') || false,
            keyword: 'DRN',
            description: 'Digital Recognition Network',
            location: data.details?.keywordLocation,
            exactMatch: data.details?.keywordFound?.includes('DRN') ? data.details?.keywordFound : undefined
          },
          LPR: {
            found: data.details?.keywordFound?.toLowerCase().includes('lpr') || false,
            keyword: 'LPR',
            description: 'License Plate Reader',
            location: data.details?.keywordLocation,
            exactMatch: data.details?.keywordFound?.includes('LPR') ? data.details?.keywordFound : undefined
          },
          GPS: {
            found: data.details?.keywordFound?.toLowerCase().includes('gps') || false,
            keyword: 'GPS',
            description: 'Global Positioning System',
            location: data.details?.keywordLocation,
            exactMatch: data.details?.keywordFound?.includes('GPS') ? data.details?.keywordFound : undefined
          },
          SURRENDER: {
            found: data.details?.keywordFound?.toLowerCase().includes('surrender') || false,
            keyword: 'SURRENDER',
            description: 'Voluntary Surrender',
            location: data.details?.keywordLocation,
            exactMatch: data.details?.keywordFound?.includes('surrender') ? data.details?.keywordFound : undefined
          },
          UNIT_SPOTTED: {
            found: data.details?.keywordFound?.toLowerCase().includes('spotted') || 
                   data.details?.keywordFound?.toLowerCase().includes('found') || false,
            keyword: 'UNIT SPOTTED',
            description: 'Unit Spotted/Found',
            location: data.details?.keywordLocation,
            exactMatch: data.details?.keywordFound
          }
        },
        rawResponse: data.details?.rawResponse,
        detectedBy: 'ai'
      }
      
      setKeywordAnalysis(formattedResult)
    } catch (error) {
      console.error('Keyword analysis error:', error)
      // For MVP, treat errors as no keywords found to avoid blocking
      setKeywordAnalysis({
        hasExclusionKeywords: false,
        analysisComplete: true,
        error: 'Analysis service temporarily unavailable - defaulting to manual review'
      })
    }
    setIsAnalyzingKeywords(false)
  }

  // Trigger keyword analysis when agent update validation passes
  useEffect(() => {
    if (validationResult?.hasAgentUpdate && !keywordAnalysis) {
      analyzeExclusionKeywords()
    }
  }, [validationResult?.hasAgentUpdate])

  // Auto-skip logic for automatic mode
  useEffect(() => {
    // Check if we should auto-skip
    if (automaticMode && validationResult && !validationResult.passed && onGetNextCase) {
      // Start countdown
      setAutoSkipCountdown(2)
      
      const countdownInterval = setInterval(() => {
        setAutoSkipCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval)
            return null
          }
          return prev - 1
        })
      }, 1000)
      
      // Skip to next case after 2 seconds
      const skipTimer = setTimeout(() => {
        console.log('[ValidationStep] Auto-skipping to next case due to validation failure')
        onGetNextCase()
        setAutoSkipCountdown(null)
      }, 2000)
      
      // Cleanup on unmount or if conditions change
      return () => {
        clearTimeout(skipTimer)
        clearInterval(countdownInterval)
        setAutoSkipCountdown(null)
      }
    }
  }, [automaticMode, validationResult, onGetNextCase])

  // Agent and User update sections rendering
  const renderAgentUpdateSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Agent Update Check</h3>
        {validationResult?.hasAgentUpdate !== undefined && (
          <Badge 
            variant={validationResult.hasAgentUpdate ? "secondary" : "destructive"}
            className={validationResult.hasAgentUpdate ? 'bg-green-500 text-white hover:bg-green-600' : ''}
          >
            {validationResult.hasAgentUpdate ? 'Agent Updates Found' : 'No Agent Updates'}
          </Badge>
        )}
      </div>
      <Separator />
      <Card>
        <CardContent className="p-6">
          {validationResult?.agentUpdateDetails ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  {validationResult.agentUpdateDetails.hasAgentUpdate ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        {validationResult.agentUpdateDetails.agentUpdateCount} Agent Update(s) Found
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">
                        No Agent Updates Found
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {validationResult.agentUpdateDetails.agentUpdateAuthors && 
               validationResult.agentUpdateDetails.agentUpdateAuthors.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Update Authors:</p>
                  <div className="flex flex-wrap gap-2">
                    {validationResult.agentUpdateDetails.agentUpdateAuthors.map((author, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {author}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {validationResult.agentUpdateDetails.totalUpdatesInBatch !== undefined && (
                <div className="text-xs text-muted-foreground">
                  Latest batch: {validationResult.agentUpdateDetails.agentUpdateCount} of{' '}
                  {validationResult.agentUpdateDetails.totalUpdatesInBatch} total updates
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Checking for agent updates in case history...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderUserUpdateSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Property Update Check</h3>
        {validationResult?.hasUserUpdate !== undefined && (
          <Badge 
            variant={validationResult.hasUserUpdate ? "secondary" : "destructive"}
            className={validationResult.hasUserUpdate ? 'bg-green-500 text-white hover:bg-green-600' : ''}
          >
            {validationResult.hasUserUpdate ? 'User Updates Found' : 'No User Updates'}
          </Badge>
        )}
      </div>
      <Separator />
      <Card>
        <CardContent className="p-6">
          {validationResult?.userUpdateDetails ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  {validationResult.userUpdateDetails.hasUserUpdate ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        {validationResult.userUpdateDetails.userUpdateCount} User Update(s) Found
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">
                        No User Updates Found
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {!validationResult.userUpdateDetails.hasUserUpdate && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Property Details Required</AlertTitle>
                  <AlertDescription>
                    Update with no property details description present. 
                    Manually post an update with property detailed description.
                  </AlertDescription>
                </Alert>
              )}
              
              {validationResult.userUpdateDetails.userUpdateAuthors && 
               validationResult.userUpdateDetails.userUpdateAuthors.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">User Update Authors:</p>
                  <div className="flex flex-wrap gap-2">
                    {validationResult.userUpdateDetails.userUpdateAuthors.map((author, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {author}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Checking for user updates with property details...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <Card className="max-w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Case Validation Review</CardTitle>
        {automaticMode && autoSkipCountdown !== null && (
          <Alert className="mt-2 border-yellow-200 bg-yellow-50">
            <AlertDescription className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Case rejected. Loading next case in {autoSkipCountdown} seconds...
            </AlertDescription>
          </Alert>
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

            {/* Client Exclusion Check Section - Only show if table has data */}
            {showClientExclusion && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Client Exclusion Check</h3>
                  {validationResult?.clientExclusionPassed !== undefined && (
                    <Badge 
                      variant={validationResult.clientExclusionPassed ? "secondary" : "destructive"}
                      className={validationResult.clientExclusionPassed ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                    >
                      {validationResult.clientExclusionPassed ? 'Client Allowed' : 'Client Excluded'}
                    </Badge>
                  )}
                </div>
                <Separator />
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Client Name</span>
                      <span className="text-sm font-medium">{caseData?.client_name || 'Not Available'}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <div className="flex items-center gap-2">
                        {validationResult?.clientExclusionPassed ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Not on exclusion list</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span className="text-sm font-medium text-destructive">Client is excluded</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Agent Update Check Section */}
            {renderAgentUpdateSection()}

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
            {renderUserUpdateSection()}

            {/* Overall Validation Result */}
            {validationResult && (
              <Alert 
                variant={(validationResult.passed && !keywordAnalysis?.hasExclusionKeywords && !keywordAnalysis?.error) ? "default" : "destructive"}
                className={`border-2 ${(validationResult.passed && !keywordAnalysis?.hasExclusionKeywords && !keywordAnalysis?.error) ? 'border-green-500 bg-green-50' : ''}`}
              >
                <div className="flex items-start gap-2">
                  {(validationResult.passed && !keywordAnalysis?.hasExclusionKeywords && !keywordAnalysis?.error) ? (
                    <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertTitle className={`text-lg ${(validationResult.passed && !keywordAnalysis?.hasExclusionKeywords && !keywordAnalysis?.error) ? 'text-green-800' : ''}`}>
                      {(validationResult.passed && !keywordAnalysis?.hasExclusionKeywords && !keywordAnalysis?.error) ? 
                        'Case Eligible for Update Posting' : 
                        keywordAnalysis?.error ? 'Case Cannot Be Processed' : 'Case Not Eligible for Processing'}
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      {(validationResult.passed && !keywordAnalysis?.hasExclusionKeywords && !keywordAnalysis?.error) ? (
                        <p>This case meets all validation criteria and can proceed to the next step.</p>
                      ) : (
                        <>
                          <p className="mb-2">This case cannot proceed for the following reasons:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {validationResult.reasons.map((reason, index) => (
                              <li key={index} className="text-sm">{reason}</li>
                            ))}
                            {keywordAnalysis?.hasExclusionKeywords && (
                              <li className="text-sm">Exclusion keywords detected in update history</li>
                            )}
                            {keywordAnalysis?.error && (
                              <li className="text-sm">System unable to verify exclusion keywords</li>
                            )}
                          </ul>
                        </>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
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