import { useEffect, useState } from "react"
import { CaseValidationResult } from "../types/case.types"

export function useAutoSkip(
  automaticMode: boolean,
  validationResult: CaseValidationResult | null,
  onGetNextCase?: () => void
) {
  const [autoSkipCountdown, setAutoSkipCountdown] = useState<number | null>(null)

  useEffect(() => {
    // Check if we should auto-skip
    if (automaticMode && validationResult && !validationResult.passed && onGetNextCase) {
      // Start countdown
      setAutoSkipCountdown(10)
      
      const countdownInterval = setInterval(() => {
        setAutoSkipCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval)
            return null
          }
          return prev - 1
        })
      }, 1000)
      
      // Skip to next case after 10 seconds
      const skipTimer = setTimeout(() => {
        console.log('[useAutoSkip] Auto-skipping to next case due to validation failure')
        onGetNextCase()
        setAutoSkipCountdown(null)
      }, 10000)
      
      // Cleanup on unmount or if conditions change
      return () => {
        clearTimeout(skipTimer)
        clearInterval(countdownInterval)
        setAutoSkipCountdown(null)
      }
    }
  }, [automaticMode, validationResult, onGetNextCase])

  return autoSkipCountdown
}