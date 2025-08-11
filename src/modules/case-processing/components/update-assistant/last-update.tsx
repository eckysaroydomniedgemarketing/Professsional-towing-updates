"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, MapPin, FileText } from "lucide-react"
import { getLastUserUpdate, LastUserUpdate } from "../../services/template.service"

interface LastUpdateProps {
  caseId: string
  sessionId: string
}

export function LastUpdate({ caseId, sessionId }: LastUpdateProps) {
  const [lastUpdate, setLastUpdate] = useState<LastUserUpdate | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchLastUpdate() {
      setIsLoading(true)
      const update = await getLastUserUpdate(caseId, sessionId)
      setLastUpdate(update)
      setIsLoading(false)
    }

    if (caseId && sessionId) {
      fetchLastUpdate()
    }
  }, [caseId, sessionId])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Last Update Details</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : lastUpdate ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Date:</span>
              <span className="text-muted-foreground">
                {new Date(lastUpdate.update_date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Address Used:</span>
              <span className="text-muted-foreground">
                {lastUpdate.address_associated || 'No address specified'}
              </span>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Template Used:</span>
              </div>
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                  {lastUpdate.update_content}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {lastUpdate.update_author}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No previous user update found
          </div>
        )}
      </CardContent>
    </Card>
  )
}