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
import { WorkflowExecutorService } from './workflow-executor.service'
import { CaseNavigationService } from './case-navigation.service'
import { PortalAuthWorkflowService } from './portal-auth-workflow.service'
import { PortalNavigationWorkflowService } from './portal-navigation-workflow.service'

export class RDNPortalService {
  private browserManager: BrowserManager
  private authManager: AuthManager
  private navigationManager: NavigationManager
  private caseProcessor: CaseProcessor
  
  // New sub-services
  private workflowExecutor: WorkflowExecutorService
  private caseNavigation: CaseNavigationService
  private authWorkflow: PortalAuthWorkflowService
  private navWorkflow: PortalNavigationWorkflowService
  
  private state: NavigationState = {
    currentStep: NavigationStep.INITIAL,
    isAuthenticated: false
  }
  
  private isGetNextCase: boolean = false
  private lastProcessedCaseId: string | null = null
  private targetCaseId: string | null = null

  constructor(private credentials: RDNCredentials, getNextCase: boolean = false, targetCaseId: string | null = null) {
    // Initialize core services
    this.browserManager = new BrowserManager()
    this.authManager = new AuthManager(credentials)
    this.navigationManager = new NavigationManager()
    this.caseProcessor = new CaseProcessor()
    
    // Initialize workflow services
    this.authWorkflow = new PortalAuthWorkflowService(this.browserManager, this.authManager)
    this.navWorkflow = new PortalNavigationWorkflowService(
      this.browserManager,
      this.authManager,
      this.navigationManager,
      this.caseProcessor
    )
    this.caseNavigation = new CaseNavigationService(this.navigationManager, this.browserManager)
    this.workflowExecutor = new WorkflowExecutorService(
      this.browserManager,
      this.authWorkflow,
      this.navWorkflow,
      this.caseNavigation
    )
    
    this.isGetNextCase = getNextCase
    this.targetCaseId = targetCaseId
  }
  
  // Method to update the getNextCase flag for reused instance
  setGetNextCase(value: boolean): void {
    this.isGetNextCase = value
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

  // Delegated methods for backward compatibility
  async navigateToLogin(): Promise<NavigationResult> {
    const result = await this.authWorkflow.navigateToLogin(this.state)
    this.state = result.updatedState
    return result.result
  }

  async authenticate(): Promise<NavigationResult> {
    const result = await this.authWorkflow.authenticate(this.state)
    this.state = result.updatedState
    return result.result
  }

  async navigateToCaseListing(): Promise<NavigationResult> {
    const result = await this.navWorkflow.navigateToCaseListing(this.state)
    this.state = result.updatedState
    return result.result
  }

  async configureFilters(filters: CaseListingFilters): Promise<NavigationResult> {
    const result = await this.navWorkflow.configureFilters(this.state, filters)
    this.state = result.updatedState
    return result.result
  }

  async openCaseDetail(): Promise<NavigationResult> {
    const result = await this.navWorkflow.openCaseDetail(this.state)
    this.state = result.updatedState
    return result.result
  }

  async navigateToSpecificCase(caseId: string): Promise<NavigationResult> {
    const result = await this.caseNavigation.navigateToSpecificCase(this.state, caseId)
    this.state = result.updatedState
    return result.result
  }

  async processMultipleCases(maxCases: number = 10): Promise<NavigationResult> {
    const result = await this.navWorkflow.processMultipleCases(this.state, maxCases)
    this.state = result.updatedState
    
    // Store the last processed case ID from the first case
    if (result.result.success && result.result.data?.caseId) {
      this.lastProcessedCaseId = result.result.data.caseId
      console.log(`[RDN-PORTAL] Stored last processed case ID from first case: ${this.lastProcessedCaseId}`)
    }
    
    return result.result
  }
  
  async processNextCase(): Promise<NavigationResult> {
    const result = await this.caseNavigation.processNextCase(
      this.browserManager,
      this.state,
      this.lastProcessedCaseId
    )
    this.state = result.updatedState
    if (result.lastCaseId) {
      this.lastProcessedCaseId = result.lastCaseId
    }
    return result.result
  }

  async executeFullWorkflow(): Promise<NavigationResult> {
    const result = await this.workflowExecutor.executeFullWorkflow(
      this.state,
      this.isGetNextCase,
      this.targetCaseId,
      this.lastProcessedCaseId
    )
    this.state = result.updatedState
    if (result.lastCaseId) {
      this.lastProcessedCaseId = result.lastCaseId
    }
    return result.result
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