"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WorkflowStepProps } from "../../types"

export function UpdateReviewStep({ onNext, onPrevious }: WorkflowStepProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(
    "Agent conducted surveillance at the listed address on 01/04/2025. " +
    "Property is a two-story multi-family residence with open parking area. " +
    "No subject vehicle observed at location. Will continue monitoring."
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 5: Update Review</CardTitle>
        <CardDescription>Review and approve the generated update</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="default">
          <AlertDescription>
            ⚠️ Please review this update carefully before submission
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Update Content:</Label>
            {!isEditing && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit Content
              </Button>
            )}
          </div>
          
          {isEditing ? (
            <>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px]"
                maxLength={1500}
              />
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Save Changes
                </Button>
                <p className="text-xs text-muted-foreground">
                  {content.length}/1500 characters
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{content}</p>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {content.length}/1500 characters
              </p>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="approve" />
          <Label htmlFor="approve" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            I have reviewed this update and approve it for submission to RDN portal
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          ← Back to Template
        </Button>
        <Button variant="secondary" onClick={() => setIsEditing(true)}>
          Request Changes
        </Button>
        <Button onClick={onNext}>
          Approve & Submit →
        </Button>
      </CardFooter>
    </Card>
  )
}