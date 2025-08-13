"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle2, XCircle, AlertCircle, Loader2, ChevronRight, RefreshCw } from "lucide-react"
import { WorkflowStepProps } from "../../types"
import { Case, CaseValidationResult, ExclusionKeywordResults } from "../../types/case.types"
import { CaseValidationService } from "../../services/case-validation.service"
import { checkExclusionKeywordsInDatabase, DatabaseKeywordResult } from "../../services/keyword-check.service"
import { UpdateHistoryDisplay } from "./update-history-display"
import { useEffect, useState } from "react"

interface ValidationStepProps extends WorkflowStepProps {
  caseData?: Case
  onValidationComplete?: (result: CaseValidationResult | null) => void
  onShowUpdateAssistant?: () => void
  onGetNextCase?: () => void
}

export function ValidationStep({ onNext, onPrevious, onSkip, caseData, onValidationComplete, onShowUpdateAssistant, onGetNextCase }: ValidationStepProps) {
  const [validationResult, setValidationResult] = useState<CaseValidationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [keywordAnalysis, setKeywordAnalysis] = useState<ExclusionKeywordResults | null>(null)
  const [isAnalyzingKeywords, setIsAnalyzingKeywords] = useState(false)
  const [databaseKeywordResult, setDatabaseKeywordResult] = useState<DatabaseKeywordResult | null>(null)
  
  useEffect(() => {
    const validateCase = async () => {
      console.log('ValidationStep useEffect - caseData:', caseData)
      if (caseData) {
        setIsLoading(true)
        try {
          const result = await CaseValidationService.validateCase(caseData)
          console.log('Validation result:', result)
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

  // Helper function to check if order type is valid
  const isValidOrderType = (orderType: string) => {
    return orderType === 'Involuntary Repo' || orderType === 'Investigate Repo'
  }

  // Helper function to check if status is valid  
  const isValidStatus = (status: string) => {
    return status === 'Open'
  }

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

  return (
    <Card className="max-w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Case Validation Review</CardTitle>
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
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                {/* Order Type Card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-muted-foreground">Order Type</span>
                      {validationResult?.orderTypeValid !== undefined && (
                        validationResult.orderTypeValid ? 
                          <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
                          <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={isValidOrderType(caseData.order_type) ? "secondary" : "destructive"}
                        className={`text-sm py-1 ${isValidOrderType(caseData.order_type) ? 'bg-green-500 text-white hover:bg-green-600' : ''}`}
                      >
                        {caseData.order_type || 'No data'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {isValidOrderType(caseData.order_type) ? 'Eligible order type' : 'Not eligible for processing'}
                    </p>
                  </CardContent>
                </Card>

                {/* Status Card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-muted-foreground">Case Status</span>
                      {validationResult?.statusValid !== undefined && (
                        validationResult.statusValid ? 
                          <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
                          <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={isValidStatus(caseData.status) ? "secondary" : "destructive"}
                        className={`text-sm py-1 ${isValidStatus(caseData.status) ? 'bg-green-500 text-white hover:bg-green-600' : ''}`}
                      >
                        {caseData.status || 'No data'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {isValidStatus(caseData.status) ? 'Case is open' : 'Case must be open'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ZIP Code Coverage Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">ZIP Code Coverage</h3>
                {validationResult?.zipCodeValid !== undefined && (
                  <Badge 
                    variant={validationResult.zipCodeValid ? "secondary" : "destructive"}
                    className={validationResult.zipCodeValid ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                  >
                    {validationResult.zipCodeValid ? 'In Coverage' : 'Not in Coverage'}
                  </Badge>
                )}
              </div>
              <Separator />
              
              {caseData.addresses && caseData.addresses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Address #</TableHead>
                      <TableHead>Full Address</TableHead>
                      <TableHead>ZIP Code</TableHead>
                      <TableHead className="text-right">Coverage Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caseData.addresses.map((address: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{address.full_address || 'No address'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {address.zip_code || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {validationResult?.zipCodeValid !== undefined && (
                            <Badge 
                              variant={validationResult.zipCodeValid ? "secondary" : "destructive"}
                              className={`gap-1 ${validationResult.zipCodeValid ? 'bg-green-500 text-white hover:bg-green-600' : ''}`}
                            >
                              {validationResult.zipCodeValid ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" />
                                  Covered
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" />
                                  Not Covered
                                </>
                              )}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No addresses found for this case</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Agent Update Check Section */}
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

            {/* Exclusion Keywords Check Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Exclusion Keywords Check</h3>
                <div className="flex items-center gap-2">
                  {keywordAnalysis?.detectedBy && (
                    <Badge variant="outline" className="text-xs">
                      {keywordAnalysis.detectedBy === 'database' ? 'DB Check' : 'AI Analysis'}
                    </Badge>
                  )}
                  {keywordAnalysis?.analysisComplete && (
                    <Badge 
                      variant={keywordAnalysis.hasExclusionKeywords ? "destructive" : "secondary"}
                      className={!keywordAnalysis.hasExclusionKeywords ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                    >
                      {keywordAnalysis.hasExclusionKeywords ? 'Keywords Found' : 'All Clear'}
                    </Badge>
                  )}
                  {isAnalyzingKeywords && (
                    <Badge variant="secondary" className="gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {databaseKeywordResult === null ? 'Checking Database...' : 'AI Analysis...'}
                    </Badge>
                  )}
                </div>
              </div>
              <Separator />
              <Card>
                <CardContent className="p-6">
                  {!validationResult?.hasAgentUpdate ? (
                    <div className="text-sm text-muted-foreground">
                      Agent update validation must pass before keyword analysis
                    </div>
                  ) : isAnalyzingKeywords ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          {databaseKeywordResult === null 
                            ? 'Checking database for exclusion keywords...'
                            : `Analyzing ${caseData?.updates?.length || 0} updates with AI...`}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {['DRN', 'LPR', 'GPS', 'SURRENDER', 'UNIT SPOTTED'].map(keyword => (
                          <Skeleton key={keyword} className="h-14 w-full" />
                        ))}
                      </div>
                    </div>
                  ) : keywordAnalysis?.error ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Verification Failed</AlertTitle>
                      <AlertDescription>
                        <div>{keywordAnalysis.error}</div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={analyzeExclusionKeywords}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                          {(keywordAnalysis.errorCode === 401 || keywordAnalysis.error.includes('authentication')) && (
                            <span className="text-xs text-muted-foreground">Contact system administrator for assistance</span>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : keywordAnalysis?.keywords ? (
                    <div className="space-y-3">
                      {/* DRN Check */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          {keywordAnalysis.keywords.DRN.found ? (
                            <XCircle className="h-5 w-5 text-destructive" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                          <div>
                            <span className="font-medium">DRN Check</span>
                            <p className="text-xs text-muted-foreground">
                              Digital Recognition Network hits
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={keywordAnalysis.keywords.DRN.found ? "destructive" : "outline"}
                          className={!keywordAnalysis.keywords.DRN.found ? 'text-green-600 border-green-600' : ''}
                        >
                          {keywordAnalysis.keywords.DRN.found 
                            ? `Found${keywordAnalysis.keywords.DRN.location ? ` in ${keywordAnalysis.keywords.DRN.location}` : ''}` 
                            : 'Not Found'}
                        </Badge>
                      </div>

                      {/* LPR Check */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          {keywordAnalysis.keywords.LPR.found ? (
                            <XCircle className="h-5 w-5 text-destructive" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                          <div>
                            <span className="font-medium">LPR Check</span>
                            <p className="text-xs text-muted-foreground">
                              License Plate Reader scans
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={keywordAnalysis.keywords.LPR.found ? "destructive" : "outline"}
                          className={!keywordAnalysis.keywords.LPR.found ? 'text-green-600 border-green-600' : ''}
                        >
                          {keywordAnalysis.keywords.LPR.found 
                            ? `Found${keywordAnalysis.keywords.LPR.location ? ` in ${keywordAnalysis.keywords.LPR.location}` : ''}` 
                            : 'Not Found'}
                        </Badge>
                      </div>

                      {/* GPS Check */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          {keywordAnalysis.keywords.GPS.found ? (
                            <XCircle className="h-5 w-5 text-destructive" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                          <div>
                            <span className="font-medium">GPS Check</span>
                            <p className="text-xs text-muted-foreground">
                              GPS tracking or coordinates
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={keywordAnalysis.keywords.GPS.found ? "destructive" : "outline"}
                          className={!keywordAnalysis.keywords.GPS.found ? 'text-green-600 border-green-600' : ''}
                        >
                          {keywordAnalysis.keywords.GPS.found 
                            ? `Found${keywordAnalysis.keywords.GPS.location ? ` in ${keywordAnalysis.keywords.GPS.location}` : ''}` 
                            : 'Not Found'}
                        </Badge>
                      </div>

                      {/* SURRENDER Check */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          {keywordAnalysis.keywords.SURRENDER.found ? (
                            <XCircle className="h-5 w-5 text-destructive" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                          <div>
                            <span className="font-medium">SURRENDER Check</span>
                            <p className="text-xs text-muted-foreground">
                              Voluntary surrender by customer
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={keywordAnalysis.keywords.SURRENDER.found ? "destructive" : "outline"}
                          className={!keywordAnalysis.keywords.SURRENDER.found ? 'text-green-600 border-green-600' : ''}
                        >
                          {keywordAnalysis.keywords.SURRENDER.found 
                            ? `Found${keywordAnalysis.keywords.SURRENDER.location ? ` in ${keywordAnalysis.keywords.SURRENDER.location}` : ''}` 
                            : 'Not Found'}
                        </Badge>
                      </div>

                      {/* UNIT SPOTTED Check */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          {keywordAnalysis.keywords.UNIT_SPOTTED.found ? (
                            <XCircle className="h-5 w-5 text-destructive" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                          <div>
                            <span className="font-medium">UNIT SPOTTED Check</span>
                            <p className="text-xs text-muted-foreground">
                              Unit spotted or found at location
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={keywordAnalysis.keywords.UNIT_SPOTTED.found ? "destructive" : "outline"}
                          className={!keywordAnalysis.keywords.UNIT_SPOTTED.found ? 'text-green-600 border-green-600' : ''}
                        >
                          {keywordAnalysis.keywords.UNIT_SPOTTED.found 
                            ? `Found${keywordAnalysis.keywords.UNIT_SPOTTED.location ? ` in ${keywordAnalysis.keywords.UNIT_SPOTTED.location}` : ''}` 
                            : 'Not Found'}
                        </Badge>
                      </div>

                      {/* Show matched text if keyword found */}
                      {keywordAnalysis.hasExclusionKeywords && (
                        <Alert variant="destructive" className="mt-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>
                            Exclusion Keywords Detected 
                            {keywordAnalysis.detectedBy && (
                              <span className="text-xs ml-2 font-normal">
                                ({keywordAnalysis.detectedBy === 'database' ? 'Database Check' : 'AI Analysis'})
                              </span>
                            )}
                          </AlertTitle>
                          <AlertDescription>
                            <div className="space-y-1">
                              {Object.values(keywordAnalysis.keywords)
                                .filter(k => k.found && k.exactMatch)
                                .map((k, idx) => (
                                  <div key={idx}>
                                    <span className="font-medium">{k.exactMatch}</span>
                                    {k.location && <span className="text-xs ml-2">- {k.location}</span>}
                                  </div>
                                ))}
                              {databaseKeywordResult?.updateContent && keywordAnalysis.detectedBy === 'database' && (
                                <div className="mt-2 p-2 bg-muted rounded text-xs">
                                  <span className="font-medium">Update content: </span>
                                  {databaseKeywordResult.updateContent.substring(0, 200)}
                                  {databaseKeywordResult.updateContent.length > 200 && '...'}
                                </div>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Waiting to analyze exclusion keywords...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Update History Analysis */}
            {caseData?.updates && keywordAnalysis?.analysisComplete && (
              <UpdateHistoryDisplay 
                updates={caseData.updates}
                keywordAnalysis={keywordAnalysis}
                databaseKeywordResult={databaseKeywordResult}
              />
            )}

            {/* User Update Check Section */}
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