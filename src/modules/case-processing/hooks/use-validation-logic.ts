import { useEffect, useState } from "react"
import { Case, CaseValidationResult } from "../types/case.types"
import { ValidationLogicService } from "../services/validation-logic.service"
import { ClientExclusionService } from "../services/client-exclusion.service"

export function useValidationLogic(
  caseData: Case | undefined,
  onValidationComplete?: (result: CaseValidationResult | null) => void
) {
  const [validationResult, setValidationResult] = useState<CaseValidationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showClientExclusion, setShowClientExclusion] = useState(false)

  useEffect(() => {
    const validateCase = async () => {
      console.log('useValidationLogic - caseData:', caseData)
      if (caseData) {
        setIsLoading(true)
        try {
          // Check if client exclusion table has data
          const clientExclusionService = ClientExclusionService.getInstance()
          const hasExclusions = await clientExclusionService.hasExclusions()
          setShowClientExclusion(hasExclusions)
          
          const result = await ValidationLogicService.validateCaseAndUpdateStatus(caseData)
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

  return {
    validationResult,
    isLoading,
    showClientExclusion
  }
}