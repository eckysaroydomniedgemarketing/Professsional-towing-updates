"use client"

import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Case, CaseValidationResult } from "../../types/case.types"
import { ValidationLogicService } from "../../services/validation-logic.service"

interface ValidationZipCodeProps {
  caseData: Case
  validationResult: CaseValidationResult | null
}

export function ValidationZipCode({ caseData, validationResult }: ValidationZipCodeProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">ZIP Code Coverage</h3>
        {validationResult?.zipCodeValid !== undefined && (
          <Badge 
            variant={validationResult.zipCodeValid ? "secondary" : "destructive"}
            className={validationResult.zipCodeValid ? 'bg-green-500 text-white hover:bg-green-600' : ''}
          >
            {ValidationLogicService.getZipCodeMessage(validationResult.zipCodeValid)}
          </Badge>
        )}
      </div>
      <Separator />
      
      {caseData.addresses && caseData.addresses.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Address #</TableHead>
              <TableHead>Full Address</TableHead>
              <TableHead>ZIP Code</TableHead>
              <TableHead className="text-center">Address Status</TableHead>
              <TableHead className="text-right">Coverage Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {caseData.addresses.map((address: any, index: number) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{address.full_address || 'No address'}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono">
                    {address.zip_code || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {address.address_validity === true ? (
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">Valid</span>
                    </div>
                  ) : address.address_validity === false ? (
                    <div className="flex items-center justify-center gap-1">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 font-medium">Invalid</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-600 font-medium">Unknown</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {validationResult?.zipCodeValid !== undefined && (
                    <Badge 
                      variant={validationResult.zipCodeValid ? "secondary" : "destructive"}
                      className={`gap-1 ${validationResult.zipCodeValid ? 'bg-green-500 text-white hover:bg-green-600' : ''}`}
                    >
                      {validationResult.zipCodeValid ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Covered
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          Not Covered
                        </>
                      )}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No addresses found for this case</AlertDescription>
        </Alert>
      )}
    </div>
  )
}