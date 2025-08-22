"use client"

import { useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, CheckCircle, XCircle, AlertCircle } from "lucide-react"
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
  // Filter to only valid addresses
  const validAddresses = addresses.filter(addr => addr.address_validity !== false)
  
  // Find primary address or use first valid address as default
  const defaultAddressId = validAddresses.find(a => a.is_primary)?.id || validAddresses[0]?.id || ''

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
          Available Addresses
        </CardTitle>
      </CardHeader>
      <CardContent>
        {validAddresses.length === 0 ? (
          <div className="text-sm text-muted-foreground p-4 text-center">
            No valid addresses available for this case
          </div>
        ) : (
          <Select 
            value={selectedAddressId || defaultAddressId} 
            onValueChange={onSelectAddress}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an address" />
            </SelectTrigger>
            <SelectContent>
              {validAddresses.map((address) => (
              <SelectItem key={address.id} value={address.id}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {address.address_validity === true && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {address.address_validity === false && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {address.address_validity === null && (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="font-medium">
                      {address.address_type || 'Unknown'}
                    </span>
                    {address.is_primary && (
                      <Badge variant="secondary" className="text-xs">
                        Primary
                      </Badge>
                    )}
                    {address.address_validity === false && (
                      <Badge variant="destructive" className="text-xs">
                        Invalid
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
        )}
      </CardContent>
    </Card>
  )
}