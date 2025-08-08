"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { WorkflowStepProps } from "../../types"

export function PropertyVerificationStep({ onNext, onPrevious, onSkip }: WorkflowStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Property Verification</CardTitle>
        <CardDescription>Manually verify the property address</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>Address:</strong> 1101 EUCLID AVE APT 518, CLEVELAND, OH 44115
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Please complete the following steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Open Google Maps in a new tab</li>
              <li>Search for the address above</li>
              <li>Verify the property exists</li>
              <li>Note property characteristics</li>
            </ol>
          </div>

          <Button variant="outline" className="w-full">
            Open Google Maps
          </Button>

          <div className="space-y-2">
            <Label htmlFor="property-type">Property Type</Label>
            <Select>
              <SelectTrigger id="property-type">
                <SelectValue placeholder="Select property type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single-family">Single Family</SelectItem>
                <SelectItem value="multi-family">Multi-Family</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="apartment">Apartment Complex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="verified" />
            <Label htmlFor="verified" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I have verified this property on Google Maps
            </Label>
          </div>
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
          Mark as Verified →
        </Button>
      </CardFooter>
    </Card>
  )
}