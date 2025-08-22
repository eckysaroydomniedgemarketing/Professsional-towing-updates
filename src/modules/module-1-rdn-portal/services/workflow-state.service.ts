import { RDNPortalService } from './rdn-portal-service'
import { NavigationStep } from '../types'

// Simple state management for workflow (MVP approach)
let portalService: RDNPortalService | null = null
let workflowError: string | null = null
let navigationData: any = null
let isBrowserInitialized: boolean = false
let currentNavigationStep: NavigationStep = NavigationStep.INITIAL
let totalPages: number = 0
let currentPage: number = 1
let selectedPage: number | null = null

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

export function setNavigationStep(step: NavigationStep): void {
  currentNavigationStep = step
}

export function getNavigationStep(): NavigationStep {
  return currentNavigationStep
}

export function setPageInfo(total: number, current: number): void {
  totalPages = total
  currentPage = current
}

export function getPageInfo(): { totalPages: number; currentPage: number } {
  return { totalPages, currentPage }
}

export function setSelectedPage(page: number): void {
  selectedPage = page
}

export function getSelectedPage(): number | null {
  return selectedPage
}

export function clearWorkflowState(): void {
  // Don't clear portal service or browser state on Get Next Case
  workflowError = null
  navigationData = null
  currentNavigationStep = NavigationStep.INITIAL
  totalPages = 0
  currentPage = 1
  selectedPage = null
}