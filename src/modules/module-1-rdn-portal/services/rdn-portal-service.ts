import { 
  RDNCredentials, 
  NavigationState, 
  NavigationStep, 
  CaseListingFilters,
  NavigationResult 
} from '../types'
import { BrowserManager } from './browser-manager.service'
import { AuthManager } from './auth-manager.service'
import { NavigationManager } from './navigation-manager.service'
import { CaseProcessor } from './case-processor.service'

export class RDNPortalService {
  private browserManager: BrowserManager
  private authManager: AuthManager
  private navigationManager: NavigationManager
  private caseProcessor: CaseProcessor
  
  private state: NavigationState = {
    currentStep: NavigationStep.INITIAL,
    isAuthenticated: false
  }

  constructor(private credentials: RDNCredentials) {
    this.browserManager = new BrowserManager()
    this.authManager = new AuthManager(credentials)
    this.navigationManager = new NavigationManager()
    this.caseProcessor = new CaseProcessor()
  }

  async initialize(): Promise<void> {
    await this.browserManager.initialize()
    
    // Add small delay to ensure browser is fully ready
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Validate page exists
    const page = this.browserManager.getPage()
    if (!page) {
      throw new Error('Browser initialized but page is null')
    }
    
    this.state.currentStep = NavigationStep.INITIAL
    console.log('[RDN-PORTAL] Service initialized successfully with page')
  }

  async navigateToLogin(): Promise<NavigationResult> {
    const page = this.browserManager.getPage()
    if (!page) {
      console.error('[RDN-PORTAL] Page is null when trying to navigate to login')
      throw new Error('Browser not initialized - page is null')
    }
    
    console.log('[RDN-PORTAL] Navigating to login with valid page')
    const result = await this.authManager.navigateToLogin(page)
    if (result.success) {
      this.state.currentStep = result.nextStep
    }
    return result
  }

  async authenticate(): Promise<NavigationResult> {
    const page = this.browserManager.getPage()
    if (!page) throw new Error('Browser not initialized')
    
    const result = await this.authManager.authenticate(page)
    if (result.success) {
      this.state.isAuthenticated = true
      this.state.currentStep = result.nextStep
    }
    return result
  }

  async navigateToCaseListing(): Promise<NavigationResult> {
    const page = this.browserManager.getPage()
    const context = this.browserManager.getContext()
    if (!page || !context) throw new Error('Browser not initialized')
    
    // Check session first
    const sessionValid = await this.authManager.checkSession(page)
    if (!sessionValid) {
      this.state.isAuthenticated = false
      this.state.currentStep = NavigationStep.LOGIN_PAGE
      return {
        success: false,
        nextStep: NavigationStep.LOGIN_PAGE,
        error: 'Session expired'
      }
    }
    
    // Navigate to dashboard first if needed
    if (this.state.currentStep === NavigationStep.DASHBOARD || 
        this.state.currentStep === NavigationStep.LOGIN_COMPLETE) {
      const dashboardResult = await this.navigationManager.navigateToDashboard(page)
      if (!dashboardResult.success) {
        return dashboardResult
      }
    }
    
    // Then navigate to case listing
    const result = await this.navigationManager.navigateToCaseListing(page, context)
    if (result.success) {
      this.state.currentStep = result.nextStep
      this.state.lastActivityTime = new Date()
    }
    return result
  }

  async configureFilters(filters: CaseListingFilters): Promise<NavigationResult> {
    const page = this.browserManager.getPage()
    if (!page) throw new Error('Browser not initialized')
    
    const result = await this.caseProcessor.configureFilters(page, filters)
    if (result.success) {
      this.state.currentStep = result.nextStep
      this.state.lastActivityTime = new Date()
    }
    return result
  }

  async openCaseDetail(): Promise<NavigationResult> {
    const page = this.browserManager.getPage()
    const context = this.browserManager.getContext()
    if (!page || !context) throw new Error('Browser not initialized')
    
    const result = await this.caseProcessor.openCaseDetail(page, context)
    
    if (result.success) {
      // Update the browser manager's page reference if we switched tabs
      if (result.data?.page) {
        this.browserManager.setPage(result.data.page)
      }
      
      this.state.currentStep = result.nextStep
      this.state.lastActivityTime = new Date()
      
      // Click Updates tab
      const updatesClicked = await this.navigationManager.clickUpdatesTab(
        result.data?.page || page
      )
      
      return {
        ...result,
        data: {
          ...result.data,
          updatesTabClicked: updatesClicked
        }
      }
    }
    
    return result
  }

  async processMultipleCases(maxCases: number = 10): Promise<NavigationResult> {
    const page = this.browserManager.getPage()
    const context = this.browserManager.getContext()
    if (!page || !context) throw new Error('Browser not initialized')
    
    const result = await this.caseProcessor.processMultipleCases(
      page, 
      context, 
      maxCases, 
      this.navigationManager
    )
    
    if (result.success) {
      this.state.currentStep = result.nextStep
    }
    
    return result
  }

  async executeFullWorkflow(): Promise<NavigationResult> {
    try {
      // Check if browser is initialized
      if (!this.browserManager.isInitialized()) {
        return {
          success: false,
          nextStep: NavigationStep.ERROR,
          error: 'Browser not initialized. Call initialize() first.'
        }
      }
      
      // Step 1: Navigate to login
      const loginNavResult = await this.navigateToLogin()
      if (!loginNavResult.success) return loginNavResult
      
      // Step 2: Authenticate
      const authResult = await this.authenticate()
      if (!authResult.success) return authResult
      
      // Step 3: Navigate to case listing
      const caseListingResult = await this.navigateToCaseListing()
      if (!caseListingResult.success) return caseListingResult
      
      // Step 4: Configure filters
      const filterResult = await this.configureFilters({
        caseWorker: '',
        entriesPerPage: 25,
        sortByLastUpdate: true
      })
      if (!filterResult.success) return filterResult
      
      // Step 5: Process single case for Module 3 integration
      const processingResult = await this.processMultipleCases(1)
      
      return processingResult
    } catch (error) {
      return {
        success: false,
        nextStep: this.state.currentStep,
        error: error instanceof Error ? error.message : 'Workflow execution failed'
      }
    }
  }

  async getState(): Promise<NavigationState> {
    return { ...this.state }
  }

  async getCurrentUrl(): Promise<string | null> {
    return this.browserManager.getCurrentUrl()
  }

  async takeScreenshot(filename: string): Promise<void> {
    await this.browserManager.takeScreenshot(filename)
  }

  async close(): Promise<void> {
    this.authManager.resetAuthStatus()
    await this.browserManager.close()
    this.state = {
      currentStep: NavigationStep.INITIAL,
      isAuthenticated: false
    }
  }
}