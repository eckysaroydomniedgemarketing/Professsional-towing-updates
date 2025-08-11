"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sidebar } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { WorkflowStatus } from "../types"

interface WorkflowSidebarProps {
  workflowStatus: WorkflowStatus
  currentCase: string | null
  onStartWorkflow: () => void
  onPauseWorkflow: () => void
  onStopWorkflow: () => void
  hasCompletedCase?: boolean
  onLoadCase?: (caseId: string) => void
  onGetNextCase?: () => void
  showWorkflowControl?: boolean
  currentStep?: number
  totalSteps?: number
}

export function WorkflowSidebar({
  workflowStatus,
  currentCase,
  onStartWorkflow,
  onPauseWorkflow,
  onStopWorkflow,
  hasCompletedCase = false,
  onLoadCase,
  onGetNextCase,
  showWorkflowControl = false,
  currentStep = 0,
  totalSteps = 8
}: WorkflowSidebarProps) {
  const [caseIdInput, setCaseIdInput] = useState("")
  const [automationEnabled, setAutomationEnabled] = useState(false)
  return (
    <Sidebar className="w-64 border-r">
      {/* Workflow Control Card - Always visible */}
      <Card className="m-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Workflow Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            size="lg" 
            className="w-full"
            onClick={hasCompletedCase && !automationEnabled ? onGetNextCase : onStartWorkflow}
            disabled={workflowStatus === 'running' || showWorkflowControl}
          >
            {hasCompletedCase && !automationEnabled ? 'Post Next Update' : 'Post Case Update'}
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Separator className="flex-1" />
            <span>OR</span>
            <Separator className="flex-1" />
          </div>
          
          <div className="space-y-2">
            <Input
              placeholder="Enter Case ID"
              value={caseIdInput}
              onChange={(e) => setCaseIdInput(e.target.value)}
              disabled={workflowStatus === 'running' || showWorkflowControl}
            />
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => {
                if (caseIdInput && onLoadCase) {
                  onLoadCase(caseIdInput)
                  setCaseIdInput("")
                }
              }}
              disabled={workflowStatus === 'running' || !caseIdInput || showWorkflowControl}
            >
              Load Case
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="automation"
              checked={automationEnabled}
              onCheckedChange={setAutomationEnabled}
              disabled={workflowStatus === 'running' || showWorkflowControl}
            />
            <Label 
              htmlFor="automation" 
              className="text-sm font-normal cursor-pointer"
            >
              Automatic Mode
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Current Status Card */}
      <Card className="mx-4 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Current Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={workflowStatus === 'running' ? 'default' : 'outline'}>
                {workflowStatus.charAt(0).toUpperCase() + workflowStatus.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Case</span>
              <span className="text-sm font-medium">
                {currentCase ? `#${currentCase}` : 'None'}
              </span>
            </div>
            {currentCase && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Step</span>
                  <span className="text-sm font-medium">
                    {currentStep + 1} of {totalSteps}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">
                    {Math.round(((currentStep + 1) / totalSteps) * 100)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Actions Card */}
      <Card className="mx-4 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full"
            disabled={!currentCase || workflowStatus !== 'running'}
            onClick={onPauseWorkflow}
          >
            ⏸ Pause
          </Button>
          <Button 
            variant="destructive" 
            className="w-full"
            disabled={!currentCase && !showWorkflowControl}
            onClick={onStopWorkflow}
          >
            ⏹ Stop
          </Button>
        </CardContent>
      </Card>
    </Sidebar>
  )
}