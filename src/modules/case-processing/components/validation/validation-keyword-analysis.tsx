"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { ExclusionKeywordResults } from "../../types/case.types"
import { DatabaseKeywordResult } from "../../services/keyword-check.service"

interface ValidationKeywordAnalysisProps {
  hasAgentUpdate: boolean
  isAnalyzingKeywords: boolean
  keywordAnalysis: ExclusionKeywordResults | null
  databaseKeywordResult: DatabaseKeywordResult | null
  caseUpdateCount?: number
  onRetryAnalysis: () => void
}

export function ValidationKeywordAnalysis({
  hasAgentUpdate,
  isAnalyzingKeywords,
  keywordAnalysis,
  databaseKeywordResult,
  caseUpdateCount = 0,
  onRetryAnalysis
}: ValidationKeywordAnalysisProps) {
  const renderKeywordCheck = (keyword: string, description: string, keywordData: any) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-3">
        {keywordData?.found ? (
          <XCircle className="h-5 w-5 text-destructive" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        )}
        <div>
          <span className="font-medium">{keyword} Check</span>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Badge 
        variant={keywordData?.found ? "destructive" : "outline"}
        className={!keywordData?.found ? 'text-green-600 border-green-600' : ''}
      >
        {keywordData?.found 
          ? `Found${keywordData.location ? ` in ${keywordData.location}` : ''}` 
          : 'Not Found'}
      </Badge>
    </div>
  )

  return (
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
          {!hasAgentUpdate ? (
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
                    : `Analyzing ${caseUpdateCount} updates with AI...`}
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
                    onClick={onRetryAnalysis}
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
              {renderKeywordCheck('DRN', 'Digital Recognition Network hits', keywordAnalysis.keywords.DRN)}
              {renderKeywordCheck('LPR', 'License Plate Reader scans', keywordAnalysis.keywords.LPR)}
              {renderKeywordCheck('GPS', 'GPS tracking or coordinates', keywordAnalysis.keywords.GPS)}
              {renderKeywordCheck('SURRENDER', 'Voluntary surrender by customer', keywordAnalysis.keywords.SURRENDER)}
              {renderKeywordCheck('UNIT SPOTTED', 'Unit spotted or found at location', keywordAnalysis.keywords.UNIT_SPOTTED)}

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
  )
}