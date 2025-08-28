"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Copy } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface AIGeneratedContentProps {
  content: string | null
  isLoading: boolean
  onUseAsDraft: () => void
  onRegenerate: () => void
}

export function AIGeneratedContent({
  content,
  isLoading,
  onUseAsDraft,
  onRegenerate
}: AIGeneratedContentProps) {
  if (!content && !isLoading) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">AI-Processed Update</CardTitle>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            AI Generated
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Processing agent update...</span>
          </div>
        ) : content ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{content}</p>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button
                onClick={onUseAsDraft}
                className="flex-1"
                variant="default"
              >
                <Copy className="h-4 w-4 mr-2" />
                Use as Draft
              </Button>
              <Button
                onClick={onRegenerate}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}