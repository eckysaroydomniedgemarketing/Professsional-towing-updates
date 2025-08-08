"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WorkflowStepProps } from "../../types"

export function UpdateGenerationStep({ onNext, onPrevious }: WorkflowStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4: Update Generation</CardTitle>
        <CardDescription>Generating update from selected template</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Template B - Multi-Family Property selected
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm font-medium">Generating update...</p>
          <Progress value={100} className="h-2" />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Generated Content:</Label>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              Agent conducted surveillance at the listed address on 01/04/2025. 
              Property is a two-story multi-family residence with open parking area. 
              No subject vehicle observed at location. Will continue monitoring.
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-right">
            Characters: 245/1500
          </p>
        </div>

        <Alert variant="default">
          <AlertDescription>
            Update generated successfully. Please review before submission.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          ← Previous
        </Button>
        <div />
        <Button onClick={onNext}>
          Review Update →
        </Button>
      </CardFooter>
    </Card>
  )
}

// Import Label since it's used
import { Label } from "@/components/ui/label"