"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FileEdit, MapPin } from "lucide-react"
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
}

export function DraftSection({
  addresses,
  templates,
  selectedAddressId,
  selectedTemplateId,
  onAddressChange,
  onTemplateChange,
  draftContent
}: DraftSectionProps) {
  const selectedAddress = addresses.find(a => a.id === selectedAddressId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileEdit className="h-4 w-4" />
          Draft Update
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address-select">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Selected Address
            </div>
          </Label>
          <Select value={selectedAddressId} onValueChange={onAddressChange}>
            <SelectTrigger id="address-select">
              <SelectValue placeholder="Select an address" />
            </SelectTrigger>
            <SelectContent>
              {addresses.map((address) => (
                <SelectItem key={address.id} value={address.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{address.address_type || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">
                      {address.full_address || 'No address'}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

        {selectedAddress && (
          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-md">
            <p><strong>Address Details:</strong></p>
            <p>Type: {selectedAddress.address_type || 'N/A'}</p>
            <p>Full: {selectedAddress.full_address || 'N/A'}</p>
            <p>City: {selectedAddress.city || 'N/A'}, State: {selectedAddress.state || 'N/A'}, ZIP: {selectedAddress.zip_code || 'N/A'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}