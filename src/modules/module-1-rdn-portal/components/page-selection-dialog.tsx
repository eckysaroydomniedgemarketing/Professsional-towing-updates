'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface PageSelectionDialogProps {
  open: boolean
  totalPages: number
  currentPage: number
  onSelectPage: (pageNumber: number) => void
  onCancel?: () => void
}

export function PageSelectionDialog({
  open,
  totalPages,
  currentPage,
  onSelectPage,
  onCancel
}: PageSelectionDialogProps) {
  const [selectedPage, setSelectedPage] = useState<string>(currentPage.toString())
  const [error, setError] = useState<string>()

  const handleContinue = () => {
    const pageNum = parseInt(selectedPage, 10)
    
    if (isNaN(pageNum)) {
      setError('Please enter a valid page number')
      return
    }
    
    if (pageNum < 1) {
      setError('Page number must be at least 1')
      return
    }
    
    if (pageNum > totalPages) {
      setError(`Page number cannot exceed ${totalPages}`)
      return
    }
    
    setError(undefined)
    onSelectPage(pageNum)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleContinue()
    }
  }

  return (
    <Sheet open={open} onOpenChange={() => {}}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Select Page</SheetTitle>
          <SheetDescription>
            Currently on page {currentPage} of {totalPages}. 
            Enter the page number you want to navigate to.
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="page-number" className="text-right">
              Page
            </Label>
            <Input
              id="page-number"
              type="number"
              min="1"
              max={totalPages}
              value={selectedPage}
              onChange={(e) => {
                setSelectedPage(e.target.value)
                setError(undefined)
              }}
              onKeyPress={handleKeyPress}
              className="col-span-3"
              placeholder={`1-${totalPages}`}
              autoFocus
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-sm text-muted-foreground">
            Enter a page number between 1 and {totalPages}
          </div>
        </div>
        
        <SheetFooter>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleContinue}>
            Continue
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}