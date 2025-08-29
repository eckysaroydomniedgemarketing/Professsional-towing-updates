"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, AlertTriangle, X } from "lucide-react"
import { ExclusionKeywordResults, CaseAddress } from "../../types/case.types"
import { DatabaseKeywordResult } from "../../services/keyword-check.service"
import { validateAgentUpdateAddress } from "../../utils/address-validation"

interface CaseUpdate {
  id?: string
  update_type?: string
  update_author?: string
  update_date?: string
  details?: string
  created_at?: string
}

interface UpdateHistoryDisplayProps {
  updates?: CaseUpdate[]
  addresses?: CaseAddress[]
  keywordAnalysis?: ExclusionKeywordResults | null
  databaseKeywordResult?: DatabaseKeywordResult | null
  automaticMode?: boolean
  onAgentUpdateSelected?: (update: CaseUpdate | null) => void
  selectedAddressId?: string
}

export function UpdateHistoryDisplay({ 
  updates, 
  addresses,
  keywordAnalysis, 
  databaseKeywordResult,
  automaticMode = false,
  onAgentUpdateSelected,
  selectedAddressId
}: UpdateHistoryDisplayProps) {
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  
  // Check if there are any valid addresses - more lenient check for MVP
  // Allow checkbox if: no addresses provided OR at least one valid address exists
  const hasValidAddresses = !addresses || addresses.length === 0 || 
    addresses.some(addr => addr.address_validity !== false)
  
  // Debug logging to identify issues
  useEffect(() => {
    console.log('UpdateHistoryDisplay Debug:', {
      hasAddresses: !!addresses,
      addressCount: addresses?.length,
      addressDetails: addresses?.map(a => ({
        type: a.address_type,
        validity: a.address_validity,
        isPrimary: a.is_primary
      })),
      hasValidAddresses,
      selectedAddressId,
      updatesCount: updates?.length,
      agentUpdates: updates?.filter(u => {
        const author = u.update_author?.toLowerCase() || ''
        return author.includes('agent') || author.includes('(agent)')
      }).map(u => u.update_author),
      automaticMode
    })
  }, [addresses, updates, hasValidAddresses, selectedAddressId, automaticMode])
  
  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (validationError) {
      const timer = setTimeout(() => {
        setValidationError(null)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [validationError])
  
  if (!updates || updates.length === 0) {
    return null
  }

  // Updates are already the 10 most recent from service (ordered by update_date DESC)
  const recentUpdates = updates
  
  // Check if update is an agent update - more robust check
  const isAgentUpdate = (update: CaseUpdate) => {
    if (!update.update_author) return false
    const author = update.update_author.toLowerCase()
    // Check for various agent patterns: "agent", "(agent)", "agent)", etc.
    return author.includes('agent') || author.includes('(agent)') || author.includes('agent)')
  }
  
  // Handle checkbox change
  const handleCheckboxChange = (update: CaseUpdate, checked: boolean) => {
    if (automaticMode) return // Disabled in automatic mode
    
    // Clear any previous error when user interacts with any checkbox
    setValidationError(null)
    
    if (checked) {
      // Validate address if one is selected
      if (selectedAddressId && update.details) {
        const selectedAddress = addresses?.find(a => a.id === selectedAddressId)
        if (selectedAddress?.full_address) {
          const validation = validateAgentUpdateAddress(
            update.details,
            selectedAddress.full_address
          )
          
          if (!validation.isValid && validation.extractedAddress) {
            // Show error and don't select the update
            setValidationError(validation.message || `Selected update is for a different address. Please select an update for "${selectedAddress.full_address}"`)
            setSelectedUpdateId(null)
            onAgentUpdateSelected?.(null)
            return
          }
        }
      }
      
      // Select the update (validation passed)
      setSelectedUpdateId(update.id || null)
      onAgentUpdateSelected?.(update)
    } else {
      // Unchecking
      setSelectedUpdateId(null)
      onAgentUpdateSelected?.(null)
    }
  }
  
  // Helper to check if update contains keywords
  const updateHasKeywords = (updateContent: string) => {
    if (!updateContent || !keywordAnalysis?.keywords) return false
    
    const contentLower = updateContent.toLowerCase()
    
    // Check each keyword
    if (keywordAnalysis.keywords.DRN?.found && contentLower.includes('drn')) return 'DRN'
    if (keywordAnalysis.keywords.LPR?.found && contentLower.includes('lpr')) return 'LPR'
    if (keywordAnalysis.keywords.GPS?.found && contentLower.includes('gps')) return 'GPS'
    if (keywordAnalysis.keywords.SURRENDER?.found && contentLower.includes('surrender')) return 'SURRENDER'
    if (keywordAnalysis.keywords.UNIT_SPOTTED?.found && 
        (contentLower.includes('spotted') || contentLower.includes('unit spotted'))) return 'UNIT SPOTTED'
    
    return false
  }

  // Helper to highlight keywords in text
  const highlightKeywords = (text: string) => {
    if (!text || !keywordAnalysis?.hasExclusionKeywords) return text
    
    let highlightedText = text
    const keywords = ['DRN', 'LPR', 'GPS', 'SURRENDER', 'surrender', 'spotted', 'unit spotted']
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 font-semibold">$1</mark>')
    })
    
    return highlightedText
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Update History Analysis</h3>
        <Badge variant="outline" className="text-sm">
          {updates.length} Total Updates
        </Badge>
      </div>
      <Separator />
      
      {validationError && (
        <Alert variant="destructive" className="relative">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Address Mismatch</AlertTitle>
          <AlertDescription className="pr-8">{validationError}</AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => setValidationError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent 10 Updates Analyzed</CardTitle>
          <CardDescription>
            Update history reviewed for exclusion keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Select</TableHead>
                <TableHead className="w-[80px]">Update #</TableHead>
                <TableHead className="w-[150px]">Last Updated By</TableHead>
                <TableHead className="w-[150px]">Update Date</TableHead>
                <TableHead>Content</TableHead>
                <TableHead className="w-[120px]">Keywords</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUpdates.map((update, index) => {
                const keywordFound = update.details ? updateHasKeywords(update.details) : false
                const updateNumber = index + 1
                const isAgent = isAgentUpdate(update)
                
                // Debug log for first agent update
                if (index === 0 && isAgent) {
                  console.log('First agent update checkbox check:', {
                    updateNumber,
                    author: update.update_author,
                    isAgent,
                    hasValidAddresses,
                    shouldShowCheckbox: isAgent && hasValidAddresses,
                    automaticMode
                  })
                }
                
                return (
                  <TableRow key={update.id || index}>
                    <TableCell>
                      {isAgent && hasValidAddresses ? (
                        <Checkbox
                          checked={selectedUpdateId === update.id}
                          onCheckedChange={(checked) => handleCheckboxChange(update, checked as boolean)}
                          disabled={automaticMode}
                          aria-label={`Select agent update ${updateNumber}`}
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      #{updateNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {update.update_author || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {update.update_date ? (
                        <span className="text-sm">
                          {new Date(update.update_date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div 
                        className="text-sm text-muted-foreground whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ 
                          __html: update.details ? highlightKeywords(update.details) : 'No content available'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {keywordFound ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {keywordFound}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Clear
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}