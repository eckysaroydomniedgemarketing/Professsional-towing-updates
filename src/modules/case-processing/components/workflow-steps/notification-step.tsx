"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { WorkflowStepProps } from "../../types"

export function NotificationStep({ onNext, onPrevious }: WorkflowStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 7: Manual Notifications</CardTitle>
        <CardDescription>Complete notifications in RDN portal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            ✓ Update successfully posted! Now complete these steps in the RDN portal:
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm font-medium">In the RDN Portal Updates tab:</p>
          <div className="p-4 bg-muted rounded-lg">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to the Updates tab (should be open)</li>
              <li>Find your new update at the top</li>
              <li>Click these buttons in order:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Collector</li>
                  <li>Client</li>
                  <li>Transferred to Client</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="collector" />
            <Label htmlFor="collector" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I clicked "Collector" button
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="client" />
            <Label htmlFor="client" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I clicked "Client" button
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="transferred" />
            <Label htmlFor="transferred" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I clicked "Transferred to Client" button
            </Label>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">VIN:</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">3N1CN8DV3LL888403</Badge>
              <Button variant="outline" size="sm">
                Copy
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="vin" />
            <Label htmlFor="vin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              VIN logged to hourly progress report
            </Label>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled>
          ← Previous
        </Button>
        <div />
        <Button onClick={onNext}>
          Confirm All Complete →
        </Button>
      </CardFooter>
    </Card>
  )
}