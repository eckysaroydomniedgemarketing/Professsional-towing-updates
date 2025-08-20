import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle } from "lucide-react"
import { Case, CaseValidationResult } from "../../types/case.types"

interface ClientExclusionSectionProps {
  caseData: Case | undefined
  validationResult: CaseValidationResult | null
  showClientExclusion: boolean
}

export function ClientExclusionSection({ 
  caseData, 
  validationResult, 
  showClientExclusion 
}: ClientExclusionSectionProps) {
  if (!showClientExclusion) return null

  return (
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
  )
}