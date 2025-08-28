"use client"

import { useState, useEffect, useRef } from "react"
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
  selectedAgentUpdate?: any
  autoClickProtocol?: boolean
}

export function UpdateAssistant({ 
  caseData, 
  sessionId, 
  onSkip, 
  onPostUpdate,
  automaticMode,
  onGetNextCase,
  selectedAgentUpdate,
  autoClickProtocol = false
}: UpdateAssistantProps) {
  const [draftContent, setDraftContent] = useState<string>("")
  const [isPosting, setIsPosting] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [autoPostCountdown, setAutoPostCountdown] = useState<number | null>(null)
  const [autoPostTimer, setAutoPostTimer] = useState<NodeJS.Timeout | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [aiGeneratedContent, setAiGeneratedContent] = useState<string | null>(null)
  const [isLoadingAi, setIsLoadingAi] = useState(false)
  
  // Use ref to track if posting is in progress (prevents race conditions)
  const isPostingRef = useRef(false)
  
  // Use custom hook for template loading
  const {
    templates,
    selectedAddressId,
    selectedTemplateId,
    isLoading,
    lastUpdateAddress,
    updateBlockedInfo,
    setSelectedAddressId,
    setSelectedTemplateId
  } = useTemplateLoader(caseData, sessionId, setIsInitialLoad)

  // Process agent update with AI when selected
  const processAgentUpdate = async () => {
    if (!selectedAgentUpdate || !selectedAddressId || !selectedTemplateId) {
      console.log('Missing requirements for AI processing:', { 
        hasAgentUpdate: !!selectedAgentUpdate, 
        hasAddress: !!selectedAddressId, 
        hasTemplate: !!selectedTemplateId 
      })
      return
    }

    const template = templates.find(t => t.id === selectedTemplateId)
    if (!template) return

    setIsLoadingAi(true)
    setAiGeneratedContent(null)

    try {
      const selectedAddress = caseData.addresses?.find(a => a.id === selectedAddressId)
      const addressText = selectedAddress?.full_address || 'No address available'
      
      console.log('Processing agent update with AI:', {
        address: addressText,
        agentUpdate: selectedAgentUpdate.details,
        template: template.template_text
      })

      const response = await fetch('/api/case-processing/process-agent-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedAddress: addressText,
          agentUpdate: selectedAgentUpdate.details || '',
          selectedTemplate: template.template_text
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setAiGeneratedContent(result.processedContent)
        console.log('AI processing successful')
      } else {
        console.error('AI processing failed:', result.error)
      }
    } catch (error) {
      console.error('Error processing agent update:', error)
    } finally {
      setIsLoadingAi(false)
    }
  }

  // Trigger AI processing when agent update and selections are ready
  useEffect(() => {
    if (selectedAgentUpdate && selectedAddressId && selectedTemplateId && !automaticMode) {
      processAgentUpdate()
    }
  }, [selectedAgentUpdate, selectedAddressId, selectedTemplateId])

  // Set AI-generated content directly as draft when it's ready
  useEffect(() => {
    if (aiGeneratedContent && selectedAgentUpdate) {
      setDraftContent(aiGeneratedContent)
      console.log('AI-generated content set as draft')
    }
  }, [aiGeneratedContent, selectedAgentUpdate])

  // Generate draft when selections change (only when no agent update is selected)
  useEffect(() => {
    // Skip if we have an agent update (AI content will be used instead)
    if (selectedAgentUpdate) {
      return
    }

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
  }, [selectedAddressId, selectedTemplateId, caseData.addresses, templates, selectedAgentUpdate])

  // Auto-post countdown when automatic mode is ON and draft is ready
  useEffect(() => {
    // Start countdown only if:
    // 1. Automatic mode is ON
    // 2. Draft content is ready
    // 3. Not already posting
    // 4. No alert message (no errors)
    // 5. No existing countdown
    // 6. Not initial load (to prevent immediate trigger)
    // 7. Update is allowed (date validation passed)
    if (automaticMode && draftContent && !isPosting && !alertMessage && autoPostCountdown === null && !isInitialLoad && updateBlockedInfo.allowed) {
      console.log('[Auto-Post] Starting 10-second review countdown')
      setAutoPostCountdown(10)
      
      const interval = setInterval(() => {
        setAutoPostCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval)
            // Trigger post update when countdown reaches 0
            if (prev === 1) {
              console.log('[Auto-Post] Countdown complete, posting update')
              handlePostUpdate(true) // Pass true for automatic mode
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
  }, [automaticMode, draftContent, isPosting, alertMessage, isInitialLoad, updateBlockedInfo.allowed])

  const handleCancelAutoPost = () => {
    console.log('[Auto-Post] Cancelled by user')
    if (autoPostTimer) {
      clearTimeout(autoPostTimer)
      setAutoPostTimer(null)
    }
    setAutoPostCountdown(null)
  }

  const handlePostUpdate = async (isAutomatic: boolean = false) => {
    // Prevent duplicate calls - check both state and ref
    if (isPosting || isPostingRef.current) {
      console.log('[Post Update] Already posting, ignoring duplicate call')
      return
    }
    
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
    
    // Set both state and ref to prevent race conditions
    setIsPosting(true)
    isPostingRef.current = true
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
      
      console.log(`Calling API to post update to RDN portal (${isAutomatic ? 'automatic' : 'manual'} mode)...`)
      
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
          addressText: addressText,
          postingMode: isAutomatic ? 'automatic' : 'manual',
          sessionId: sessionId,
          autoClickProtocol: autoClickProtocol
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
      isPostingRef.current = false // Reset the ref as well
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
          {/* Date Validation Alert */}
          {!updateBlockedInfo.allowed && (
            <>
              <Card className="border-yellow-500 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <SkipForward className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">{updateBlockedInfo.message}</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Updates can only be posted after 2 days (excluding today) from the last update.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Separator />
            </>
          )}

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
              isGeneratingAi={isLoadingAi}
              selectedAgentUpdate={selectedAgentUpdate}
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
          onClick={() => handlePostUpdate(false)} // Pass false for manual mode
          disabled={!selectedAddressId || !selectedTemplateId || !draftContent || isPosting || autoPostCountdown !== null || !updateBlockedInfo.allowed}
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