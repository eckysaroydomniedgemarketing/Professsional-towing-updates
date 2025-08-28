import { NavigationStep, NavigationResult, NavigationState, CaseListingFilters } from '../types'
import { BrowserManager } from './browser-manager.service'
import { PortalAuthWorkflowService } from './portal-auth-workflow.service'
import { PortalNavigationWorkflowService } from './portal-navigation-workflow.service'
import { CaseNavigationService } from './case-navigation.service'
import { NavigationManager } from './navigation-manager.service'

export class WorkflowExecutorService {
  constructor(
    private browserManager: BrowserManager,
    private authWorkflow: PortalAuthWorkflowService,
    private navWorkflow: PortalNavigationWorkflowService,
    private caseNavigation: CaseNavigationService
  ) {}

  async executeFullWorkflow(
    state: NavigationState,
    isGetNextCase: boolean,
    targetCaseId: string | null,
    lastProcessedCaseId: string | null
  ): Promise<{ result: NavigationResult; updatedState: NavigationState; lastCaseId: string | null }> {
    try {
      // Check if browser is initialized
      if (!this.browserManager.isInitialized()) {
        return {
          result: {
            success: false,
            nextStep: NavigationStep.ERROR,
            error: 'Browser not initialized. Call initialize() first.'
          },
          updatedState: state,
          lastCaseId: lastProcessedCaseId
        }
      }
      
      // If getting next case, skip login and go straight to case listing
      if (isGetNextCase) {
        console.log('[WORKFLOW] Getting next case from existing session')
        
        const context = this.browserManager.getContext()
        if (!context) {
          return {
            result: {
              success: false,
              nextStep: NavigationStep.ERROR,
              error: 'Browser context not available'
            },
            updatedState: state,
            lastCaseId: lastProcessedCaseId
          }
        }
        
        // Update state to show we're returning to listing
        const updatedState = { ...state, currentStep: NavigationStep.RETURNING_TO_LISTING }
        
        // Get all open pages
        const pages = context.pages()
        console.log(`[WORKFLOW] Found ${pages.length} open tabs`)
        
        // Identify tabs by their content/URL instead of position
        let listingPage = null
        const tabsToClose = []
        
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i]
          const url = page.url()
          console.log(`[WORKFLOW] Tab ${i}: URL=${url}`)
          
          try {
            // Check if this page has the mainFrame iframe (only listing page has it)
            const hasMainFrame = await page.$('iframe[name="mainFrame"]') !== null
            
            // Check URL patterns
            const isListingUrl = !url.includes('case_id=') || url.includes('case_listing')
            
            console.log(`[WORKFLOW] Tab ${i}: hasMainFrame=${hasMainFrame}, isListingUrl=${isListingUrl}`)
            
            if (hasMainFrame && isListingUrl) {
              // This is the case listing page
              listingPage = page
              console.log(`[WORKFLOW] Tab ${i} identified as case listing page`)
            } else {
              // This is a case detail page or other page
              tabsToClose.push(page)
              console.log(`[WORKFLOW] Tab ${i} marked for closing`)
            }
          } catch (error) {
            console.log(`[WORKFLOW] Error checking tab ${i}:`, error)
            // If we can't check the tab, mark it for closing unless it's the only one
            if (pages.length > 1) {
              tabsToClose.push(page)
            }
          }
        }
        
        // If we couldn't identify the listing page, use fallback logic
        if (!listingPage && pages.length > 0) {
          console.log('[WORKFLOW] Could not identify listing page, using first tab as fallback')
          listingPage = pages[0]
          // Remove it from tabs to close if it was added
          const index = tabsToClose.indexOf(listingPage)
          if (index > -1) {
            tabsToClose.splice(index, 1)
          }
        }
        
        // Close identified non-listing tabs
        for (const page of tabsToClose) {
          try {
            await page.close()
            console.log('[WORKFLOW] Closed non-listing tab')
          } catch (error) {
            console.log('[WORKFLOW] Error closing tab:', error)
          }
        }
        
        // Clear case page reference when closing tabs
        this.browserManager.setCasePage(null)
        console.log('[WORKFLOW] Cleared case page reference')
        
        // Ensure we have the listing page
        if (!listingPage) {
          return {
            result: {
              success: false,
              nextStep: NavigationStep.ERROR,
              error: 'Could not find case listing page'
            },
            updatedState: state,
            lastCaseId: lastProcessedCaseId
          }
        }
        
        // Bring the listing page to front
        await listingPage.bringToFront()
        console.log('[WORKFLOW] Case listing page brought to front')
        
        // Update browser manager's page references
        this.browserManager.setPage(listingPage)
        this.browserManager.setListingPage(listingPage)
        console.log('[WORKFLOW] Updated browser manager page references')
        
        // Update state to show we're back at case listing
        updatedState.currentStep = NavigationStep.CASE_LISTING
        
        // Process next case
        const processingResult = await this.caseNavigation.processNextCase(
          this.browserManager,
          updatedState,
          lastProcessedCaseId
        )
        console.log('[WORKFLOW] processNextCase result:', processingResult.result)
        return processingResult
      }
      
