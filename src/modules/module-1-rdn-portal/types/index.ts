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
  DASHBOARD = 'DASHBOARD',
  CASE_LISTING = 'CASE_LISTING',
  CASE_DETAIL = 'CASE_DETAIL',
  ERROR = 'ERROR'
}

export interface CaseListingFilters {
  caseWorker: string
  entriesPerPage: number
  sortBy: 'lastUpdate'
  sortOrder: 'desc' | 'asc'
}

export interface PortalSession {
  id: string
  startTime: Date
  lastActivity: Date
  credentials: RDNCredentials
  currentUrl?: string
  isActive: boolean
}

export interface NavigationResult {
  success: boolean
  nextStep: NavigationStep
  error?: string
  data?: unknown
}