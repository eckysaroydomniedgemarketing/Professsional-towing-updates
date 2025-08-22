import React from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface AutoPostCountdownProps {
  countdown: number
  onCancel: () => void
}

export function AutoPostCountdown({ countdown, onCancel }: AutoPostCountdownProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <span className="font-medium">
          Auto-posting in <span className="text-lg font-bold text-blue-600">{countdown}</span> seconds...
        </span>
      </div>
      <Button
        size="sm"
        variant="destructive"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  )
}