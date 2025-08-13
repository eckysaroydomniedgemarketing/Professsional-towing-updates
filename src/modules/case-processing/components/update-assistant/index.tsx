"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, SkipForward, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Case } from "../../types/case.types"
import { LastUpdate } from "./last-update"
import { DraftSection } from "./draft-section"
import { 
  fetchActiveTemplates, 
  generateDraft, 
  getLastUserUpdate,
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
  const [isPosting, setIsPosting] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [lastUpdateAddress, setLastUpdateAddress] = useState<string>("")

  // Load templates and last update on mount
  useEffect(() => {
    let retryCount = 0
    const maxRetries = 3
    
    async function loadTemplatesAndSelectAddress() {
      setIsLoading(true)
      
      // Load templates
      while (retryCount < maxRetries) {
        try {
          const templateList = await fetchActiveTemplates()
          console.log(`Fetched ${templateList.length} active templates`)
          setTemplates(templateList)
          
          // Auto-select a random template
          if (templateList.length > 0) {
            const randomIndex = Math.floor(Math.random() * templateList.length)
            const selectedTemplate = templateList[randomIndex]
            console.log('Auto-selected template:', selectedTemplate.id, selectedTemplate.category || 'No category')
            setSelectedTemplateId(selectedTemplate.id)
          } else {
            console.warn('No active templates found in database')
          }
          
          break // Success, exit retry loop
        } catch (error) {
          retryCount++
          console.error(`Failed to fetch templates (attempt ${retryCount}/${maxRetries}):`, error)
          
          if (retryCount === maxRetries) {
            console.error('Failed to load templates after maximum retries')
            setTemplates([])
          } else {
            // Wait 1 second before retry
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }
      
      // Fetch last update to get the previously used address
      let lastUsedAddressId = null
      try {
        const lastUpdate = await getLastUserUpdate(caseData.id, sessionId)
        if (lastUpdate && lastUpdate.address_associated) {
          setLastUpdateAddress(lastUpdate.address_associated)
          console.log('Last update used address text:', lastUpdate.address_associated)
          
          // Try to find which address was used by matching components
          const lastUsedAddress = caseData.addresses.find(addr => {
            // Get address components
            const addrStreet = addr.street_address?.toLowerCase().trim() || ''
            const addrCity = addr.city?.toLowerCase().trim() || ''
            const addrState = addr.state?.toLowerCase().trim() || ''
            
            // Parse last update address - format can be "street city state" or "street, city, state zip"
            const lastAddr = lastUpdate.address_associated?.toLowerCase().trim() || ''
            
            // Remove ZIP code if present (last 5 digits)
            const lastAddrNoZip = lastAddr.replace(/\s+\d{5}(-\d{4})?$/, '').trim()
            
            // Split by comma first (if formatted with commas)
            let parts = lastAddrNoZip.split(',').map(p => p.trim())
            
            if (parts.length >= 3) {
              // Format: "street, city, state"
              const lastStreet = parts[0]
              const lastCity = parts[1]
              const lastState = parts[2]
              
              return addrStreet === lastStreet && addrCity === lastCity && addrState === lastState
            } else {
              // Format without commas: "street city state"
              // Try to match by checking if all components are present in the string
              const streetMatch = lastAddrNoZip.includes(addrStreet)
              const cityMatch = lastAddrNoZip.includes(addrCity)
              const stateMatch = lastAddrNoZip.includes(addrState)
              
              // All components must match
              return addrStreet && addrCity && addrState && streetMatch && cityMatch && stateMatch
            }
          })
          
          if (lastUsedAddress) {
            lastUsedAddressId = lastUsedAddress.id
            console.log('Found last used address ID:', lastUsedAddressId, 'Type:', lastUsedAddress.address_type)
          } else {
            console.log('Could not match last used address to any current address')
          }
        }
      } catch (error) {
        console.log('No previous update found or error fetching:', error)
      }
      
      // Auto-select address based on alternation logic
      if (caseData.addresses && caseData.addresses.length > 0) {
        let selectedAddress = null
        
        if (caseData.addresses.length === 1) {
          // Only one address available, use it
          selectedAddress = caseData.addresses[0]
          console.log('Only one address available, using:', selectedAddress.address_type, selectedAddress.full_address)
        } else if (lastUsedAddressId) {
          // Multiple addresses, select a different one from last update
          const differentAddress = caseData.addresses.find(
            addr => addr.id !== lastUsedAddressId
          )
          
          if (differentAddress) {
            selectedAddress = differentAddress
            console.log('Selected alternate address:', differentAddress.address_type, differentAddress.full_address)
          } else {
            // No different address found (shouldn't happen with multiple addresses)
            selectedAddress = caseData.addresses[0]
            console.log('Warning: Could not find alternate, using first address')
          }
        } else {
          // No last update found, use first address
          selectedAddress = caseData.addresses[0]
          console.log('No last update found, using first address:', selectedAddress.address_type)
        }
        
        if (selectedAddress) {
          setSelectedAddressId(selectedAddress.id)
        }
      }
      
      setIsLoading(false)
    }
    
    loadTemplatesAndSelectAddress()
  }, [caseData.id, caseData.addresses, sessionId])

  // Generate draft when selections change
  useEffect(() => {
    if (selectedAddressId && selectedTemplateId) {
      const address = caseData.addresses?.find(a => a.id === selectedAddressId)
      const template = templates.find(t => t.id === selectedTemplateId)
      
      if (address && template) {
        const draft = generateDraft(template.template_text, address)
        setDraftContent(draft)
        console.log('Draft generated for address:', address.address_type, 'with template:', template.id)
      }
    } else {
      setDraftContent("")
    }
  }, [selectedAddressId, selectedTemplateId, caseData.addresses, templates])

  const handlePostUpdate = async () => {
    if (!selectedAddressId || !draftContent) {
      setAlertMessage({ type: 'error', message: 'Please select an address and ensure draft is generated' })
      return
    }
    
    setIsPosting(true)
    setAlertMessage(null)
    
    try {
      // Get selected address for form filling
      const selectedAddress = caseData.addresses?.find(a => a.id === selectedAddressId)
      if (!selectedAddress) {
        throw new Error('Selected address not found')
      }
      
      console.log('Starting to fill RDN update form...')
      
      // Scroll to the form section
      await window.mcp__playwright__browser_evaluate({
        function: "() => { document.querySelector('#updatesForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return true; }"
      })
      
      // Wait briefly for scroll
      await window.mcp__playwright__browser_wait_for({ time: 1 })
      
      // Select Type dropdown - "(O) Agent-Update" with value="36"
      await window.mcp__playwright__browser_select_option({
        element: 'Type dropdown',
        ref: '#updates_type',
        values: ['36']
      })
      
      // Find and select matching address in dropdown
      const addressOptions = await window.mcp__playwright__browser_evaluate({
        function: `() => {
          const select = document.querySelector('#is_address_update_select');
          if (!select) return [];
          return Array.from(select.options).map(opt => ({
            value: opt.value,
            text: opt.textContent.trim()
          }));
        }`
      })
      
      // Find matching address value
      const addressPart = selectedAddress.full_address?.split(',')[0] || ''
      const matchingOption = addressOptions?.find((opt: any) => 
        opt.text && opt.text.includes(addressPart)
      )
      
      if (matchingOption) {
        await window.mcp__playwright__browser_select_option({
          element: 'Address dropdown',
          ref: '#is_address_update_select',
          values: [matchingOption.value]
        })
      }
      
      // Fill Details textarea with draft content
      await window.mcp__playwright__browser_type({
        element: 'Details textarea',
        ref: '#comments',
        text: draftContent
      })
      
      // Click Create button to submit
      await window.mcp__playwright__browser_click({
        element: 'Create button',
        ref: '#create_button'
      })
      
      // Wait for submission
      await window.mcp__playwright__browser_wait_for({ time: 2 })
      
      // Show success message
      setAlertMessage({ type: 'success', message: '✓ Update posted successfully to RDN portal!' })
      
      // Clear the alert after 5 seconds
      setTimeout(() => setAlertMessage(null), 5000)
      
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
          {alertMessage && (
            <Alert className={alertMessage.type === 'success' ? 'border-green-500' : 'border-red-500'}>
              {alertMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription className={alertMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                {alertMessage.message}
              </AlertDescription>
            </Alert>
          )}

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
          disabled={isPosting}
        >
          <SkipForward className="h-4 w-4" />
          Skip
        </Button>
        
        <Button
          onClick={handlePostUpdate}
          disabled={!selectedAddressId || !selectedTemplateId || !draftContent || isPosting}
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