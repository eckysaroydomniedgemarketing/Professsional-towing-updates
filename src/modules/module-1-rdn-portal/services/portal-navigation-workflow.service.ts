import { NavigationStep, NavigationResult, NavigationState, CaseListingFilters } from '../types'
import { BrowserManager } from './browser-manager.service'
import { AuthManager } from './auth-manager.service'
import { NavigationManager } from './navigation-manager.service'
import { CaseProcessor } from './case-processor.service'

export class PortalNavigationWorkflowService {
  constructor(
    private browserManager: BrowserManager,
    private authManager: AuthManager,
    private navigationManager: NavigationManager,
    private caseProcessor: CaseProcessor
  ) {}

  async navigateToCaseListing(state: NavigationState): Promise<{ result: NavigationResult; updatedState: NavigationState }> {
    const page = this.browserManager.getPage()
    const context = this.browserManager.getContext()
    if (!page || !context) {
      return {
        result: {
          success: false,
          nextStep: NavigationStep.ERROR,
          error: 'Browser not initialized'
        },
        updatedState: state
      }
    }
    
    // Check session first
    const sessionValid = await this.authManager.checkSession(page)
    if (!sessionValid) {
      const updatedState = { ...state, isAuthenticated: false, currentStep: NavigationStep.LOGIN_PAGE }
      return {
        result: {
          success: false,
          nextStep: NavigationStep.LOGIN_PAGE,
          error: 'Session expired'
        },
        updatedState
      }
    }
    
    // Navigate to dashboard first if needed
    if (state.currentStep === NavigationStep.DASHBOARD || 
        state.currentStep === NavigationStep.LOGIN_COMPLETE) {
      const dashboardResult = await this.navigationManager.navigateToDashboard(page)
      if (!dashboardResult.success) {
        return { result: dashboardResult, updatedState: state }
      }
    }
    
    // Then navigate to case listing
    const result = await this.navigationManager.navigateToCaseListing(page, context)
    if (result.success) {
      const updatedState = { ...state, currentStep: result.nextStep, lastActivityTime: new Date() }
      return { result, updatedState }
    }
    return { result, updatedState: state }
  }

  async configureFilters(state: NavigationState, filters: CaseListingFilters): Promise<{ result: NavigationResult; updatedState: NavigationState }> {
    const page = this.browserManager.getPage()
    if (!page) {
      return {
        result: {
          success: false,
          nextStep: NavigationStep.ERROR,
          error: 'Browser not initialized'
        },
        updatedState: state
      }
    }
    
    const result = await this.caseProcessor.configureFilters(page, filters)
    if (result.success) {
      const updatedState = { ...state, currentStep: result.nextStep, lastActivityTime: new Date() }
      return { result, updatedState }
    }
    return { result, updatedState: state }
  }

  async openCaseDetail(state: NavigationState): Promise<{ result: NavigationResult; updatedState: NavigationState }> {
    const page = this.browserManager.getPage()
    const context = this.browserManager.getContext()
    if (!page || !context) {
      return {
        result: {
          success: false,
          nextStep: NavigationStep.ERROR,
          error: 'Browser not initialized'
        },
        updatedState: state
      }
    }
    
    const result = await this.caseProcessor.openCaseDetail(page, context)
    
    if (result.success) {
      // Update the browser manager's page reference if we switched tabs
      if (result.data?.page) {
        this.browserManager.setPage(result.data.page)
      }
      
      const updatedState = { ...state, currentStep: result.nextStep, lastActivityTime: new Date() }
      return { result, updatedState }
    }
    
    return { result, updatedState: state }
  }

  async processMultipleCases(state: NavigationState, maxCases: number = 10): Promise<{ result: NavigationResult; updatedState: NavigationState }> {
    const page = this.browserManager.getPage()
    const context = this.browserManager.getContext()
    if (!page || !context) {
      return {
        result: {
          success: false,
          nextStep: NavigationStep.ERROR,
          error: 'Browser not initialized'
        },
        updatedState: state
      }
    }
    
    const result = await this.caseProcessor.processMultipleCases(
      page, 
      context, 
      maxCases, 
      this.navigationManager
    )
    
    if (result.success) {
      const updatedState = { ...state, currentStep: result.nextStep }
      return { result, updatedState }
    }
    
    return { result, updatedState: state }
  }
}