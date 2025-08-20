import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { CaseValidationResult } from "../../types/case.types"

interface UserUpdateSectionProps {
  validationResult: CaseValidationResult | null
}

export function UserUpdateSection({ validationResult }: UserUpdateSectionProps) {
  return (
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
}