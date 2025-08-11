"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { ExclusionKeywordResults } from "../../types/case.types"
import { DatabaseKeywordResult } from "../../services/keyword-check.service"

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
  keywordAnalysis?: ExclusionKeywordResults | null
  databaseKeywordResult?: DatabaseKeywordResult | null
}

export function UpdateHistoryDisplay({ 
  updates, 
  keywordAnalysis, 
  databaseKeywordResult 
}: UpdateHistoryDisplayProps) {
  
  if (!updates || updates.length === 0) {
    return null
  }

  // Updates are already the 10 most recent from service (ordered by update_date DESC)
  const recentUpdates = updates
  
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
                
                return (
                  <TableRow key={update.id || index}>
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