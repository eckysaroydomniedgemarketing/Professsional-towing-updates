export interface RDNCredentials {
  username: string
  password: string
  securityCode: string
}

export interface NavigationState {
  currentStep: NavigationStep
  isAuthenticated: boolean
  error?: string
  sessionStartTime?: Date
  lastActivityTime?: Date
}

export enum NavigationStep {
  INITIAL = 'INITIAL',
  LOGIN_PAGE = 'LOGIN_PAGE',
  AUTHENTICATING = 'AUTHENTICATING',
  LOGIN_COMPLETE = 'LOGIN_COMPLETE',
  DASHBOARD = 'DASHBOARD',
  CASE_LISTING = 'CASE_LISTING',
  CASE_DETAIL = 'CASE_DETAIL',
  EXTRACTING_DATA = 'EXTRACTING_DATA',
  EXTRACTION_COMPLETE = 'EXTRACTION_COMPLETE',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface CaseListingFilters {
  caseWorker: string
  entriesPerPage: number
  sortByLastUpdate?: boolean
  sortBy?: 'lastUpdate'
  sortOrder?: 'desc' | 'asc'
}

export interface PortalSession {
  id: string
  startTime: Date
  lastActivity: Date
  credentials: RDNCredentials
  currentUrl?: string
  isActive: boolean
}

import { Page } from 'playwright'

export interface NavigationResult {
  success: boolean
  nextStep: NavigationStep
  error?: string
  data?: {
    url?: string
    page?: Page
    updatesTabClicked?: boolean
    processedCount?: number
    message?: string
  }
}