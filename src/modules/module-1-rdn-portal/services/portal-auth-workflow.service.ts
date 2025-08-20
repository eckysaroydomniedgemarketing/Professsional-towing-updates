import { NavigationStep, NavigationResult, NavigationState } from '../types'
import { BrowserManager } from './browser-manager.service'
import { AuthManager } from './auth-manager.service'

export class PortalAuthWorkflowService {
  constructor(
    private browserManager: BrowserManager,
    private authManager: AuthManager
  ) {}

  async navigateToLogin(state: NavigationState): Promise<{ result: NavigationResult; updatedState: NavigationState }> {
    const page = this.browserManager.getPage()
    if (!page) {
      console.error('[AUTH-WORKFLOW] Page is null when trying to navigate to login')
      return {
        result: {
          success: false,
          nextStep: NavigationStep.ERROR,
          error: 'Browser not initialized - page is null'
        },
        updatedState: state
      }
    }
    
    console.log('[AUTH-WORKFLOW] Navigating to login with valid page')
    const result = await this.authManager.navigateToLogin(page)
    if (result.success) {
      const updatedState = { ...state, currentStep: result.nextStep }
      return { result, updatedState }
    }
    return { result, updatedState: state }
  }

  async authenticate(state: NavigationState): Promise<{ result: NavigationResult; updatedState: NavigationState }> {
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
    
    const result = await this.authManager.authenticate(page)
    if (result.success) {
      const updatedState = { ...state, isAuthenticated: true, currentStep: result.nextStep }
      return { result, updatedState }
    }
    return { result, updatedState: state }
  }
}