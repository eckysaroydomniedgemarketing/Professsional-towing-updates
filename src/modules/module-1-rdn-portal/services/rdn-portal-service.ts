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
import extractCaseData from '@/modules/data-extraction'

export class RDNPortalService {
  private browserManager: BrowserManager
  private authManager: AuthManager
  private navigationManager: NavigationManager
  private caseProcessor: CaseProcessor
  
  private state: NavigationState = {
    currentStep: NavigationStep.INITIAL,
    isAuthenticated: false
  }
  
  private isGetNextCase: boolean = false
  private lastProcessedCaseId: string | null = null
  private targetCaseId: string | null = null

  constructor(private credentials: RDNCredentials, getNextCase: boolean = false, targetCaseId: string | null = null) {
    this.browserManager = new BrowserManager()
    this.authManager = new AuthManager(credentials)
    this.navigationManager = new NavigationManager()
    this.caseProcessor = new CaseProcessor()
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
      
      // Updates tab navigation is now handled inside extractCaseData
      return result
    }
    
    return result
  }

  async navigateToSpecificCase(caseId: string): Promise<NavigationResult> {
    const page = this.browserManager.getPage()
    if (!page) throw new Error('Browser not initialized')
    
    const result = await this.navigationManager.navigateToSpecificCase(page, caseId)
    if (result.success) {
      this.state.currentStep = NavigationStep.CASE_DETAIL
      this.state.currentCaseId = caseId
      
      // Extract case data after navigating to the case
      console.log(`[RDN-PORTAL] Starting data extraction for case ${caseId}`)
      this.state.currentStep = NavigationStep.EXTRACTING_DATA
      
      const extractionResult = await extractCaseData(caseId, page, true)
      
      if (!extractionResult.success) {
        console.error(`[RDN-PORTAL] Data extraction failed for case ${caseId}`)
        return {
          success: false,
          nextStep: NavigationStep.ERROR,
          error: extractionResult.error || 'Data extraction failed'
        }
      }
      
      console.log(`[RDN-PORTAL] Data extraction successful for case ${caseId}`)
      this.state.currentStep = NavigationStep.EXTRACTION_COMPLETE
      
      return {
        success: true,
        nextStep: NavigationStep.EXTRACTION_COMPLETE,
        data: {
          caseId: caseId,
          sessionId: extractionResult.sessionId,
          message: 'Case data extracted successfully',
          recordsInserted: extractionResult.recordsInserted
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
      // Store the last processed case ID from the first case
      if (result.data?.caseId) {
        this.lastProcessedCaseId = result.data.caseId
        console.log(`[RDN-PORTAL] Stored last processed case ID from first case: ${this.lastProcessedCaseId}`)
      }
    }
    
    return result
  }
  
  async processNextCase(): Promise<NavigationResult> {
    const context = this.browserManager.getContext()
    if (!context) {
      return {
        success: false,
        nextStep: NavigationStep.ERROR,
        error: 'Browser context not available'
      }
    }
    
    try {
      console.log('[RDN-PORTAL] Finding next case in listing')
      
      // Get the current page (should be case listing after closing tabs)
      const pages = context.pages()
      const page = pages[0]
      
      if (!page) {
        return {
          success: false,
          nextStep: NavigationStep.ERROR,
          error: 'No page available'
        }
      }
      
      // Ensure page is in focus and loaded
      await page.bringToFront()
      await page.waitForLoadState('networkidle')
      console.log('[RDN-PORTAL] Case listing page brought to front')
      
      // Get the mainFrame iframe where the case table is located
      const frame = page.frame({ name: 'mainFrame' })
      if (!frame) {
        console.log('[RDN-PORTAL] mainFrame not found, waiting for it')
        await page.waitForSelector('iframe[name="mainFrame"]', { timeout: 10000 })
        const frameRetry = page.frame({ name: 'mainFrame' })
        if (!frameRetry) {
          return {
            success: false,
            nextStep: NavigationStep.ERROR,
            error: 'Could not access mainFrame iframe'
          }
        }
      }
      
      const activeFrame = frame || page.frame({ name: 'mainFrame' })
      if (!activeFrame) {
        return {
          success: false,
          nextStep: NavigationStep.ERROR,
          error: 'mainFrame iframe not accessible'
        }
      }
      
      // Wait for case listing table inside the iframe
      await activeFrame.waitForSelector('#casestable tbody tr, table.js-datatable tbody tr', { timeout: 10000 })
      console.log('[RDN-PORTAL] Case table found in iframe')
      
      // Find all case links inside the iframe
      const caseLinks = await activeFrame.$$('tbody tr td:first-child a[href*="case_id="] b')
      console.log(`[RDN-PORTAL] Found ${caseLinks.length} cases in listing`)
      
      if (caseLinks.length === 0) {
        return {
          success: false,
          nextStep: NavigationStep.ERROR,
          error: 'No cases available in listing'
        }
      }
      
      // Find the next case to process
      let nextCaseLink = null
      let caseId = null
      
      if (this.lastProcessedCaseId) {
        // Find the index of the last processed case
        console.log(`[RDN-PORTAL] Looking for last processed case: ${this.lastProcessedCaseId}`)
        let foundIndex = -1
        
        for (let i = 0; i < caseLinks.length; i++) {
          const linkText = await caseLinks[i].textContent()
          if (linkText === this.lastProcessedCaseId) {
            foundIndex = i
            console.log(`[RDN-PORTAL] Found last processed case at index ${i}`)
            break
          }
        }
        
        // Get the next case after the last processed one
        if (foundIndex >= 0 && foundIndex < caseLinks.length - 1) {
          nextCaseLink = caseLinks[foundIndex + 1]
          caseId = await nextCaseLink.textContent()
          console.log(`[RDN-PORTAL] Clicking on next case after ${this.lastProcessedCaseId}: ${caseId}`)
        } else if (foundIndex === caseLinks.length - 1) {
          return {
            success: false,
            nextStep: NavigationStep.ERROR,
            error: 'No more cases to process - reached end of list'
          }
        } else {
          // If we can't find the last processed case, take the first one
          console.log(`[RDN-PORTAL] Could not find last processed case, selecting first case`)
          nextCaseLink = caseLinks[0]
          caseId = await nextCaseLink.textContent()
        }
      } else {
        // No last processed case, take the first one
        console.log(`[RDN-PORTAL] No last processed case, selecting first case`)
        nextCaseLink = caseLinks[0]
        caseId = await nextCaseLink.textContent()
      }
      
      console.log(`[RDN-PORTAL] Clicking on next case: ${caseId}`)
      
      // Update state to show we're processing this case
      this.state.currentStep = NavigationStep.PROCESSING_CASE
      this.state.currentCaseId = caseId || undefined
      
      // Click opens in new tab
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        nextCaseLink.click()
      ])
      
      // Switch to new tab and wait for it to load
      await newPage.waitForLoadState('networkidle')
      
      // Update browser manager's page reference to the new tab
      this.browserManager.setPage(newPage)
      
      // Extract data for the new case
      if (caseId) {
        console.log(`[RDN-PORTAL] Starting data extraction for case ${caseId}`)
        
        // Update state to show we're extracting data
        this.state.currentStep = NavigationStep.EXTRACTING_DATA
        
        // Extract data starting from My Summary tab (we just opened the case)
        // The extraction function will handle navigating to Updates tab
        const extractionResult = await extractCaseData(caseId, newPage, true)
        
        if (!extractionResult.success) {
          console.error(`[RDN-PORTAL] Data extraction failed for case ${caseId}`)
          return {
            success: false,
            nextStep: NavigationStep.ERROR,
            error: extractionResult.error || 'Data extraction failed'
          }
        }
        
        console.log(`[RDN-PORTAL] Data extraction successful for case ${caseId}`)
        this.state.currentStep = NavigationStep.EXTRACTION_COMPLETE
        
        // Store the last processed case ID for next iteration
        this.lastProcessedCaseId = caseId
        console.log(`[RDN-PORTAL] Stored last processed case ID: ${this.lastProcessedCaseId}`)
        
        return {
          success: true,
          nextStep: NavigationStep.EXTRACTION_COMPLETE,
          data: {
            caseId: caseId,
            sessionId: extractionResult.sessionId,
            message: 'Case data extracted successfully',
            recordsInserted: extractionResult.recordsInserted
          }
        }
      }
      
      this.state.currentStep = NavigationStep.CASE_DETAIL
      
      return {
        success: true,
        nextStep: NavigationStep.CASE_DETAIL,
        data: {
          caseId: caseId || ''
        }
      }
    } catch (error) {
      return {
        success: false,
        nextStep: NavigationStep.ERROR,
        error: error instanceof Error ? error.message : 'Failed to process next case'
      }
    }
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
      
      // If getting next case, skip login and go straight to case listing
      if (this.isGetNextCase) {
        console.log('[RDN-PORTAL] Getting next case from existing session')
        
        const context = this.browserManager.getContext()
        if (!context) {
          return {
            success: false,
            nextStep: NavigationStep.ERROR,
            error: 'Browser context not available'
          }
        }
        
        // Update state to show we're returning to listing
        this.state.currentStep = NavigationStep.RETURNING_TO_LISTING
        
        // Get all open pages
        const pages = context.pages()
        console.log(`[RDN-PORTAL] Found ${pages.length} open tabs`)
        
        // Close all tabs except the first one (case listing)
        if (pages.length > 1) {
          for (let i = pages.length - 1; i > 0; i--) {
            await pages[i].close()
            console.log(`[RDN-PORTAL] Closed tab ${i}`)
          }
        }
        
        // Switch to first tab (should be case listing)
        const listingPage = pages[0]
        await listingPage.bringToFront()
        
        // Update state to show we're back at case listing
        this.state.currentStep = NavigationStep.CASE_LISTING
        
        // Process next case
        const processingResult = await this.processNextCase()
        console.log('[RDN-PORTAL] processNextCase result:', processingResult)
        return processingResult
      }
      
      // Check if we have a specific target case ID
      if (this.targetCaseId) {
        console.log(`[RDN-PORTAL] Loading specific case: ${this.targetCaseId}`)
        
        // Step 1: Navigate to login
        const loginNavResult = await this.navigateToLogin()
        if (!loginNavResult.success) return loginNavResult
        
        // Step 2: Authenticate
        const authResult = await this.authenticate()
        if (!authResult.success) return authResult
        
        // Step 3: Navigate directly to the specific case (includes data extraction)
        const caseNavResult = await this.navigateToSpecificCase(this.targetCaseId)
        return caseNavResult
      }
      
      // Normal flow for first case
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