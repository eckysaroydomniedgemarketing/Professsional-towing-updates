import { RDNPortalService } from './rdn-portal-service'

// Simple state management for workflow (MVP approach)
let portalService: RDNPortalService | null = null
let workflowError: string | null = null
let navigationData: any = null
let isBrowserInitialized: boolean = false

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

export function getBrowserInitialized(): boolean {
  return isBrowserInitialized
}

export function setBrowserInitialized(value: boolean): void {
  isBrowserInitialized = value
}

export function clearWorkflowState(): void {
  // Don't clear portal service or browser state on Get Next Case
  workflowError = null
  navigationData = null
}