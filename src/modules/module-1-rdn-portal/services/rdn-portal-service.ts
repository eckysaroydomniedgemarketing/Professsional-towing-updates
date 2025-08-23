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

  async postUpdate(addressId: string, draftContent: string, addressText?: string): Promise<NavigationResult> {
    try {
      const page = this.browserManager.getPage()
      if (!page) {
        return {
          success: false,
          error: 'No browser page available',
          nextStep: 'error' as const
        }
      }

      console.log('[RDN-PORTAL] Starting to post update to RDN portal')
      
      // Check current page URL
      const currentUrl = page.url()
      console.log('[RDN-PORTAL] Current URL:', currentUrl)
      
      // Verify we're on a case detail page
      if (!currentUrl.includes('case_id=')) {
        return {
          success: false,
          error: 'Not on case detail page. Please navigate to a case first.',
          nextStep: 'error' as const
        }
      }
      
      // Navigate to Updates tab if not already there
      console.log('[RDN-PORTAL] Checking if on Updates tab')
      
      // Check if Updates tab is already active
      const isOnUpdatesTab = await page.evaluate(() => {
        const activeTab = document.querySelector('.nav-tabs .active, .tab-active, [aria-selected="true"]')
        return activeTab?.textContent?.toLowerCase().includes('update') || false
      })
      
      if (!isOnUpdatesTab) {
        console.log('[RDN-PORTAL] Navigating to Updates tab')
        
        // Try multiple selectors for Updates tab
        const updatesTabClicked = await page.evaluate(() => {
          const selectors = [
            'a[href="#updates"]',
            'a[href*="updates"]',
            'button:has-text("Updates")',
            '.nav-tabs a:has-text("Updates")',
            '[data-tab="updates"]',
            'a:has-text("Updates")'
          ]
          
          for (const selector of selectors) {
            try {
              const element = document.querySelector(selector) as HTMLElement
              if (element) {
                element.click()
                return true
              }
            } catch (e) {
              continue
            }
          }
          return false
        })
        
        if (updatesTabClicked) {
          console.log('[RDN-PORTAL] Clicked Updates tab, waiting for content to load')
          await page.waitForTimeout(2000)
        } else {
          console.log('[RDN-PORTAL] Could not find Updates tab, attempting to proceed anyway')
        }
      }
      
      // Wait for update form to be visible
      console.log('[RDN-PORTAL] Waiting for update form elements')
      
      try {
        // Wait for the updates_type dropdown
        await page.waitForSelector('#updates_type', { timeout: 5000 })
        console.log('[RDN-PORTAL] Update form found')
      } catch (e) {
        // Check if form exists with alternative selectors
        const formExists = await page.evaluate(() => {
          return !!(document.querySelector('#updates_type') || 
                   document.querySelector('#updatesForm') || 
                   document.querySelector('select[name*="update"]'))
        })
        
        if (!formExists) {
          console.error('[RDN-PORTAL] Update form not found on page')
          return {
            success: false,
            error: 'Update form not found. Make sure you are on the Updates tab of a case.',
            nextStep: 'error' as const
          }
        }
      }
      
      // Scroll to the form section
      await page.evaluate(() => {
        const form = document.querySelector('#updatesForm') || 
                    document.querySelector('#updates_type')?.closest('form') ||
                    document.querySelector('form[name*="update"]')
        form?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
      
      // Wait briefly for scroll
      await page.waitForTimeout(1000)
      
      // Select Type dropdown - "(O) Agent-Update" with value="36"
      await page.selectOption('#updates_type', '36')
      console.log('[RDN-PORTAL] Selected Agent-Update type')
      
      // Find and select matching address in dropdown
      if (addressText) {
        const addressOptions = await page.evaluate(() => {
          const select = document.querySelector('#is_address_update_select') as HTMLSelectElement
          if (!select) return []
          return Array.from(select.options).map(opt => ({
            value: opt.value,
            text: opt.textContent?.trim() || ''
          }))
        })
        
        // Find matching option
        const normalizedTarget = addressText.toLowerCase().replace(/[,\s]+/g, ' ').trim()
        const matchingOption = addressOptions.find((opt: any) => {
          const normalizedOption = opt.text.toLowerCase().replace(/[,\s]+/g, ' ').trim()
          return normalizedOption === normalizedTarget || 
                 normalizedOption.includes(normalizedTarget) || 
                 normalizedTarget.includes(normalizedOption)
        })
        
        if (matchingOption) {
          await page.selectOption('#is_address_update_select', matchingOption.value)
          console.log(`[RDN-PORTAL] Selected address: "${matchingOption.text}"`)
        } else {
          // Fallback to addressId
          await page.selectOption('#is_address_update_select', addressId)
          console.log(`[RDN-PORTAL] Selected address by ID: ${addressId}`)
        }
      } else {
        // Use addressId directly
        await page.selectOption('#is_address_update_select', addressId)
        console.log(`[RDN-PORTAL] Selected address by ID: ${addressId}`)
      }
      
      // Fill Details textarea with draft content
      await page.fill('#comments', draftContent)
      console.log('[RDN-PORTAL] Filled update content')
      
      // Click Create button to submit
      await page.click('#create_button')
      console.log('[RDN-PORTAL] Clicked create button')
      
      // Wait for submission
      await page.waitForTimeout(2000)
      
      return {
        success: true,
        message: 'Update posted successfully to RDN portal',
        nextStep: 'complete' as const
      }
    } catch (error) {
      console.error('[RDN-PORTAL] Error posting update:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to post update',
        nextStep: 'error' as const
      }
    }
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

  async navigateToPage(pageNumber: number): Promise<NavigationResult> {
    const page = this.browserManager.getPage()
    if (!page) {
      return {
        success: false,
        nextStep: NavigationStep.ERROR,
        error: 'No browser page available'
      }
    }
    
    const result = await this.navigationManager.navigateToSpecificPage(page, pageNumber)
    if (result.success) {
      this.state.currentStep = NavigationStep.CASE_LISTING
    }
    return result
  }

  async continueAfterPageSelection(): Promise<NavigationResult> {
    const result = await this.workflowExecutor.continueAfterPageSelection(
      this.state,
      this.lastProcessedCaseId
    )
    this.state = result.updatedState
    if (result.lastCaseId) {
      this.lastProcessedCaseId = result.lastCaseId
    }
    return result.result
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