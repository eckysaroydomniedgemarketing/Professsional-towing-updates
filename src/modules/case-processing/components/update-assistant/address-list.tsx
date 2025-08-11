"use client"

import { useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import { CaseAddress } from "../../types/case.types"

interface AddressListProps {
  addresses: CaseAddress[]
  selectedAddressId: string
  onSelectAddress: (id: string) => void
}

export function AddressList({ 
  addresses, 
  selectedAddressId, 
  onSelectAddress 
}: AddressListProps) {
  // Find primary address or use first address as default
  const defaultAddressId = addresses.find(a => a.is_primary)?.id || addresses[0]?.id || ''

  // Set default selection if none selected
  useEffect(() => {
    if (!selectedAddressId && defaultAddressId) {
      onSelectAddress(defaultAddressId)
    }
  }, [selectedAddressId, defaultAddressId, onSelectAddress])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Select Address
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select 
          value={selectedAddressId || defaultAddressId} 
          onValueChange={onSelectAddress}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an address" />
          </SelectTrigger>
          <SelectContent>
            {addresses.map((address) => (
              <SelectItem key={address.id} value={address.id}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {address.address_type || 'Unknown'}
                    </span>
                    {address.is_primary && (
                      <Badge variant="secondary" className="text-xs">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {address.full_address || 'No address available'}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}