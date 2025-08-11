"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Send, SkipForward, Loader2 } from "lucide-react"
import { Case } from "../../types/case.types"
import { AddressList } from "./address-list"
import { LastUpdate } from "./last-update"
import { DraftSection } from "./draft-section"
import { 
  fetchActiveTemplates, 
  generateDraft, 
  Template 
} from "../../services/template.service"

interface UpdateAssistantProps {
  caseData: Case
  sessionId: string
  onSkip: () => void
  onPostUpdate: (content: string, addressId: string) => Promise<void>
}

export function UpdateAssistant({ 
  caseData, 
  sessionId, 
  onSkip, 
  onPostUpdate 
}: UpdateAssistantProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [draftContent, setDraftContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // Load templates on mount and auto-select random template
  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true)
      const templateList = await fetchActiveTemplates()
      setTemplates(templateList)
      
      // Auto-select a random template
      if (templateList.length > 0) {
        const randomIndex = Math.floor(Math.random() * templateList.length)
        setSelectedTemplateId(templateList[randomIndex].id)
      }
      
      setIsLoading(false)
    }
    loadTemplates()
  }, [])

  // Generate draft when selections change
  useEffect(() => {
    if (selectedAddressId && selectedTemplateId) {
      const address = caseData.addresses?.find(a => a.id === selectedAddressId)
      const template = templates.find(t => t.id === selectedTemplateId)
      
      if (address && template) {
        const draft = generateDraft(template.template_text, address)
        setDraftContent(draft)
      }
    }
  }, [selectedAddressId, selectedTemplateId, caseData.addresses, templates])

  const handlePostUpdate = async () => {
    // TODO: Implement post update functionality
    console.log("Post update functionality will be implemented in the next phase")
  }

  if (!caseData.addresses || caseData.addresses.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No addresses available for this case</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Update Assistant</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="space-y-4">
          {/* Address Selection */}
          <AddressList
            addresses={caseData.addresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={setSelectedAddressId}
          />

          <Separator />

          {/* Last Update Details */}
          <LastUpdate
            caseId={caseData.id}
            sessionId={sessionId}
          />

          <Separator />

          {/* Draft Section */}
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading templates...</span>
              </CardContent>
            </Card>
          ) : (
            <DraftSection
              addresses={caseData.addresses}
              templates={templates}
              selectedAddressId={selectedAddressId}
              selectedTemplateId={selectedTemplateId}
              onAddressChange={setSelectedAddressId}
              onTemplateChange={() => {}} 
              draftContent={draftContent}
            />
          )}
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="flex justify-between gap-2 pt-4">
        <Button
          variant="outline"
          onClick={onSkip}
          className="gap-2"
        >
          <SkipForward className="h-4 w-4" />
          Skip
        </Button>
        
        <Button
          onClick={handlePostUpdate}
          disabled={!selectedAddressId || !selectedTemplateId || !draftContent}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          Post Update
        </Button>
      </CardFooter>
    </Card>
  )
}