'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { WorkflowStatus } from './workflow-status'
import { NavigationStep } from '../types'
import { Play, Pause, RotateCcw, Eye } from 'lucide-react'

interface WorkflowControlProps {
  onWorkflowComplete?: (caseId?: string) => void
  autoStart?: boolean
}

export function WorkflowControl({ onWorkflowComplete, autoStart = false }: WorkflowControlProps = {}) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState<NavigationStep>(NavigationStep.INITIAL)
  const [error, setError] = useState<string>()
  const [sessionUrl, setSessionUrl] = useState<string>()
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (autoStart && !hasStartedRef.current) {
      hasStartedRef.current = true
      handleStart()
    }
  }, [autoStart])

  const handleStart = async () => {
    setIsRunning(true)
    setError(undefined)
    
    try {
      // Call API to start workflow
      const response = await fetch('/api/module-1/start-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to start workflow')
      }
      
      // Poll for status updates
      const pollInterval = setInterval(async () => {
        const statusResponse = await fetch('/api/module-1/status')
        if (statusResponse.ok) {
          const status = await statusResponse.json()
          setCurrentStep(status.currentStep)
          setSessionUrl(status.currentUrl)
          
          if (status.error) {
            setError(status.error)
            clearInterval(pollInterval)
            setIsRunning(false)
          } else if (status.currentStep === NavigationStep.CASE_DETAIL) {
            clearInterval(pollInterval)
            setIsRunning(false)
            // Call completion callback when workflow finishes successfully
            if (onWorkflowComplete) {
              // Check for case ID in status data first, then fall back to URL extraction
              const caseId = status.data?.caseId || (() => {
                const caseIdMatch = status.currentUrl?.match(/case_id=(\d+)/)
                return caseIdMatch ? caseIdMatch[1] : undefined
              })()
              onWorkflowComplete(caseId)
            }
          }
        }
      }, 1000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setIsRunning(false)
    }
  }

  const handleStop = async () => {
    try {
      await fetch('/api/module-1/stop-workflow', {
        method: 'POST'
      })
      setIsRunning(false)
    } catch (err) {
      console.error('Failed to stop workflow:', err)
    }
  }

  const handleReset = () => {
    setCurrentStep(NavigationStep.INITIAL)
    setError(undefined)
    setSessionUrl(undefined)
    setIsRunning(false)
  }

  const handleInspect = () => {
    if (sessionUrl) {
      window.open(sessionUrl, '_blank')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {autoStart && !isRunning && (
        <div className="text-center py-4">
          <div className="text-lg font-medium text-muted-foreground">
            Initializing workflow...
          </div>
        </div>
      )}
      <WorkflowStatus currentStep={currentStep} error={error} />
      
      <div className="flex items-center gap-3">
        {!autoStart && !isRunning ? (
          <Button onClick={handleStart} disabled={currentStep === NavigationStep.CASE_DETAIL}>
            <Play className="w-4 h-4 mr-2" />
            Start Workflow
          </Button>
        ) : isRunning ? (
          <Button onClick={handleStop} variant="destructive">
            <Pause className="w-4 h-4 mr-2" />
            Stop Workflow
          </Button>
        ) : null}
        
        {!autoStart && (
          <Button onClick={handleReset} variant="outline" disabled={isRunning}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        )}
        
        {sessionUrl && (
          <Button onClick={handleInspect} variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Inspect Browser
          </Button>
        )}
      </div>
      
      {sessionUrl && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Current URL:</span> {sessionUrl}
        </div>
      )}
    </div>
  )
}