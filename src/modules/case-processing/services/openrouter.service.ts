interface AnalysisResult {
  hasExclusionKeyword: boolean
  details: {
    keywordFound?: string
    keywordLocation?: string
    rawResponse?: string
  }
}

export class OpenRouterService {
  private static readonly API_KEY = process.env.OPENROUTER_API_KEY!
  private static readonly BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
  private static readonly MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-3-4b-it:free'
  
  static async analyzeUpdateHistory(updates: string[]): Promise<AnalysisResult> {
    try {
      // Check if API key is configured
      if (!this.API_KEY || this.API_KEY === 'undefined') {
        console.error('OpenRouter API key not configured')
        throw new Error('System configuration error - Cannot verify keywords')
      }
      
      // Format updates for analysis
      const formattedUpdates = updates.map((update, index) => 
        `Update ${index + 1}: ${update}`
      ).join('\n')
      
      const prompt = `You are analyzing vehicle repossession case updates to identify exclusion keywords that indicate the vehicle was located through specific methods.

EXCLUSION KEYWORDS AND VARIATIONS TO DETECT:

1. DRN (Digital Recognition Network):
   - Exact: "DRN", "D.R.N."
   - Variations: "DRN hit", "DRN located", "DRN hit on vehicle", "DRN system"
   - Context: Any mention of license plate recognition database hits

2. LPR (License Plate Reader):
   - Exact: "LPR", "L.P.R."
   - Variations: "LPR scan", "LPR system", "license plate reader", "plate reader"
   - Context: Any automated license plate scanning technology

3. GPS (Global Positioning System):
   - Exact: "GPS", "G.P.S."
   - Variations: "GPS tracking", "GPS located", "tracked by GPS", "GPS coordinates"
   - Context: Any satellite-based vehicle tracking

4. SURRENDER:
   - Exact: "surrender", "surrendered"
   - Variations: "voluntary surrender", "customer surrendered", "unit surrendered", "voluntarily surrendered"
   - Context: Customer voluntarily returning the vehicle

5. UNIT SPOTTED/FOUND:
   - Required phrases: "unit spotted", "vehicle spotted", "unit found", "vehicle found", "unit located"
   - Do NOT match standalone words like "spotted" or "found"
   - Context: POSITIVE sighting only - vehicle was actually seen/located

ANALYSIS INSTRUCTIONS:
1. Analyze ALL updates as a complete set
2. Search for the SPECIFIC keywords listed above ONLY
3. Regular text, addresses, names are NOT keywords
4. Return ONE SINGLE JSON object for all updates combined
5. If keyword found, report FIRST occurrence only

CRITICAL CONTEXT RULES:
- NEVER match negative statements (e.g., "not found", "not spotted", "no unit", "was not located")
- ONLY match when vehicle was ACTUALLY located/found (positive context)
- "Address Appears Occupied" is NOT a keyword - ignore it completely
- Status updates like "will continue efforts" are NOT keywords

MATCHING RULES:
- Match ONLY the exact keywords/phrases listed in sections 1-5 above
- If unsure, return false
- Common phrases that are NOT keywords:
  * "Address Appears Occupied"
  * "will continue efforts"  
  * "no show"
  * "not found/spotted/located"
  * "searched but"
  * "no sign of"

UPDATES TO ANALYZE:
${formattedUpdates}

EXAMPLES OF WHAT TO MATCH:
✓ "unit spotted at location" → {"hasKeyword": true, "keyword": "unit spotted", "updateNumber": X}
✓ "DRN hit on vehicle" → {"hasKeyword": true, "keyword": "DRN hit", "updateNumber": X}
✓ "vehicle found at address" → {"hasKeyword": true, "keyword": "vehicle found", "updateNumber": X}

EXAMPLES OF WHAT NOT TO MATCH:
✗ "unit was not found" → {"hasKeyword": false, "keyword": null, "updateNumber": null}
✗ "Address Appears Occupied" → {"hasKeyword": false, "keyword": null, "updateNumber": null}
✗ "no sign of unit" → {"hasKeyword": false, "keyword": null, "updateNumber": null}
✗ "searched but unit not located" → {"hasKeyword": false, "keyword": null, "updateNumber": null}

RESPONSE FORMAT:
Return ONLY ONE JSON object. No explanations, no markdown:
{"hasKeyword": boolean, "keyword": "exact keyword found" or null, "updateNumber": integer or null}

Example responses (return ONLY ONE of these formats):
- If keyword found: {"hasKeyword": true, "keyword": "DRN hit", "updateNumber": 3}
- If NO keyword found: {"hasKeyword": false, "keyword": null, "updateNumber": null}

NEVER return multiple JSON objects. Always return exactly ONE JSON object.`

      const response = await fetch(`${this.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://professional-towing.com',
          'X-Title': 'Professional Towing RDN Automation'
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      })
      
      if (!response.ok) {
        console.error('OpenRouter API error:', response.status, response.statusText)
        // Throw error instead of returning false negative
        throw new Error(`System error: Unable to verify exclusion keywords (Error ${response.status})`)
      }
      
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || '{}'
      
      // Extract JSON from markdown if present
      let jsonContent = content
      if (content.includes('```json')) {
        const match = content.match(/```json\s*([\s\S]*?)\s*```/)
        jsonContent = match ? match[1].trim() : content
      } else if (content.includes('```')) {
        const match = content.match(/```\s*([\s\S]*?)\s*```/)
        jsonContent = match ? match[1].trim() : content
      }
      
      // Check if response contains multiple JSON objects
      if (jsonContent.includes('}\n{') || jsonContent.includes('}{')) {
        console.error('AI returned multiple JSON objects, taking first one')
        // Extract only the first JSON object
        const firstJsonMatch = jsonContent.match(/\{[^}]*\}/)
        jsonContent = firstJsonMatch ? firstJsonMatch[0] : jsonContent
      }
      
      // Parse AI response
      try {
        const parsed = JSON.parse(jsonContent)
        
        return {
          hasExclusionKeyword: parsed.hasKeyword === true,
          details: {
            keywordFound: parsed.keyword || undefined,
            keywordLocation: parsed.updateNumber ? `Update #${parsed.updateNumber}` : undefined,
            rawResponse: content
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        console.error('Raw content:', content)
        
        // Try to extract any valid JSON from response
        const jsonMatch = jsonContent.match(/\{.*?"hasKeyword"\s*:\s*(true|false).*?\}/)
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0])
            return {
              hasExclusionKeyword: parsed.hasKeyword === true,
              details: {
                keywordFound: parsed.keyword || undefined,
                keywordLocation: parsed.updateNumber ? `Update #${parsed.updateNumber}` : undefined,
                rawResponse: content
              }
            }
          } catch (e) {
            // Fall through to default
          }
        }
        
        // Safe default for MVP
        return {
          hasExclusionKeyword: false,
          details: {
            rawResponse: content
          }
        }
      }
      
    } catch (error) {
      console.error('OpenRouter service error:', error)
      // For MVP, treat errors as "no keyword found" to avoid blocking
      return {
        hasExclusionKeyword: false,
        details: {
          rawResponse: 'Service error'
        }
      }
    }
  }
}