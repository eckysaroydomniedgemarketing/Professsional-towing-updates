import { chromium, Browser, Page, BrowserContext, Frame } from 'playwright'
import { 
  RDNCredentials, 
  NavigationState, 
  NavigationStep, 
  CaseListingFilters,
  NavigationResult 
} from '../types'
import { 
  waitForIframe, 
  getIframeOrThrow
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
  private caseListingUrl: string | null = null

  constructor(private credentials: RDNCredentials) {}

  private log(step: string, message: string, data?: unknown) {
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
      
      // Check both page URL and frame URL
      const pageUrl = this.page.url()
      const frame = this.page.frame({ name: 'mainFrame' })
      const frameUrl = frame ? frame.url() : ''
      
      this.log('STEP-4', 'Current URLs', { pageUrl, frameUrl })
      
      // Check if we're on a case detail page by checking BOTH URLs
      const isFromCaseDetail = 
        pageUrl.includes('case2') || pageUrl.includes('case_id=') ||
        frameUrl.includes('case2') || frameUrl.includes('case_id=')
      
      if (isFromCaseDetail) {
        this.log('STEP-4', 'Currently on case detail page, handling tab navigation')
        
        // Check if we have multiple tabs open
        const allPages = this.context!.pages()
        this.log('STEP-4', `Found ${allPages.length} open tabs`)
        
        if (allPages.length > 1) {
          // We're in a separate tab, need to close it and switch back
          try {
            // Close current tab
            await this.page.close()
            this.log('STEP-4', 'Closed case detail tab')
            
            // Switch back to the first tab (case listing)
            this.page = allPages[0]
            await this.page.bringToFront()
            this.log('STEP-4', 'Switched back to case listing tab')
            
            // Check if we need to navigate back to case listing
            const currentUrl = this.page.url()
            this.log('STEP-4', 'Current URL after tab switch', { url: currentUrl })
            
            if (!currentUrl.includes('three_day_updates.php')) {
              // Navigate to the stored case listing URL or default
              if (this.caseListingUrl) {
                this.log('STEP-4', 'Navigating to stored case listing URL', { url: this.caseListingUrl })
                await this.page.goto(this.caseListingUrl)
                await this.page.waitForLoadState('networkidle')
              } else {
                // Navigate to case listing within frame
                const frame = this.page.frame({ name: 'mainFrame' })
                if (frame) {
                  this.log('STEP-4', 'Navigating to case listing via frame')
                  await frame.goto('three_day_updates.php?num_of_days=3')
                  await this.page.waitForLoadState('networkidle')
                }
              }
            }
            
            // Now wait for the table
            const frame = this.page.frame({ name: 'mainFrame' })
            if (frame) {
              await frame.waitForSelector('#casestable tbody tr', { 
                state: 'visible', 
                timeout: 10000 
              })
              
              this.log('STEP-4', 'Successfully returned to case listing tab')
              this.state.currentStep = NavigationStep.CASE_LISTING
              this.state.lastActivityTime = new Date()
              return {
                success: true,
                nextStep: NavigationStep.CASE_LISTING
              }
            }
          } catch (e) {
            this.log('STEP-4', 'Tab switching failed', { error: e instanceof Error ? e.message : 'Unknown error' })
          }
        }
        
        // Fallback: Try frame navigation if we're in the same tab
        if (frame) {
          try {
            this.log('STEP-4', 'Attempting frame navigation to three_day_updates.php')
            await frame.goto('three_day_updates.php?num_of_days=3')
            await this.page.waitForLoadState('networkidle')
            
            // Wait for the case table to load
            await frame.waitForSelector('#casestable tbody tr', { 
              state: 'visible', 
              timeout: 10000 
            })
            
            this.log('STEP-4', 'Successfully navigated to case listing via frame')
            this.state.currentStep = NavigationStep.CASE_LISTING
            this.state.lastActivityTime = new Date()
            return {
              success: true,
              nextStep: NavigationStep.CASE_LISTING
            }
          } catch (e) {
            this.log('STEP-4', 'Frame navigation failed', { error: e instanceof Error ? e.message : 'Unknown error' })
          }
        }
        
        throw new Error('All navigation methods from case detail failed')
      }
      
      // Original flow - when navigating from dashboard (NOT from case detail)
      this.log('STEP-4', 'Not on case detail, looking for Case Update Needed Listing link')
      
      // If frame wasn't found earlier, wait for it
      if (!frame) {
        this.log('STEP-4', 'Waiting for mainFrame iframe to appear')
        await this.page.waitForSelector('iframe[name="mainFrame"]')
        
        // Get the iframe again
        const frameNow = this.page.frame({ name: 'mainFrame' })
        if (!frameNow) {
          throw new Error('mainFrame iframe not found')
        }
        
        // Use frameNow for the rest of this block
        this.log('STEP-4', 'Iframe found, waiting for Case Update Needed Listing link')
        
        // Only look for this link when NOT on case detail page
        await frameNow.waitForSelector('a:has-text("Case Update Needed Listing")', { timeout: 5000 })
        
        // Click the link
        this.log('STEP-4', 'Link found, clicking Case Update Needed Listing')
        await frameNow.click('a:has-text("Case Update Needed Listing")')
      } else {
        // Frame already exists, use it
        this.log('STEP-4', 'Iframe found, waiting for Case Update Needed Listing link')
        
        // Only look for this link when NOT on case detail page
        await frame.waitForSelector('a:has-text("Case Update Needed Listing")', { timeout: 5000 })
        
        // Click the link
        this.log('STEP-4', 'Link found, clicking Case Update Needed Listing')
        await frame.click('a:has-text("Case Update Needed Listing")')
      }
      
      // Wait for navigation to complete
      this.log('STEP-4', 'Waiting for case listing page to load')
      await this.page.waitForLoadState('networkidle')
      
      this.log('STEP-4', 'Successfully navigated to case listing from dashboard')
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

  private async applyFilterSelection(frame: Frame, caseWorker: string): Promise<void> {
    await frame.waitForSelector('select[name="case_worker"]', { timeout: 5000 })
    
    const currentValue = await frame.$eval('select[name="case_worker"]', (el: unknown) => (el as HTMLSelectElement).value)
    this.log('STEP-5', 'Current case worker selection', { value: currentValue })
    
    await frame.selectOption('select[name="case_worker"]', caseWorker)
    
    const selectedValue = await frame.$eval('select[name="case_worker"]', (el: unknown) => (el as HTMLSelectElement).value)
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
    } catch {
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
    const hasDescClass = await header.evaluate((el: unknown) => (el as HTMLElement).classList.contains('sorting_desc'))
    
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
      
      // Store the case listing URL for later navigation
      this.caseListingUrl = this.page.url()
      this.log('STEP-5', 'Stored case listing URL', { url: this.caseListingUrl })
      
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

  private async clickUpdatesTab(): Promise<boolean> {
    try {
      if (!this.page) return false
      
      // Wait for the case detail page to fully load
      this.log('STEP-7', 'Waiting for case detail page to load completely')
      await this.page.waitForLoadState('domcontentloaded')
      await this.page.waitForTimeout(2000)
      
      // Log current page URL
      const pageUrl = this.page.url()
      this.log('STEP-7', 'Current page URL', { pageUrl })
      
      // Check if we're in an iframe context or direct page
      const frame = this.page.frame({ name: 'mainFrame' })
      const context = frame || this.page
      this.log('STEP-7', `Using ${frame ? 'iframe' : 'page'} context for tab clicking`)
      
      // Wait for the tabs container to be visible
      try {
        await context.waitForSelector('#newTabsTop', { state: 'visible', timeout: 5000 })
        this.log('STEP-7', 'Found tabs container')
      } catch {
        this.log('STEP-7', 'Tabs container not found')
      }
      
      // Method 1: Click the link directly using the tab ID
      try {
        await context.waitForSelector('#tab_6 a', { state: 'visible', timeout: 5000 })
        await context.click('#tab_6 a')
        this.log('STEP-7', 'Successfully clicked Updates tab using #tab_6 a')
        await this.page.waitForTimeout(2000)
        return true
      } catch {
        this.log('STEP-7', '#tab_6 a selector failed')
      }
      
      // Method 2: Click using onclick attribute
      try {
        await context.click('a[onclick="switchTab(6);return false;"]')
        this.log('STEP-7', 'Successfully clicked Updates tab using onclick attribute')
        await this.page.waitForTimeout(2000)
        return true
      } catch {
        this.log('STEP-7', 'onclick attribute selector failed')
      }
      
      // Method 3: Click the li element (event might bubble up)
      try {
        await context.click('li#tab_6')
        this.log('STEP-7', 'Successfully clicked Updates tab using li#tab_6')
        await this.page.waitForTimeout(2000)
        return true
      } catch {
        this.log('STEP-7', 'li#tab_6 selector failed')
      }
      
      // Method 4: Use text-based selector
      try {
        await context.click('a:has-text("Updates")')
        this.log('STEP-7', 'Successfully clicked Updates tab using text selector')
        await this.page.waitForTimeout(2000)
        return true
      } catch {
        this.log('STEP-7', 'Text-based selector failed')
      }
      
      // Method 5: Evaluate to handle unquoted attributes and direct clicks
      const clicked = await context.evaluate(() => {
        // Find by tab_6 id
        const tab6 = document.getElementById('tab_6')
        if (tab6) {
          const link = tab6.querySelector('a')
          if (link) {
            link.click()
            return 'tab6-link'
          }
        }
        
        // Find by onclick attribute
        const linkByOnclick = document.querySelector('a[onclick*="switchTab(6)"]')
        if (linkByOnclick) {
          (linkByOnclick as HTMLElement).click()
          return 'onclick-link'
        }
        
        // Find by span with unquoted id
        const spans = document.querySelectorAll('span[id*="tab_label_span_6"]')
        if (spans.length > 0) {
          const link = spans[0].closest('a')
          if (link) {
            (link as HTMLElement).click()
            return 'span-parent-link'
          }
        }
        
        // Direct switchTab call
        const windowWithSwitchTab = window as Window & { switchTab?: (tabNumber: number) => void }
        if (typeof windowWithSwitchTab.switchTab === 'function') {
          windowWithSwitchTab.switchTab(6)
          return 'switchTab-direct'
        }
        
        return false
      })
      
      if (clicked) {
        this.log('STEP-7', `Successfully clicked Updates tab using evaluate: ${clicked}`)
        await this.page.waitForTimeout(2000)
        return true
      }
      
      // Final debugging - log what tabs are actually visible
      const tabsInfo = await context.evaluate(() => {
        const topTabs = document.querySelectorAll('#newTabsTop li')
        const tabInfo = Array.from(topTabs).map(tab => ({
          id: tab.id,
          text: tab.textContent?.trim(),
          hasLink: !!tab.querySelector('a'),
          onclick: tab.querySelector('a')?.getAttribute('onclick')
        }))
        return {
          topTabsCount: topTabs.length,
          tabs: tabInfo,
          hasTab6: !!document.getElementById('tab_6'),
          url: window.location.href
        }
      })
      
      this.log('STEP-7', 'Tab inspection failed - logging available tabs', tabsInfo)
      
      return false
    } catch (error) {
      this.log('STEP-7', 'Error clicking Updates tab', { error: error instanceof Error ? error.message : 'Unknown error' })
      return false
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
        } catch {
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
      
      // Get current pages before click
      const pagesBefore = this.context!.pages()
      
      // Click the case ID link (opens in new tab)
      await clickableElement.click()
      
      // Wait for new tab to open
      this.log('STEP-6', 'Waiting for new tab to open')
      await this.page.waitForTimeout(2000)
      
      // Get all pages after click
      const pagesAfter = this.context!.pages()
      
      if (pagesAfter.length > pagesBefore.length) {
        // Switch to the new tab
        this.page = pagesAfter[pagesAfter.length - 1]
        this.log('STEP-6', 'Switched to new tab')
        
        // Wait for the new page to load
        await this.page.waitForLoadState('networkidle', { timeout: 10000 })
      } else {
        this.log('STEP-6', 'No new tab detected, continuing in current tab')
        await this.page.waitForLoadState('networkidle', { timeout: 10000 })
      }
      
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
      
      // Log URLs to understand context
      const pageUrl = this.page.url()
      const frameUrl = frame ? frame.url() : 'no frame'
      this.log('STEP-6', 'Current URLs after navigation', { pageUrl, frameUrl })
      
      // Step 7: Click Updates tab
      this.log('STEP-7', 'Looking for Updates tab')
      const updatesClicked = await this.clickUpdatesTab()
      
      if (!updatesClicked) {
        this.log('STEP-7', 'Warning: Could not click Updates tab')
      } else {
        this.log('STEP-7', 'Updates tab clicked, waiting for processing')
        // Simulate Module 2 processing time
        await this.page.waitForTimeout(5000) // Give time for updates to load/process
      }
      
      return {
        success: true,
        nextStep: NavigationStep.CASE_DETAIL,
        data: {
          url: currentUrl,
          updatesTabClicked: updatesClicked
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
          break
        }
      }
      
      processedCount++
      
      // Simulate Module 2 processing
      // In production, this would hand off to Module 2
      this.log('MULTI-CASE', `Processing updates for case ${processedCount}`)
      await this.page!.waitForTimeout(3000) // Simulate update processing time
      
      this.log('MULTI-CASE', `Case ${processedCount} processed successfully`)
      
      // Navigate back to case listing
      this.log('MULTI-CASE', 'Navigating back to case listing')
      const navResult = await this.navigateToCaseListing()
      
      if (!navResult.success) {
        this.log('MULTI-CASE', 'Failed to navigate back to listing')
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