// Address validation utilities

export function extractAddressFromUpdate(updateDetails: string): string | null {
  if (!updateDetails) return null
  
  // Look for common address patterns in update text
  // Pattern 1: Look for explicit address mentions after keywords like "at", "located at", "address:"
  const addressPatterns = [
    /(?:at|located at|address:?)\s+([^.;,\n]+(?:,\s*[A-Z]{2}\s+\d{5})?)/i,
    /(\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|boulevard|blvd)[^.;,\n]*)/i,
    // Pattern for full address with city, state, zip
    /(\d+\s+[\w\s]+,\s*[\w\s]+,\s*[A-Z]{2}\s+\d{5})/i
  ]
  
  for (const pattern of addressPatterns) {
    const match = updateDetails.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return null
}

export function normalizeAddress(address: string): string {
  if (!address) return ''
  
  // Convert to lowercase and remove extra spaces
  let normalized = address.toLowerCase().trim().replace(/\s+/g, ' ')
  
  // Remove common punctuation
  normalized = normalized.replace(/[.,;]/g, '')
  
  // Standardize common abbreviations
  const abbreviations: Record<string, string> = {
    'street': 'st',
    'avenue': 'ave',
    'road': 'rd',
    'drive': 'dr',
    'lane': 'ln',
    'boulevard': 'blvd',
    'court': 'ct',
    'place': 'pl',
    'circle': 'cir',
    'north': 'n',
    'south': 's',
    'east': 'e',
    'west': 'w'
  }
  
  for (const [full, abbr] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${full}\\b`, 'g')
    normalized = normalized.replace(regex, abbr)
  }
  
  return normalized
}

export function addressesMatch(address1: string, address2: string): boolean {
  if (!address1 || !address2) return false
  
  const normalized1 = normalizeAddress(address1)
  const normalized2 = normalizeAddress(address2)
  
  // Check if one address contains the other (partial match)
  return normalized1.includes(normalized2) || normalized2.includes(normalized1)
}

export function validateAgentUpdateAddress(
  updateDetails: string,
  selectedAddress: string
): { isValid: boolean; extractedAddress: string | null; message?: string } {
  const extractedAddress = extractAddressFromUpdate(updateDetails)
  
  if (!extractedAddress) {
    // No address found in update - this is okay
    return { 
      isValid: true, 
      extractedAddress: null 
    }
  }
  
  if (!selectedAddress) {
    return {
      isValid: false,
      extractedAddress,
      message: 'No address selected to validate against'
    }
  }
  
  const matches = addressesMatch(extractedAddress, selectedAddress)
  
  if (!matches) {
    return {
      isValid: false,
      extractedAddress,
      message: `Update contains a different address: "${extractedAddress}". Please select an update for "${selectedAddress}"`
    }
  }
  
  return {
    isValid: true,
    extractedAddress
  }
}

export function findAddressUsedInLastUpdate(updates: any[]): string | null {
  if (!updates || updates.length === 0) return null
  
  // Get the most recent update (first in array as they're ordered by date DESC)
  const lastUpdate = updates[0]
  if (!lastUpdate?.details) return null
  
  return extractAddressFromUpdate(lastUpdate.details)
}

export function selectRandomAddressExcludingLast(
  addresses: any[],
  lastUsedAddress: string | null
): string {
  // Filter to only valid addresses
  const validAddresses = addresses.filter(addr => addr.address_validity !== false)
  
  if (validAddresses.length === 0) return ''
  
  // If we have a last used address, try to exclude it
  if (lastUsedAddress) {
    const availableAddresses = validAddresses.filter(addr => {
      if (!addr.full_address) return true
      return !addressesMatch(addr.full_address, lastUsedAddress)
    })
    
    // If we have addresses after exclusion, use them
    if (availableAddresses.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableAddresses.length)
      return availableAddresses[randomIndex]?.id || ''
    }
  }
  
  // Fallback: use any valid address (when all addresses match the last used one)
  const randomIndex = Math.floor(Math.random() * validAddresses.length)
  return validAddresses[randomIndex]?.id || ''
}