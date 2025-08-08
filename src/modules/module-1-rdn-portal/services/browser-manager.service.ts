import { chromium, Browser, Page, BrowserContext } from 'playwright'

export class BrowserManager {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null
  private debug = true
  private initializationComplete = false

  constructor() {}

  private log(step: string, message: string, data?: unknown) {
    if (this.debug) {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [RDN-${step}]`, message, data ? JSON.stringify(data, null, 2) : '')
    }
  }

  async initialize(): Promise<void> {
    try {
      this.log('BROWSER', 'Starting browser initialization')
      
      this.browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--start-maximized', '--start-fullscreen']
      })
      
      if (!this.browser) {
        throw new Error('Failed to launch browser')
      }
      this.log('BROWSER', 'Browser launched')
      
      this.context = await this.browser.newContext({
        viewport: null,
        screen: { width: 1920, height: 1080 }
      })
      
      if (!this.context) {
        throw new Error('Failed to create browser context')
      }
      this.log('BROWSER', 'Context created')
      
      this.page = await this.context.newPage()
      
      if (!this.page) {
        throw new Error('Failed to create page')
      }
      
      // Verify page is ready
      await this.page.waitForLoadState('domcontentloaded')
      
      this.initializationComplete = true
      this.log('BROWSER', 'Browser initialized successfully', {
        hasPage: !!this.page,
        hasContext: !!this.context,
        hasBrowser: !!this.browser,
        pageUrl: this.page.url()
      })
    } catch (error) {
      this.log('BROWSER', 'Failed to initialize browser', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  getPage(): Page | null {
    if (!this.page) {
      this.log('BROWSER', 'getPage called but page is null', {
        hasPage: !!this.page,
        hasContext: !!this.context,
        hasBrowser: !!this.browser
      })
    }
    return this.page
  }

  getContext(): BrowserContext | null {
    return this.context
  }

  getBrowser(): Browser | null {
    return this.browser
  }

  setPage(page: Page): void {
    this.page = page
    this.log('BROWSER', 'Page reference updated', { hasPage: !!page })
  }

  async getCurrentUrl(): Promise<string | null> {
    if (!this.page) return null
    return this.page.url()
  }

  async takeScreenshot(filename: string): Promise<void> {
    if (!this.page) {
      this.log('SCREENSHOT', 'No page available for screenshot')
      return
    }

    try {
      await this.page.screenshot({ path: filename, fullPage: true })
      this.log('SCREENSHOT', 'Screenshot saved', { filename })
    } catch (error) {
      this.log('SCREENSHOT', 'Failed to take screenshot', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  async waitForPageLoad(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized')
    await this.page.waitForLoadState('networkidle')
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.context = null
      this.page = null
      this.log('BROWSER', 'Browser closed successfully')
    }
  }

  isInitialized(): boolean {
    const initialized = this.browser !== null && this.context !== null && this.page !== null && this.initializationComplete
    if (!initialized) {
      this.log('BROWSER', 'isInitialized check', {
        hasBrowser: !!this.browser,
        hasContext: !!this.context,
        hasPage: !!this.page,
        initComplete: this.initializationComplete
      })
    }
    return initialized
  }
}