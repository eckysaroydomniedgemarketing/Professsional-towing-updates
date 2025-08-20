import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle } from "lucide-react"
import { CaseValidationResult, ExclusionKeywordResults } from "../../types/case.types"

interface ValidationResultAlertProps {
  validationResult: CaseValidationResult | null
  keywordAnalysis: ExclusionKeywordResults | null
}

export function ValidationResultAlert({ 
  validationResult, 
  keywordAnalysis 
}: ValidationResultAlertProps) {
  if (!validationResult) return null

  const isPassed = validationResult.passed && !keywordAnalysis?.hasExclusionKeywords && !keywordAnalysis?.error

  return (
    <Alert 
      variant={isPassed ? "default" : "destructive"}
      className={`border-2 ${isPassed ? 'border-green-500 bg-green-50' : ''}`}
    >
      <div className="flex items-start gap-2">
        {isPassed ? (
          <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 mt-0.5" />
        )}
        <div className="flex-1">
          <AlertTitle className={`text-lg ${isPassed ? 'text-green-800' : ''}`}>
            {isPassed ? 
              'Case Eligible for Update Posting' : 
              keywordAnalysis?.error ? 'Case Cannot Be Processed' : 'Case Not Eligible for Processing'}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {isPassed ? (
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
  )
}