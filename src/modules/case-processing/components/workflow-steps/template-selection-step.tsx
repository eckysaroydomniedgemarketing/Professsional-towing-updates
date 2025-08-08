"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { WorkflowStepProps } from "../../types"

export function TemplateSelectionStep({ onNext, onPrevious, onSkip }: WorkflowStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Template Selection</CardTitle>
        <CardDescription>Choose the appropriate template for this case</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Previous template used: Template A
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <Label htmlFor="template">Select Template</Label>
          <Select>
            <SelectTrigger id="template">
              <SelectValue placeholder="Choose template..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="b">Template B - Multi-Family Property</SelectItem>
              <SelectItem value="c">Template C - Commercial Property</SelectItem>
              <SelectItem value="d">Template D - Apartment Complex</SelectItem>
              <SelectItem value="e">Template E - Single Family Home</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm">
            <strong>Template B Preview:</strong><br />
            Agent conducted surveillance at the listed address. Property is a multi-family 
            residence with open parking area. No subject vehicle observed at location. 
            Will continue monitoring.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="review" />
          <Label htmlFor="review" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            I have reviewed the selected template
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          ← Previous
        </Button>
        <Button variant="ghost" onClick={onSkip}>
          Skip
        </Button>
        <Button onClick={onNext}>
          Continue →
        </Button>
      </CardFooter>
    </Card>
  )
}