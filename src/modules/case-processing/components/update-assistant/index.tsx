"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Send, SkipForward, Loader2 } from "lucide-react"
import { Case } from "../../types/case.types"
import { LastUpdate } from "./last-update"
import { DraftSection } from "./draft-section"
import { UpdateAlert } from "./update-alert"
import { AutoPostCountdown } from "./auto-post-countdown"
import { useTemplateLoader } from "./use-template-loader"
import { generateDraft } from "../../services/template.service"

interface UpdateAssistantProps {
  caseData: Case
  sessionId: string
  onSkip: () => void
  onPostUpdate: (content: string, addressId: string) => Promise<void>
  automaticMode: boolean
  onGetNextCase: () => void
}

export function UpdateAssistant({ 
  caseData, 
  sessionId, 
  onSkip, 
  onPostUpdate,
  automaticMode,
  onGetNextCase
}: UpdateAssistantProps) {
  const [draftContent, setDraftContent] = useState<string>("")
  const [isPosting, setIsPosting] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [autoPostCountdown, setAutoPostCountdown] = useState<number | null>(null)
  const [autoPostTimer, setAutoPostTimer] = useState<NodeJS.Timeout | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Use custom hook for template loading
  const {
    templates,
    selectedAddressId,
    selectedTemplateId,
    isLoading,
    lastUpdateAddress,
    setSelectedAddressId,
    setSelectedTemplateId
  } = useTemplateLoader(caseData, sessionId, setIsInitialLoad)


  // Generate draft when selections change
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId)
      
      if (template) {
        if (selectedAddressId === 'NO_VALID_ADDRESS') {
          // No valid address - remove all placeholders from template
          let cleanedTemplate = template.template_text
          // Remove address-related placeholders
          cleanedTemplate = cleanedTemplate.replace(/\{?\{address\}?\}/g, '')
          cleanedTemplate = cleanedTemplate.replace(/\{?\{city\}?\}/g, '')
          cleanedTemplate = cleanedTemplate.replace(/\{?\{state\}?\}/g, '')
          cleanedTemplate = cleanedTemplate.replace(/\{?\{zip\}?\}/g, '')
          cleanedTemplate = cleanedTemplate.replace(/\{?\{street\}?\}/g, '')
          cleanedTemplate = cleanedTemplate.replace(/\{?\{type\}?\}/g, '')
          // Clean up extra spaces and empty lines
          cleanedTemplate = cleanedTemplate.replace(/\s+/g, ' ').trim()
          
          setDraftContent(cleanedTemplate)
          console.log('Draft generated without address placeholders')
        } else if (selectedAddressId) {
          const address = caseData.addresses?.find(a => a.id === selectedAddressId)
          if (address) {
            const draft = generateDraft(template.template_text, address)
            setDraftContent(draft)
            console.log('Draft generated for address:', address.address_type, 'with template:', template.id)
          }
        }
      }
    } else {
      setDraftContent("")
    }
  }, [selectedAddressId, selectedTemplateId, caseData.addresses, templates])

  // Auto-post countdown when automatic mode is ON and draft is ready
  useEffect(() => {
    // Start countdown only if:
    // 1. Automatic mode is ON
    // 2. Draft content is ready
    // 3. Not already posting
    // 4. No alert message (no errors)
    // 5. No existing countdown
    // 6. Not initial load (to prevent immediate trigger)
    if (automaticMode && draftContent && !isPosting && !alertMessage && autoPostCountdown === null && !isInitialLoad) {
      console.log('[Auto-Post] Starting 10-second review countdown')
      setAutoPostCountdown(10)
      
      const interval = setInterval(() => {
        setAutoPostCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval)
            // Trigger post update when countdown reaches 0
            if (prev === 1) {
              console.log('[Auto-Post] Countdown complete, posting update')
              handlePostUpdate()
            }
            return null
          }
          return prev - 1
        })
      }, 1000)
      
      setAutoPostTimer(interval)
      
      return () => {
        if (interval) {
          clearInterval(interval)
        }
      }
    }
  }, [automaticMode, draftContent, isPosting, alertMessage, isInitialLoad])

  const handleCancelAutoPost = () => {
    console.log('[Auto-Post] Cancelled by user')
    if (autoPostTimer) {
      clearTimeout(autoPostTimer)
      setAutoPostTimer(null)
    }
    setAutoPostCountdown(null)
  }

  const handlePostUpdate = async () => {
    if (!selectedAddressId || !draftContent) {
      setAlertMessage({ type: 'error', message: 'Please ensure draft is generated' })
      return
    }
    
    // Clear auto-post countdown if it was running
    setAutoPostCountdown(null)
    if (autoPostTimer) {
      clearTimeout(autoPostTimer)
      setAutoPostTimer(null)
    }
    
    setIsPosting(true)
    setAlertMessage(null)
    
    try {
      // Get selected address for form filling (if valid address exists)
      let addressText = 'No valid address available'
      if (selectedAddressId !== 'NO_VALID_ADDRESS') {
        const selectedAddress = caseData.addresses?.find(a => a.id === selectedAddressId)
        if (!selectedAddress) {
          throw new Error('Selected address not found')
        }
        addressText = selectedAddress.full_address
      }
      
      console.log('Calling API to post update to RDN portal...')
      
      // Call API endpoint to handle automation
      const response = await fetch('/api/case-processing/post-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          caseId: caseData.id,
          addressId: selectedAddressId === 'NO_VALID_ADDRESS' ? null : selectedAddressId,
          draftContent: draftContent,
          addressText: addressText
        })
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to post update')
      }
      
      console.log('Update posted successfully via API')
      
      // Show success message
      setAlertMessage({ type: 'success', message: '✓ Update posted successfully to RDN portal!' })
      
      // Clear draft after successful post
      setDraftContent('')
      
      // Handle automatic mode
      if (automaticMode) {
        // Start countdown for auto-navigation
        let count = 10
        setCountdown(count)
        
        const countdownInterval = setInterval(() => {
          count--
          if (count > 0) {
            setCountdown(count)
          } else {
            clearInterval(countdownInterval)
            setCountdown(null)
            setAlertMessage(null)
            // Navigate to next case
            onGetNextCase()
          }
        }, 1000)
      }
      
    } catch (error) {
      console.error('Error posting update:', error)
      setAlertMessage({ type: 'error', message: '✗ Failed to post update. Please try manually.' })
      
      // Clear the alert after 5 seconds
      setTimeout(() => setAlertMessage(null), 5000)
    } finally {
      setIsPosting(false)
    }
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
        <CardTitle>Last Update</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="space-y-4">
          {/* Alert Messages */}
          <UpdateAlert
            alertMessage={alertMessage}
            automaticMode={automaticMode}
            countdown={countdown}
            onGetNextCase={onGetNextCase}
          />

          <Separator />

          {/* Last Update Details */}
          <LastUpdate
            caseId={caseData.id}
            sessionId={sessionId}
            currentAddressType={caseData.addresses?.find(a => a.id === selectedAddressId)?.address_type || ''}
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
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No templates available. Please check database connection.</p>
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
              lastUpdateAddress={lastUpdateAddress}
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
          disabled={isPosting || autoPostCountdown !== null}
        >
          <SkipForward className="h-4 w-4" />
          Skip
        </Button>
        
        {/* Auto-post countdown display */}
        {autoPostCountdown !== null && (
          <AutoPostCountdown
            countdown={autoPostCountdown}
            onCancel={handleCancelAutoPost}
          />
        )}
        
        <Button
          onClick={handlePostUpdate}
          disabled={!selectedAddressId || !selectedTemplateId || !draftContent || isPosting || autoPostCountdown !== null}
          className="gap-2"
        >
          {isPosting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Post Update
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}