'use client'

import { Progress } from "@/components/ui/progress"
import { NavigationStep } from "../types"
import { CheckCircle2, Circle, AlertCircle, Loader2 } from "lucide-react"

interface WorkflowStatusProps {
  currentStep: NavigationStep
  error?: string
}

const WORKFLOW_STEPS = [
  { key: NavigationStep.LOGIN_PAGE, label: "Navigate to Login", progress: 20 },
  { key: NavigationStep.AUTHENTICATING, label: "Authenticate", progress: 40 },
  { key: NavigationStep.DASHBOARD, label: "Dashboard Access", progress: 60 },
  { key: NavigationStep.CASE_LISTING, label: "Case Listing", progress: 80 },
  { key: NavigationStep.CASE_DETAIL, label: "Case Detail", progress: 100 }
]

export function WorkflowStatus({ currentStep, error }: WorkflowStatusProps) {
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.key === currentStep)
  const currentProgress = currentStepIndex >= 0 ? WORKFLOW_STEPS[currentStepIndex].progress : 0

  const getStepIcon = (step: typeof WORKFLOW_STEPS[0], index: number) => {
    if (currentStep === NavigationStep.ERROR && index === currentStepIndex) {
      return <AlertCircle className="w-5 h-5 text-red-500" />
    }
    if (index < currentStepIndex) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />
    }
    if (index === currentStepIndex) {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
    }
    return <Circle className="w-5 h-5 text-gray-400" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Module 1: RDN Portal Navigation</h3>
        <span className="text-sm text-gray-500">{currentProgress}% Complete</span>
      </div>
      
      <Progress value={currentProgress} className="h-2" />
      
      <div className="space-y-3">
        {WORKFLOW_STEPS.map((step, index) => (
          <div 
            key={step.key} 
            className={`flex items-center gap-3 ${
              index <= currentStepIndex ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            {getStepIcon(step, index)}
            <span className="text-sm">{step.label}</span>
          </div>
        ))}
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}