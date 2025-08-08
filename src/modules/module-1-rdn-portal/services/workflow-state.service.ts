import { RDNPortalService } from './rdn-portal-service'

// Simple state management for workflow (MVP approach)
let portalService: RDNPortalService | null = null
let workflowError: string | null = null
let navigationData: any = null

export function setPortalService(service: RDNPortalService | null): void {
  portalService = service
}

export function getPortalService(): RDNPortalService | null {
  return portalService
}

export function setWorkflowError(error: string | null): void {
  workflowError = error
}

export function getWorkflowError(): string | null {
  return workflowError
}

export function setNavigationData(data: any): void {
  navigationData = data
}

export function getNavigationData(): any {
  return navigationData
}

export function clearWorkflowState(): void {
  portalService = null
  workflowError = null
  navigationData = null
}