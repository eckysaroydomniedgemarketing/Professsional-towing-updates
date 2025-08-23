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

  // Helper function to parse address into components
  private parseAddress(address: string): { streetNumber: string; streetName: string; city: string; state: string; zip: string } {
    const normalized = address.toUpperCase().trim()
    const parts = normalized.split(',').map(p => p.trim())
    
    // Extract street components
    const streetParts = (parts[0] || '').split(' ')
    const streetNumber = streetParts[0] || ''
    const streetName = streetParts.slice(1).join(' ')
    
    // Extract city
    const city = parts[1] || ''
    
    // Extract state and ZIP
    const stateZip = (parts[2] || '').split(' ').filter(p => p)
    const state = stateZip[0] || ''
    const zip = stateZip[1] || ''
    
    return { streetNumber, streetName, city, state, zip }
  }

  // Helper function to find best matching address
  private findBestAddressMatch(targetAddress: string, options: Array<{value: string; text: string}>): {value: string; text: string; score: number} | null {
    const target = this.parseAddress(targetAddress)
    
    let bestMatch = null
    let bestScore = 0
    
    for (const option of options) {
      const candidate = this.parseAddress(option.text)
      let score = 0
      
      // Score each component (weighted by importance)
      if (target.streetNumber && target.streetNumber === candidate.streetNumber) score += 30
      if (target.streetName && target.streetName.toLowerCase() === candidate.streetName.toLowerCase()) score += 30
      if (target.city && target.city.toLowerCase() === candidate.city.toLowerCase()) score += 20
      if (target.state && target.state === candidate.state) score += 10
      
      // ZIP matching - full or partial
      if (target.zip && candidate.zip) {
        if (target.zip === candidate.zip) {
          score += 10
        } else if (target.zip.substring(0, 3) === candidate.zip.substring(0, 3)) {
          score += 5 // Partial ZIP match
        }
      }
      
      if (score > bestScore) {
        bestScore = score
        bestMatch = { ...option, score }
      }
    }
    
    // Accept match if score >= 60 (at least street number + street name match)
    return bestScore >= 60 ? bestMatch : null
  }

  async postUpdate(addressId: string, draftContent: string, addressText?: string, caseId?: string): Promise<NavigationResult> {
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
      
      // If caseId provided and not on the correct case page, navigate to it
      if (caseId && !currentUrl.includes(`case_id=${caseId}`)) {
        console.log(`[RDN-PORTAL] Not on case ${caseId} page, navigating to it...`)
        
        try {
          // Try frame navigation first (for iframe context)
          const mainFrame = page.frame({ name: 'mainFrame' })
          if (mainFrame) {
            console.log('[RDN-PORTAL] Using frame navigation')
            await mainFrame.goto(`case2/?tab=1&case_id=${caseId}`, {
              waitUntil: 'networkidle',
              timeout: 30000
            })
          } else {
            // Fallback to JavaScript navigation
            console.log('[RDN-PORTAL] Using JavaScript navigation')
            await page.evaluate((caseId) => {
              window.location.href = `/alpha_rdn/module/default/case2/?tab=1&case_id=${caseId}`
            }, caseId)
          }
          
          // Wait for navigation and page to load
          await page.waitForTimeout(3000)
          
          // Verify navigation succeeded
          const newUrl = page.url()
          if (newUrl.includes(`case_id=${caseId}`)) {
            console.log(`[RDN-PORTAL] Successfully navigated to case ${caseId}`)
          } else {
            throw new Error('Navigation completed but not on expected case page')
          }
        } catch (navError) {
          console.error('[RDN-PORTAL] Failed to navigate to case page:', navError)
          return {
            success: false,
            error: `Failed to navigate to case ${caseId}: ${navError instanceof Error ? navError.message : 'Unknown error'}`,
            nextStep: 'error' as const
          }
        }
      }
      
      // Verify we're on a case detail page
      const updatedUrl = page.url()
      if (!updatedUrl.includes('case_id=')) {
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
        
        console.log(`[RDN-PORTAL] Looking for address match for: "${addressText}"`)
        console.log(`[RDN-PORTAL] Available options: ${addressOptions.length}`)
        
        // Use smart address matching
        const bestMatch = this.findBestAddressMatch(addressText, addressOptions)
        
        if (bestMatch) {
          await page.selectOption('#is_address_update_select', bestMatch.value)
          console.log(`[RDN-PORTAL] Selected best matching address: "${bestMatch.text}" (score: ${bestMatch.score})`)
        } else {
          // No good match found, try to use addressId as fallback
          console.log('[RDN-PORTAL] No good address match found, trying addressId fallback')
          try {
            await page.selectOption('#is_address_update_select', addressId)
            console.log(`[RDN-PORTAL] Selected address by ID: ${addressId}`)
          } catch (e) {
            console.error('[RDN-PORTAL] Failed to select by addressId, selecting first option')
            // Last resort - select first non-empty option
            const firstOption = addressOptions.find((opt: any) => opt.value && opt.value !== '')
            if (firstOption) {
              await page.selectOption('#is_address_update_select', firstOption.value)
              console.log(`[RDN-PORTAL] Selected first available address: "${firstOption.text}"`)
            }
          }
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