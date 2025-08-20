import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle } from "lucide-react"
import { CaseValidationResult } from "../../types/case.types"

interface AgentUpdateSectionProps {
  validationResult: CaseValidationResult | null
}

export function AgentUpdateSection({ validationResult }: AgentUpdateSectionProps) {
  return (
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
}