      // Check if we have a specific target case ID
      if (targetCaseId) {
        console.log(`[WORKFLOW] Loading specific case: ${targetCaseId}`)
        
        // Step 1: Navigate to login
        const loginNavResult = await this.authWorkflow.navigateToLogin(state)
        if (!loginNavResult.result.success) return { ...loginNavResult, lastCaseId: lastProcessedCaseId }
        
        // Step 2: Authenticate
        const authResult = await this.authWorkflow.authenticate(loginNavResult.updatedState)
        if (!authResult.result.success) return { ...authResult, lastCaseId: lastProcessedCaseId }
        
        // Step 3: Navigate directly to the specific case (includes data extraction)
        const caseNavResult = await this.caseNavigation.navigateToSpecificCase(
          authResult.updatedState,
          targetCaseId
        )
        return { ...caseNavResult, lastCaseId: lastProcessedCaseId }
      }
      
      // Normal flow for first case
      // Step 1: Navigate to login
      const loginNavResult = await this.authWorkflow.navigateToLogin(state)
      if (!loginNavResult.result.success) return { ...loginNavResult, lastCaseId: lastProcessedCaseId }
      
      // Step 2: Authenticate
      const authResult = await this.authWorkflow.authenticate(loginNavResult.updatedState)
      if (!authResult.result.success) return { ...authResult, lastCaseId: lastProcessedCaseId }
      
      // Step 3: Navigate to case listing
      const caseListingResult = await this.navWorkflow.navigateToCaseListing(authResult.updatedState)
      if (!caseListingResult.result.success) return { ...caseListingResult, lastCaseId: lastProcessedCaseId }
      
      // Step 4: Configure filters BEFORE page selection
      const filters: CaseListingFilters = {
        caseWorker: '',
        entriesPerPage: 25,
        sortByLastUpdate: true
      }
      const filterResult = await this.navWorkflow.configureFilters(caseListingResult.updatedState, filters)
      if (!filterResult.result.success) return { ...filterResult, lastCaseId: lastProcessedCaseId }
      
      // Step 5: Extract page info AFTER filters are applied
      const page = this.browserManager.getPage()
      if (page) {
        const navigationManager = new NavigationManager()
        const pageInfo = await navigationManager.extractPageInfo(page)
        
        if (pageInfo && pageInfo.totalPages > 1) {
          // Multiple pages exist - pause for user selection
          console.log('[WORKFLOW] Multiple pages detected, pausing for page selection')
          const { setPageInfo, setNavigationStep } = await import('./workflow-state.service')
          setPageInfo(pageInfo.totalPages, pageInfo.currentPage)
          setNavigationStep(NavigationStep.PAGE_SELECTION)
          
          return { 
            result: {
              success: true,
              nextStep: NavigationStep.PAGE_SELECTION,
              data: { waitingForPageSelection: true }
            },
            updatedState: filterResult.updatedState,
            lastCaseId: lastProcessedCaseId
          }
        }
      }
      
      // Step 6: Process single case (no page selection needed)
      const processingResult = await this.navWorkflow.processMultipleCases(filterResult.updatedState, 1)
      
      // Store the last processed case ID from the first case
      let newLastCaseId = lastProcessedCaseId
      if (processingResult.result.success && processingResult.result.data?.caseId) {
        newLastCaseId = processingResult.result.data.caseId
        console.log(`[WORKFLOW] Stored last processed case ID from first case: ${newLastCaseId}`)
      }
      
      return { ...processingResult, lastCaseId: newLastCaseId }
    } catch (error) {
      return {
        result: {
          success: false,
          nextStep: state.currentStep,
          error: error instanceof Error ? error.message : 'Workflow execution failed'
        },
        updatedState: state,
        lastCaseId: lastProcessedCaseId
      }
    }
  }

  async continueAfterPageSelection(
    state: NavigationState,
    lastProcessedCaseId: string | null
  ): Promise<{ result: NavigationResult; updatedState: NavigationState; lastCaseId: string | null }> {
    try {
      console.log('[WORKFLOW] Continuing workflow after page selection')
      
      // Update state to CASE_LISTING
      const updatedState = { ...state, currentStep: NavigationStep.CASE_LISTING }
      
      // Filters already applied - just process the case from selected page
      const processingResult = await this.navWorkflow.processMultipleCases(updatedState, 1)
      
      // Store the last processed case ID from the first case
      let newLastCaseId = lastProcessedCaseId
      if (processingResult.result.success && processingResult.result.data?.caseId) {
        newLastCaseId = processingResult.result.data.caseId
        console.log(`[WORKFLOW] Stored last processed case ID: ${newLastCaseId}`)
      }
      
      return { ...processingResult, lastCaseId: newLastCaseId }
    } catch (error) {
      return {
        result: {
          success: false,
          nextStep: state.currentStep,
          error: error instanceof Error ? error.message : 'Workflow continuation failed'
        },
        updatedState: state,
        lastCaseId: lastProcessedCaseId
      }
    }
  }
}