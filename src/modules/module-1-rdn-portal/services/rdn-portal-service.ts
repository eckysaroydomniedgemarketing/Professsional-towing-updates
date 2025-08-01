import { chromium, Browser, Page, BrowserContext } from 'playwright'
import { 
  RDNCredentials, 
  NavigationState, 
  NavigationStep, 
  CaseListingFilters,
  NavigationResult 
} from '../types'
import { 
  waitForIframe, 
  getIframeOrThrow, 
  clickInIframe, 
  selectInIframe 
} from '../utils/iframe-helpers'

export class RDNPortalService {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null
  private state: NavigationState = {
    currentStep: NavigationStep.INITIAL,
    isAuthenticated: false
  }
  private debug = true // Toggle for production

  constructor(private credentials: RDNCredentials) {}

  private log(step: string, message: string, data?: any) {
    if (this.debug) {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [RDN-${step}]`, message, data ? JSON.stringify(data, null, 2) : '')
    }
  }

  private async checkSession(): Promise<boolean> {
    if (!this.page) return false
    const url = this.page.url()
    const isOnLoginPage = url.includes('login')
    if (isOnLoginPage) {
      this.log('SESSION-CHECK', 'Session lost - on login page', { url })
      this.state.isAuthenticated = false
      return false
    }
    return this.state.isAuthenticated
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: false, // Run in headed mode for manual inspection
      slowMo: 500, // Slow down actions for better visibility
      args: ['--start-maximized', '--start-fullscreen'] // Launch in fullscreen
    })
    
    this.context = await this.browser.newContext({
      viewport: null, // Use full screen dimensions
      screen: { width: 1920, height: 1080 } // Set screen size for fullscreen
    })
    
    this.page = await this.context.newPage()
  }

  async navigateToLogin(): Promise<NavigationResult> {
    this.log('STEP-1', 'Starting navigation to login page')
    try {
      if (!this.page) throw new Error('Page not initialized')
      
      const loginUrl = 'https://secureauth.recoverydatabase.net/public/login?rd=/'
      this.log('STEP-1', 'Navigating to URL', { url: loginUrl })
      
      await this.page.goto(loginUrl)
      
      this.log('STEP-1', 'Waiting for login form')
      await this.page.waitForSelector('form[method="post"]', { timeout: 10000 })
      
      this.log('STEP-1', 'Login form found successfully')
      this.state.currentStep = NavigationStep.LOGIN_PAGE
      
      return {
        success: true,
        nextStep: NavigationStep.LOGIN_PAGE
      }
    } catch (error) {
      this.log('STEP-1', 'Failed to navigate to login', { error: error instanceof Error ? error.message : 'Unknown error' })
      this.state.currentStep = NavigationStep.ERROR
      return {
        success: false,
        nextStep: NavigationStep.ERROR,
        error: error instanceof Error ? error.message : 'Failed to navigate to login'
      }
    }
  }

  async authenticate(): Promise<NavigationResult> {
    this.log('STEP-2', 'Starting authentication')
    try {
      if (!this.page) throw new Error('Page not initialized')
      
      // Fill in credentials
      this.log('STEP-2', 'Filling credentials', { username: this.credentials.username })
      await this.page.fill('input[name="username"]', this.credentials.username)
      await this.page.fill('input[name="password"]', this.credentials.password)
      await this.page.fill('input[name="code"]', this.credentials.securityCode)
      
      // Click login button
      this.log('STEP-2', 'Clicking login button')
      await this.page.click('button.btn-success')
      
      // Wait for navigation or error
      this.log('STEP-2', 'Waiting for navigation after login')
      await this.page.waitForLoadState('networkidle', { timeout: 15000 })
      
      // Check if we're on the dashboard
      const url = this.page.url()
      this.log('STEP-2', 'Current URL after login', { url })
      
      if (url.includes('dashboard') || !url.includes('login')) {
        this.log('STEP-2', 'Authentication successful - reached dashboard')
        this.state.isAuthenticated = true
        this.state.currentStep = NavigationStep.DASHBOARD
        this.state.sessionStartTime = new Date()
        this.state.lastActivityTime = new Date()
        
        return {
          success: true,
          nextStep: NavigationStep.DASHBOARD
        }
      } else {
        // Check for error messages
        const errorElement = await this.page.$('.alert-danger')
        const errorText = errorElement ? await errorElement.textContent() : 'Authentication failed'
        this.log('STEP-2', 'Authentication failed', { error: errorText, url })
        
        return {
          success: false,
          nextStep: NavigationStep.LOGIN_PAGE,
          error: errorText as string
        }
      }
    } catch (error) {
      this.log('STEP-2', 'Authentication error', { error: error instanceof Error ? error.message : 'Unknown error' })
      this.state.currentStep = NavigationStep.ERROR
      return {
        success: false,
        nextStep: NavigationStep.ERROR,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }

  async navigateToCaseListing(): Promise<NavigationResult> {
    this.log('STEP-4', 'Starting navigation to case listing')
    try {
      if (!this.page) throw new Error('Page not initialized')
      
      // Wait for iframe to exist
      this.log('STEP-4', 'Waiting for mainFrame iframe to appear')
      await this.page.waitForSelector('iframe[name="mainFrame"]')
      
      // Get the iframe
      const frame = this.page.frame({ name: 'mainFrame' })
      if (!frame) {
        throw new Error('mainFrame iframe not found')
      }
      
      this.log('STEP-4', 'Iframe found, waiting for Case Update Needed Listing link')
      
      // Wait for the link to appear in iframe
      await frame.waitForSelector('a:has-text("Case Update Needed Listing")')
      
      // Click the link
      this.log('STEP-4', 'Link found, clicking Case Update Needed Listing')
      await frame.click('a:has-text("Case Update Needed Listing")')
      
      // Wait for navigation to complete
      this.log('STEP-4', 'Waiting for case listing page to load')
      await this.page.waitForLoadState('networkidle')
      
      this.log('STEP-4', 'Successfully navigated to case listing')
      this.state.currentStep = NavigationStep.CASE_LISTING
      this.state.lastActivityTime = new Date()
      
      return {
        success: true,
        nextStep: NavigationStep.CASE_LISTING
      }
    } catch (error) {
      this.log('STEP-4', 'Failed to navigate to case listing', { error: error instanceof Error ? error.message : 'Unknown error' })
      return {
        success: false,
        nextStep: this.state.currentStep,
        error: error instanceof Error ? error.message : 'Failed to navigate to case listing'
      }
    }
  }

  private async applyFilterSelection(frame: any, caseWorker: string): Promise<void> {
    await frame.waitForSelector('select[name="case_worker"]', { timeout: 5000 })
    
    const currentValue = await frame.$eval('select[name="case_worker"]', (el: any) => el.value)
    this.log('STEP-5', 'Current case worker selection', { value: currentValue })
    
    await frame.selectOption('select[name="case_worker"]', caseWorker)
    
    const selectedValue = await frame.$eval('select[name="case_worker"]', (el: any) => el.value)
    if (selectedValue !== caseWorker) {
      throw new Error(`Failed to select case worker: expected "${caseWorker}", got "${selectedValue}"`)
    }
    
    const updateButton = await frame.$('input[type="submit"][value="Update"]')
    if (!updateButton) throw new Error('Update button not found')
    
    await updateButton.click()
    
    try {
      await Promise.race([
        this.page!.waitForNavigation({ timeout: 15000, waitUntil: 'networkidle' }),
        this.page!.waitForLoadState('networkidle', { timeout: 15000 })
      ])
    } catch (e) {
      this.log('STEP-5', 'Wait strategies timed out')
    }
    
    const currentUrl = this.page!.url()
    if (currentUrl.includes('login')) {
      throw new Error('Session expired - redirected to login')
    }
    
    await this.page!.waitForTimeout(2000)
  }

  private async setEntriesPerPage(entriesPerPage: number): Promise<void> {
    const frame = await waitForIframe(this.page!, 'mainFrame', 5000)
    if (!frame) throw new Error('Frame not found for entries dropdown')
    
    const selectors = [
      'select[name="DataTables_Table_0_length"]',
      'select[name="casestable_length"]',
      'select[name*="_length"][aria-controls]',
      'select.form-select[name*="length"]'
    ]
    
    let workingSelector = null
    for (const selector of selectors) {
      const dropdown = await frame.$(selector)
      if (dropdown) {
        workingSelector = selector
        break
      }
    }
    
    if (!workingSelector) {
      throw new Error('Could not find entries per page dropdown')
    }
    
    await frame.selectOption(workingSelector, entriesPerPage.toString())
    await this.page!.waitForTimeout(1500)
  }

  private async applySortByLastUpdate(): Promise<void> {
    const frame = await waitForIframe(this.page!, 'mainFrame', 5000)
    if (!frame) throw new Error('Frame not found for sorting')
    
    const selectors = [
      'th[aria-controls="DataTables_Table_0"][aria-label*="Last Update"]',
      'th[aria-controls="casestable"][aria-label*="Last Update"]',
      'th[aria-label*="Last Update"]',
      'th:has-text("Last Update")',
      'th.sorting:has-text("Last Update")'
    ]
    
    let header = null
    for (const selector of selectors) {
      header = await frame.$(selector)
      if (header) break
    }
    
    if (!header) throw new Error('Last Update column header not found')
    
    const currentSort = await header.getAttribute('aria-sort')
    const hasDescClass = await header.evaluate((el: any) => el.classList.contains('sorting_desc'))
    
    if (currentSort !== 'descending' && !hasDescClass) {
      await header.click()
      await this.page!.waitForTimeout(1000)
      
      const newSort = await header.getAttribute('aria-sort')
      if (newSort === 'ascending') {
        await header.click()
        await this.page!.waitForTimeout(1000)
      }
    }
  }

  async configureFilters(filters: CaseListingFilters): Promise<NavigationResult> {
    this.log('STEP-5', 'Starting filter configuration', { filters })
    try {
      if (!this.page) throw new Error('Page not initialized')
      
      await this.page.waitForLoadState('domcontentloaded')
      
      const frame = await getIframeOrThrow(this.page, 'mainFrame', 10000)
      
      await this.applyFilterSelection(frame, filters.caseWorker)
      
      await this.setEntriesPerPage(filters.entriesPerPage)
      
      await this.applySortByLastUpdate()
      
      if (!await this.checkSession()) {
        throw new Error('Session lost during filter configuration')
      }
      
      this.state.lastActivityTime = new Date()
      
      this.log('STEP-5', 'Filter configuration completed successfully')
      return {
        success: true,
        nextStep: NavigationStep.CASE_LISTING
      }
    } catch (error) {
      this.log('STEP-5', 'Failed to configure filters', { error: error instanceof Error ? error.message : 'Unknown error' })
      return {
        success: false,
        nextStep: NavigationStep.CASE_LISTING,
        error: error instanceof Error ? error.message : 'Failed to configure filters'
      }
    }
  }

  async openCaseDetail(): Promise<NavigationResult> {
    this.log('STEP-6', 'Starting to open case detail')
    try {
      if (!this.page) throw new Error('Page not initialized')
      
      // Get the iframe - case listing is always in iframe
      this.log('STEP-6', 'Getting iframe for case table')
      const frame = await getIframeOrThrow(this.page, 'mainFrame', 10000)
      
      // Wait for table to be fully loaded - try multiple selectors
      this.log('STEP-6', 'Waiting for case table to load')
      
      const tableSelectors = [
        '#casestable tbody tr',
        'table.js-datatable tbody tr',
        'table tbody tr[class]',
        'table tbody tr'
      ]
      
      let tableSelector = null
      for (const selector of tableSelectors) {
        try {
          await frame.waitForSelector(selector, { timeout: 2000 })
          tableSelector = selector
          this.log('STEP-6', 'Table found with selector', { selector })
          break
        } catch (e) {
          this.log('STEP-6', 'Selector not found, trying next', { selector })
        }
      }
      
      if (!tableSelector) {
        throw new Error('Could not find case table with any selector')
      }
      
      // Count available rows
      const rowCount = await frame.$$eval(tableSelector, rows => rows.length)
      this.log('STEP-6', 'Case table loaded', { rowCount, selector: tableSelector })
      
      // Find the first case ID link (bold number) - try multiple selectors
      this.log('STEP-6', 'Looking for first case ID link')
      
      const linkSelectors = [
        'tbody tr:first-child td:first-child a[href*="case_id="] b',
        'tbody tr:first-child td:first-child a[href*="case_id="]:not([href*="tab="])',
        'tbody tr:first-child a[href*="case_id="] b',
        'tbody tr:first-child a[href*="case_id="]:not([href*="tab="])',
        'tr:first-child a[target="new"] b',
        'a[href*="/case2/?case_id="] b'
      ]
      
      let clickableElement = null
      for (const selector of linkSelectors) {
        const element = await frame.$(selector)
        if (element) {
          clickableElement = element
          this.log('STEP-6', 'Case ID link found with selector', { selector })
          break
        }
      }
      
      if (!clickableElement) {
        this.log('STEP-6', 'No case ID link found in table with any selector')
        return {
          success: false,
          nextStep: NavigationStep.CASE_LISTING,
          error: 'No cases found in the table'
        }
      }
      
      this.log('STEP-6', 'Clicking case ID link')
      await clickableElement.click()
      
      // Wait for navigation to case detail page
      this.log('STEP-6', 'Waiting for case detail page to load')
      await this.page.waitForLoadState('networkidle', { timeout: 10000 })
      
      // Verify we're on the case detail page
      const currentUrl = this.page.url()
      this.log('STEP-6', 'Navigation complete', { url: currentUrl })
      
      if (!currentUrl.includes('case2') && !currentUrl.includes('case_id=')) {
        this.log('STEP-6', 'Warning: URL does not appear to be a case detail page', { url: currentUrl })
        console.warn('Warning: URL does not appear to be a case detail page:', currentUrl)
      }
      
      this.state.currentStep = NavigationStep.CASE_DETAIL
      this.state.lastActivityTime = new Date()
      
      this.log('STEP-6', 'Successfully opened case detail')
      return {
        success: true,
        nextStep: NavigationStep.CASE_DETAIL,
        data: {
          url: currentUrl
        }
      }
    } catch (error) {
      this.log('STEP-6', 'Failed to open case detail', { error: error instanceof Error ? error.message : 'Unknown error' })
      return {
        success: false,
        nextStep: NavigationStep.CASE_LISTING,
        error: error instanceof Error ? error.message : 'Failed to open case detail'
      }
    }
  }

  async processMultipleCases(maxCases: number = 10): Promise<NavigationResult> {
    this.log('MULTI-CASE', 'Starting multi-case processing', { maxCases })
    
    let processedCount = 0
    let lastResult: NavigationResult = {
      success: true,
      nextStep: NavigationStep.CASE_LISTING
    }
    
    for (let i = 0; i < maxCases; i++) {
      this.log('MULTI-CASE', `Processing case ${i + 1} of ${maxCases}`)
      
      // Try to open a case
      const caseResult = await this.openCaseDetail()
      
      if (!caseResult.success) {
        if (caseResult.error?.includes('No cases found')) {
          this.log('MULTI-CASE', 'No more cases to process')
          break
        } else {
          this.log('MULTI-CASE', 'Failed to open case', { error: caseResult.error })
          lastResult = caseResult
          break
        }
      }
      
      processedCount++
      
      // Here you would process the case data
      // For MVP, we just log success
      this.log('MULTI-CASE', `Case ${processedCount} processed successfully`)
      
      // Navigate back to case listing
      this.log('MULTI-CASE', 'Navigating back to case listing')
      const navResult = await this.navigateToCaseListing()
      
      if (!navResult.success) {
        this.log('MULTI-CASE', 'Failed to navigate back to listing')
        lastResult = navResult
        break
      }
      
      // Re-apply filters
      this.log('MULTI-CASE', 'Re-applying filters')
      const filterResult = await this.configureFilters({
        caseWorker: '',
        entriesPerPage: 100,
        sortBy: 'lastUpdate',
        sortOrder: 'desc'
      })
      
      if (!filterResult.success) {
        this.log('MULTI-CASE', 'Failed to re-apply filters')
        lastResult = filterResult
        break
      }
      
      // Small delay between cases
      await this.page!.waitForTimeout(1000)
    }
    
    this.log('MULTI-CASE', 'Multi-case processing complete', { processedCount })
    
    return {
      success: processedCount > 0,
      nextStep: NavigationStep.CASE_LISTING,
      data: {
        processedCount,
        maxCases
      }
    }
  }

  async executeFullWorkflow(): Promise<NavigationResult> {
    try {
      // Initialize browser
      await this.initialize()
      
      // Step 1: Navigate to login
      const loginResult = await this.navigateToLogin()
      if (!loginResult.success) return loginResult
      
      // Step 2 & 3: Authenticate (enters credentials and submits)
      const authResult = await this.authenticate()
      if (!authResult.success) return authResult
      
      // Step 4: Navigate to case listing
      const listingResult = await this.navigateToCaseListing()
      if (!listingResult.success) return listingResult
      
      // Step 5: Configure filters
      const filterResult = await this.configureFilters({
        caseWorker: '',  // Empty string selects "All" option
        entriesPerPage: 100,
        sortBy: 'lastUpdate',
        sortOrder: 'desc'
      })
      if (!filterResult.success) return filterResult
      
      // Step 6: Process multiple cases
      const multiCaseResult = await this.processMultipleCases(10)
      return multiCaseResult
      
    } catch (error) {
      return {
        success: false,
        nextStep: NavigationStep.ERROR,
        error: error instanceof Error ? error.message : 'Workflow execution failed'
      }
    }
  }

  async getState(): Promise<NavigationState> {
    return { ...this.state }
  }

  async getCurrentUrl(): Promise<string | null> {
    return this.page ? this.page.url() : null
  }

  async takeScreenshot(filename: string): Promise<void> {
    if (this.page) {
      await this.page.screenshot({ path: filename, fullPage: true })
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.context = null
      this.page = null
    }
  }
}