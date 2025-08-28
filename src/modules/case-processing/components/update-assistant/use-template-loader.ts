import { useState, useEffect } from "react"
import { Case } from "../../types/case.types"
import { 
  fetchActiveTemplates, 
  getLastUserUpdate,
  determineTemplateCategory,
  isUpdateAllowed,
  Template 
} from "../../services/template.service"

export function useTemplateLoader(
  caseData: Case,
  sessionId: string,
  setIsInitialLoad: (value: boolean) => void
) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdateAddress, setLastUpdateAddress] = useState<string>("")
  const [updateBlockedInfo, setUpdateBlockedInfo] = useState<{ allowed: boolean; daysUntilAllowed: number; message: string }>({ 
    allowed: true, 
    daysUntilAllowed: 0, 
    message: '' 
  })

  useEffect(() => {
    async function loadTemplatesAndSelectAddress() {
      setIsLoading(true)
      
      // Fetch last update to get the previously used address and check date
      let lastUsedAddressId = null
      let lastUpdateDate = null
      try {
        const lastUpdate = await getLastUserUpdate(caseData.id, sessionId)
        if (lastUpdate) {
          lastUpdateDate = lastUpdate.update_date
          
          // Check if update is allowed based on date
          const dateValidation = isUpdateAllowed(lastUpdateDate)
          setUpdateBlockedInfo(dateValidation)
          console.log('Date validation:', dateValidation)
          
          if (lastUpdate.address_associated) {
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
        } else {
          // No previous update found, allow posting
          setUpdateBlockedInfo({ allowed: true, daysUntilAllowed: 0, message: 'No previous update found' })
        }
      } catch (error) {
        console.log('No previous update found or error fetching:', error)
      }
      
      // Auto-select address based on alternation logic - only consider valid addresses
      if (caseData.addresses && caseData.addresses.length > 0) {
        // Filter to only valid addresses (address_validity !== false)
        const validAddresses = caseData.addresses.filter(
          addr => addr.address_validity !== false
        )
        
        console.log(`Found ${validAddresses.length} valid addresses out of ${caseData.addresses.length} total`)
        
        let selectedAddress = null
        const hasValidAddresses = validAddresses.length > 0
        
        if (!hasValidAddresses) {
          // No valid addresses available
          console.log('Warning: No valid addresses available for this case')
          setSelectedAddressId('NO_VALID_ADDRESS')
        } else if (validAddresses.length === 1) {
          // Only one valid address available, use it
          selectedAddress = validAddresses[0]
          console.log('Only one valid address available, using:', selectedAddress.address_type, selectedAddress.full_address)
        } else if (lastUsedAddressId) {
          // Multiple valid addresses, select a different one from last update
          const differentAddress = validAddresses.find(
            addr => addr.id !== lastUsedAddressId
          )
          
          if (differentAddress) {
            selectedAddress = differentAddress
            console.log('Selected alternate valid address:', differentAddress.address_type, differentAddress.full_address)
          } else {
            // No different address found (last used address might be the only valid one)
            selectedAddress = validAddresses[0]
            console.log('Warning: Could not find alternate valid address, using first valid address')
          }
        } else {
          // No last update found, use first valid address
          selectedAddress = validAddresses[0]
          console.log('No last update found, using first valid address:', selectedAddress.address_type)
        }
        
        if (selectedAddress) {
          setSelectedAddressId(selectedAddress.id)
        }
        
        // Load templates based on whether we have valid addresses
        await loadTemplatesBasedOnValidity(hasValidAddresses)
      }
      
      setIsLoading(false)
      // Mark initial load as complete after a short delay to prevent immediate auto-post
      setTimeout(() => setIsInitialLoad(false), 1000)
    }
    
    async function loadTemplatesBasedOnValidity(hasValidAddresses: boolean) {
      const category = determineTemplateCategory(hasValidAddresses)
      console.log(`Loading templates for category: "${category}" (hasValidAddresses: ${hasValidAddresses})`)
      
      let retryCount = 0
      const maxRetries = 3
      
      while (retryCount < maxRetries) {
        try {
          const templateList = await fetchActiveTemplates(category)
          console.log(`Fetched ${templateList.length} templates for category: ${category}`)
          setTemplates(templateList)
          
          // Auto-select a random template from the category
          if (templateList.length > 0) {
            const randomIndex = Math.floor(Math.random() * templateList.length)
            const selectedTemplate = templateList[randomIndex]
            console.log('Auto-selected template:', selectedTemplate.id, 'from category:', category)
            setSelectedTemplateId(selectedTemplate.id)
          } else {
            console.warn(`No templates found for category: ${category}`)
            setSelectedTemplateId('')
          }
          
          break // Success, exit retry loop
        } catch (error) {
          retryCount++
          console.error(`Failed to fetch templates (attempt ${retryCount}/${maxRetries}):`, error)
          
          if (retryCount === maxRetries) {
            console.error('Failed to load templates after maximum retries')
            setTemplates([])
            setSelectedTemplateId('')
          } else {
            // Wait 1 second before retry
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }
    }
    
    loadTemplatesAndSelectAddress()
  }, [caseData.id, caseData.addresses, sessionId, setIsInitialLoad])
  
  // Add effect to reload templates when address selection changes
  useEffect(() => {
    if (!selectedAddressId || !caseData.addresses) return
    
    async function reloadTemplatesForNewAddress() {
      // Determine if we have valid addresses
      const hasValidAddresses = selectedAddressId !== 'NO_VALID_ADDRESS'
      
      const category = determineTemplateCategory(hasValidAddresses)
      console.log(`Reloading templates for category: "${category}" (hasValidAddresses: ${hasValidAddresses})`)
      
      try {
        const templateList = await fetchActiveTemplates(category)
        console.log(`Fetched ${templateList.length} templates for category: ${category}`)
        setTemplates(templateList)
        
        // Auto-select a random template from the category
        if (templateList.length > 0) {
          const randomIndex = Math.floor(Math.random() * templateList.length)
          const selectedTemplate = templateList[randomIndex]
          console.log('Auto-selected template:', selectedTemplate.id, 'from category:', category)
          setSelectedTemplateId(selectedTemplate.id)
        } else {
          console.warn(`No templates found for category: ${category}`)
          setSelectedTemplateId('')
        }
      } catch (error) {
        console.error('Failed to reload templates:', error)
        setTemplates([])
        setSelectedTemplateId('')
      }
    }
    
    // Only reload if address was manually changed (not during initial load)
    if (!isLoading) {
      reloadTemplatesForNewAddress()
    }
  }, [selectedAddressId, caseData.addresses, isLoading])

  return {
    templates,
    selectedAddressId,
    selectedTemplateId,
    isLoading,
    lastUpdateAddress,
    updateBlockedInfo,
    setSelectedAddressId,
    setSelectedTemplateId
  }
}