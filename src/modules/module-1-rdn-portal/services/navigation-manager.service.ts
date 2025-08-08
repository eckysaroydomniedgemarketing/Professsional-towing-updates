import { Page, BrowserContext } from 'playwright'
import { NavigationResult, NavigationStep } from '../types'

export class NavigationManager {
  private debug = true
  private caseListingUrl: string | null = null

  constructor() {}

  private log(step: string, message: string, data?: unknown) {
    if (this.debug) {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [RDN-${step}]`, message, data ? JSON.stringify(data, null, 2) : '')
    }
  }

  async navigateToDashboard(page: Page): Promise<NavigationResult> {
    this.log('NAV', 'Starting navigation to dashboard')
    try {
      await page.waitForSelector('iframe[name="mainFrame"]', { timeout: 10000 })
      
      this.log('NAV', 'Dashboard loaded successfully')
      
      return {
        success: true,
        nextStep: NavigationStep.DASHBOARD
      }
    } catch (error) {
      this.log('NAV', 'Failed to navigate to dashboard', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return {
        success: false,
        nextStep: NavigationStep.ERROR,
        error: error instanceof Error ? error.message : 'Failed to navigate to dashboard'
      }
    }
  }

  async navigateToCaseListing(page: Page, context: BrowserContext): Promise<NavigationResult> {
    this.log('NAV', 'Starting navigation to case listing')
    try {
      const currentUrl = page.url()
      this.log('NAV', 'Current URL', { url: currentUrl })
      
      // Check if we're on case detail page
      const isOnCaseDetail = currentUrl.includes('case2') || currentUrl.includes('case_id=')
      
      // Try to get the mainFrame
      let frame = page.frame({ name: 'mainFrame' })
      
      if (isOnCaseDetail) {
        this.log('NAV', 'Currently on case detail page, switching tabs')
        
        const pages = context.pages()
        this.log('NAV', 'Current open tabs', { count: pages.length })
        
        if (pages.length > 1) {
          for (const p of pages) {
            const url = p.url()
            if (url.includes('three_day_updates.php') || url.includes('mainFrame')) {
              this.log('NAV', 'Found case listing tab, switching to it')
              await p.bringToFront()
              
              const targetFrame = p.frame({ name: 'mainFrame' })
              if (targetFrame) {
                const frameUrl = targetFrame.url()
                if (!frameUrl.includes('three_day_updates.php')) {
                  await targetFrame.goto('three_day_updates.php?num_of_days=3')
                  await page.waitForLoadState('networkidle')
                }
              }
              
              const frame = page.frame({ name: 'mainFrame' })
              if (frame) {
                await frame.waitForSelector('#casestable tbody tr', { 
                  state: 'visible', 
                  timeout: 10000 
                })
                
                this.log('NAV', 'Successfully returned to case listing tab')
                return {
                  success: true,
                  nextStep: NavigationStep.CASE_LISTING
                }
              }
            }
          }
        }
        
        // Fallback: Try frame navigation
        if (frame) {
          try {
            this.log('NAV', 'Attempting frame navigation to three_day_updates.php')
            await frame.goto('three_day_updates.php?num_of_days=3')
            await page.waitForLoadState('networkidle')
            
            await frame.waitForSelector('#casestable tbody tr', { 
              state: 'visible', 
              timeout: 10000 
            })
            
            this.log('NAV', 'Successfully navigated to case listing via frame')
            return {
              success: true,
              nextStep: NavigationStep.CASE_LISTING
            }
          } catch (e) {
            this.log('NAV', 'Frame navigation failed', { 
              error: e instanceof Error ? e.message : 'Unknown error' 
            })
          }
        }
        
        throw new Error('All navigation methods from case detail failed')
      }
      
      // Original flow - from dashboard
      this.log('NAV', 'Looking for Case Update Needed Listing link')
      
      if (!frame) {
        this.log('NAV', 'Waiting for mainFrame iframe')
        await page.waitForSelector('iframe[name="mainFrame"]')
        frame = page.frame({ name: 'mainFrame' })
        
        if (!frame) {
          throw new Error('mainFrame iframe not found')
        }
      }
      
      await frame.waitForSelector('a:has-text("Case Update Needed Listing")', { timeout: 5000 })
      
      this.log('NAV', 'Clicking Case Update Needed Listing')
      await frame.click('a:has-text("Case Update Needed Listing")')
      
      await page.waitForLoadState('networkidle')
      
      this.log('NAV', 'Successfully navigated to case listing')
      
      // Store the URL for later use
      if (frame) {
        this.caseListingUrl = frame.url()
      }
      
      return {
        success: true,
        nextStep: NavigationStep.CASE_LISTING
      }
    } catch (error) {
      this.log('NAV', 'Failed to navigate to case listing', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return {
        success: false,
        nextStep: NavigationStep.DASHBOARD,
        error: error instanceof Error ? error.message : 'Failed to navigate to case listing'
      }
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

  getCaseListingUrl(): string | null {
    return this.caseListingUrl
  }
}