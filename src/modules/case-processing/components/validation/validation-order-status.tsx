"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle } from "lucide-react"
import { Case, CaseValidationResult } from "../../types/case.types"
import { ValidationLogicService } from "../../services/validation-logic.service"

interface ValidationOrderStatusProps {
  caseData: Case
  validationResult: CaseValidationResult | null
}

export function ValidationOrderStatus({ caseData, validationResult }: ValidationOrderStatusProps) {
  const isValidOrder = ValidationLogicService.isValidOrderType(caseData.order_type)
  const isValidStatus = ValidationLogicService.isValidStatus(caseData.status)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Information</h3>
      <Separator />
      
      <div className="grid grid-cols-2 gap-4">
        {/* Order Type Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Order Type</span>
              {validationResult?.orderTypeValid !== undefined && (
                validationResult.orderTypeValid ? 
                  <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
                  <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isValidOrder ? "secondary" : "destructive"}
                className={`text-sm py-1 ${isValidOrder ? 'bg-green-500 text-white hover:bg-green-600' : ''}`}
              >
                {caseData.order_type || 'No data'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {ValidationLogicService.getOrderTypeMessage(caseData.order_type)}
            </p>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Case Status</span>
              {validationResult?.statusValid !== undefined && (
                validationResult.statusValid ? 
                  <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
                  <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isValidStatus ? "secondary" : "destructive"}
                className={`text-sm py-1 ${isValidStatus ? 'bg-green-500 text-white hover:bg-green-600' : ''}`}
              >
                {caseData.status || 'No data'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {ValidationLogicService.getStatusMessage(caseData.status)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}