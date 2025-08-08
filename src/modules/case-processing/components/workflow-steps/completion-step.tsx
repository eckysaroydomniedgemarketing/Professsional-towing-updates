"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { WorkflowStepProps } from "../../types"

export function CompletionStep({ onNext, onPrevious }: WorkflowStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 8: Case Complete</CardTitle>
        <CardDescription>Case processing completed successfully</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="default" className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            ✓ Case Processing Complete
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="text-sm font-medium">Summary</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Case ID:</span>
                <Badge variant="secondary">DEMO-12345</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Processing Time:</span>
                <span>2 minutes 15 seconds</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge variant="default">Completed</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Completed Steps:</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>✓ Case validated</p>
              <p>✓ Property verified manually</p>
              <p>✓ Template selected and applied</p>
              <p>✓ Update generated and reviewed</p>
              <p>✓ Update submitted to RDN</p>
              <p>✓ Notifications sent</p>
              <p>✓ VIN tracked</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <a href="/dashboard">Return to Dashboard</a>
        </Button>
        <div />
        <Button onClick={() => window.location.reload()}>
          Process Next Case →
        </Button>
      </CardFooter>
    </Card>
  )
}