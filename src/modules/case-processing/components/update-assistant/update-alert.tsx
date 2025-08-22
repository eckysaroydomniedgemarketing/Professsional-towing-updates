import React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"

interface UpdateAlertProps {
  alertMessage: { type: 'success' | 'error', message: string } | null
  automaticMode: boolean
  countdown: number | null
  onGetNextCase: () => void
}

export function UpdateAlert({ 
  alertMessage, 
  automaticMode, 
  countdown, 
  onGetNextCase 
}: UpdateAlertProps) {
  if (!alertMessage) return null

  return (
    <Alert className={alertMessage.type === 'success' ? 'border-green-500' : 'border-red-500'}>
      {alertMessage.type === 'success' ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <AlertDescription className={alertMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}>
        <div className="flex items-center justify-between">
          <span>{alertMessage.message}</span>
          {alertMessage.type === 'success' && (
            <div className="flex items-center gap-2">
              {automaticMode && countdown !== null ? (
                <span className="text-sm font-medium">
                  Moving to next case in {countdown}...
                </span>
              ) : !automaticMode && (
                <Button
                  size="sm"
                  onClick={onGetNextCase}
                  className="ml-4"
                >
                  Next Case →
                </Button>
              )}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}