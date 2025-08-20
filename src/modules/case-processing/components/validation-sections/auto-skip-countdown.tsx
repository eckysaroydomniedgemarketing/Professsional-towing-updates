import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface AutoSkipCountdownProps {
  countdown: number
}

export function AutoSkipCountdown({ countdown }: AutoSkipCountdownProps) {
  return (
    <Alert className="mt-2 border-yellow-200 bg-yellow-50">
      <AlertDescription className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Case rejected. Loading next case in {countdown} seconds...
      </AlertDescription>
    </Alert>
  )
}