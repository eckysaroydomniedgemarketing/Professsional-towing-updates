"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileEdit, MapPin, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { CaseAddress } from "../../types/case.types"
import { Template } from "../../services/template.service"

interface DraftSectionProps {
  addresses: CaseAddress[]
  templates: Template[]
  selectedAddressId: string
  selectedTemplateId: string
  onAddressChange: (id: string) => void
  onTemplateChange: (id: string) => void
  draftContent: string
  lastUpdateAddress?: string
}

export function DraftSection({
  addresses,
  templates,
  selectedAddressId,
  selectedTemplateId,
  onAddressChange,
  onTemplateChange,
  draftContent,
  lastUpdateAddress
}: DraftSectionProps) {
  const selectedAddress = selectedAddressId === 'NO_VALID_ADDRESS' 
    ? null 
    : addresses.find(a => a.id === selectedAddressId)
  
  // Check if address is being alternated
  const isAlternating = addresses.length === 1 || 
    (selectedAddress && selectedAddress.full_address !== lastUpdateAddress)
  
  // Check if address is valid (using address_validity field)
  // For MVP: treat null/undefined as valid (most addresses are valid)
  // Only false means invalid
  const isAddressValid = selectedAddress?.address_validity !== false
  const isAddressInvalid = selectedAddress?.address_validity === false

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileEdit className="h-4 w-4" />
            <span>Draft Update</span>
          </div>
          {selectedAddress && selectedAddress.address_type && (
            <Badge variant="outline" className="text-xs">
              {selectedAddress.address_type}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Address Display */}
        <div className="space-y-2">
          <Label>
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Selected Address
            </div>
          </Label>
          <div className="p-3 bg-muted/50 rounded-md border">
            {selectedAddressId === 'NO_VALID_ADDRESS' ? (
              <p className="text-sm text-muted-foreground">No valid address available</p>
            ) : selectedAddress ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{selectedAddress.address_type || 'Unknown Type'}</span>
                  <Badge variant={isAddressInvalid ? "destructive" : "default"} className="text-xs">
                    {isAddressInvalid ? "Invalid" : "Valid"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedAddress.full_address || 'No address'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No address selected</p>
            )}
          </div>
        </div>

        {/* Invalid Address Warning */}
        {isAddressInvalid && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This address is marked as invalid in the system. Please verify the address details before proceeding with the update.
            </AlertDescription>
          </Alert>
        )}

        {/* Address Checklist */}
        {selectedAddressId !== 'NO_VALID_ADDRESS' && (
          <div className="space-y-2">
            <Label>Address Validation</Label>
            <div className="space-y-2 p-3 bg-muted/30 rounded-md">
              <div className="flex items-center gap-2">
                {isAlternating ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${isAlternating ? 'text-green-700' : 'text-red-700'}`}>
                  Address is used alternately
                  {addresses.length === 1 && ' (only one address available)'}
                </span>
              </div>
            <div className="flex items-center gap-2">
              {selectedAddress?.address_validity === true ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-700">
                    Address is marked as valid
                  </span>
                </>
              ) : selectedAddress?.address_validity === false ? (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">
                    Address is marked as invalid
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-700">
                    Address validity unknown
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        )}

        <div className="space-y-2">
          <Label>Auto-Selected Template</Label>
          <div className="p-3 bg-muted/50 rounded-md border">
            {selectedTemplateId ? (
              <div className="space-y-1">
                {templates.find(t => t.id === selectedTemplateId)?.category && (
                  <Badge variant="outline" className="text-xs">
                    {templates.find(t => t.id === selectedTemplateId)?.category}
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground">
                  {templates.find(t => t.id === selectedTemplateId)?.template_text || 'Template selected'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No template selected</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="draft-preview">Draft Preview</Label>
          <Textarea
            id="draft-preview"
            value={draftContent}
            readOnly
            className="min-h-[150px] bg-muted/50"
            placeholder="Select an address and template to generate draft"
          />
        </div>
      </CardContent>
    </Card>
  )
}