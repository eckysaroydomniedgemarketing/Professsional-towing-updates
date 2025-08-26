/**
 * Service for matching and parsing addresses
 * Handles address component extraction and fuzzy matching
 */
export class AddressMatcherService {
  /**
   * Parse address string into components
   */
  parseAddress(address: string): {
    streetNumber: string
    streetName: string
    city: string
    state: string
    zip: string
  } {
    const normalized = address.toUpperCase().trim()
    const parts = normalized.split(',').map(p => p.trim())
    
    // Extract street components
    const streetParts = (parts[0] || '').split(' ')
    const streetNumber = streetParts[0] || ''
    const streetName = streetParts.slice(1).join(' ')
    
    // Extract city
    const city = parts[1] || ''
    
    // Extract state and ZIP
    const stateZip = (parts[2] || '').split(' ').filter(p => p)
    const state = stateZip[0] || ''
    const zip = stateZip[1] || ''
    
    return { streetNumber, streetName, city, state, zip }
  }

  /**
   * Calculate match score between two addresses
   */
  private calculateAddressScore(
    target: ReturnType<typeof this.parseAddress>,
    candidate: ReturnType<typeof this.parseAddress>
  ): number {
    let score = 0
    
    // Score each component (weighted by importance)
    if (target.streetNumber && target.streetNumber === candidate.streetNumber) {
      score += 30
    }
    if (target.streetName && target.streetName.toLowerCase() === candidate.streetName.toLowerCase()) {
      score += 30
    }
    if (target.city && target.city.toLowerCase() === candidate.city.toLowerCase()) {
      score += 20
    }
    if (target.state && target.state === candidate.state) {
      score += 10
    }
    
    // ZIP matching - full or partial
    if (target.zip && candidate.zip) {
      if (target.zip === candidate.zip) {
        score += 10
      } else if (target.zip.substring(0, 3) === candidate.zip.substring(0, 3)) {
        score += 5 // Partial ZIP match
      }
    }
    
    return score
  }

  /**
   * Find best matching address from options
   */
  findBestAddressMatch(
    targetAddress: string,
    options: Array<{ value: string; text: string }>
  ): { value: string; text: string; score: number } | null {
    const target = this.parseAddress(targetAddress)
    
    let bestMatch = null
    let bestScore = 0
    
    for (const option of options) {
      const candidate = this.parseAddress(option.text)
      const score = this.calculateAddressScore(target, candidate)
      
      if (score > bestScore) {
        bestScore = score
        bestMatch = { ...option, score }
      }
    }
    
    // Accept match if score >= 60 (at least street number + street name match)
    return bestScore >= 60 ? bestMatch : null
  }
}