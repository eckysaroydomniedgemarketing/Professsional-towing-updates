"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { WorkflowStepProps } from "../../types"

export function SubmissionStep({ onNext, onPrevious }: WorkflowStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 6: Update Submission</CardTitle>
        <CardDescription>Submitting update to RDN portal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Submission Progress</p>
          <Progress value={100} className="h-2" />
        </div>

        <Alert variant="default" className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            ✓ Update submitted successfully to RDN portal
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm font-medium">Submission Details:</p>
          <div className="p-4 bg-muted rounded-lg space-y-1">
            <p className="text-sm"><strong>Case ID:</strong> DEMO-12345</p>
            <p className="text-sm"><strong>Update Type:</strong> Agent-Update</p>
            <p className="text-sm"><strong>Address:</strong> 1101 EUCLID AVE APT 518</p>
            <p className="text-sm"><strong>Submitted:</strong> {new Date().toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled>
          ← Previous
        </Button>
        <div />
        <Button onClick={onNext}>
          Continue to Notifications →
        </Button>
      </CardFooter>
    </Card>
  )
}