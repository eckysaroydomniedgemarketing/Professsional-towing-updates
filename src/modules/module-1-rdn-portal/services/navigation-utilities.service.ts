import { Page } from 'playwright'

export class NavigationUtilities {
  private debug = true

  // Helper method for robust waiting with retries for slow connections
  async waitForElementRobustly(
    page: Page, 
    selector: string, 
    options: { timeout?: number; retries?: number; frame?: any } = {}
  ): Promise<boolean> {
    const { timeout = 30000, retries = 3, frame = null } = options
    const context = frame || page

    for (let i = 0; i < retries; i++) {
      try {
        this.log('NAV', `Attempt ${i + 1}/${retries} waiting for: ${selector}`)
        
        await context.waitForSelector(selector, { 
          timeout: timeout,
          state: 'visible'
        })
        
        this.log('NAV', `Successfully found element: ${selector}`)
        return true
      } catch (error) {
        this.log('NAV', `Attempt ${i + 1} failed for ${selector}`, { 
          error: error instanceof Error ? error.message : 'Unknown error',
          willRetry: i < retries - 1
        })
        
        if (i < retries - 1) {
          // Wait before retrying (progressive backoff)
          await page.waitForTimeout((i + 1) * 2000)
        }
      }
    }
    
    return false
  }

  log(step: string, message: string, data?: unknown) {
    if (this.debug) {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [RDN-${step}]`, message, data ? JSON.stringify(data, null, 2) : '')
    }
  }

  async clickUpdatesTab(page: Page): Promise<boolean> {
    try {
      this.log('NAV', 'Looking for Updates tab')
      
      const selectors = [
        'a[href*="tab=1"]:has-text("Updates")',
        'a[href*="tab=1"]',
        'a:has-text("Updates")',
        'li a:has-text("Updates")',
        'ul.nav-tabs a:has-text("Updates")'
      ]
      
      for (const selector of selectors) {
        try {
          const element = await page.$(selector)
          if (element) {
            this.log('NAV', 'Found Updates tab with selector', { selector })
            await element.click()
            await page.waitForTimeout(1000)
            this.log('NAV', 'Updates tab clicked successfully')
            return true
          }
        } catch (e) {
          this.log('NAV', 'Selector failed', { selector, error: e instanceof Error ? e.message : 'Unknown' })
        }
      }
      
      this.log('NAV', 'Updates tab not found with any selector')
      return false
    } catch (error) {
      this.log('NAV', 'Error clicking Updates tab', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return false
    }
  }
}