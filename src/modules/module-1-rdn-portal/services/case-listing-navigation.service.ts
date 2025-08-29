import { Page, BrowserContext } from 'playwright'
import { NavigationResult, NavigationStep } from '../types'
import { NavigationUtilities } from './navigation-utilities.service'

export class CaseListingNavigationService {
  private utilities = new NavigationUtilities()
  private caseListingUrl: string | null = null

  async navigateToCaseListing(page: Page, context: BrowserContext): Promise<NavigationResult> {
    this.utilities.log('NAV', 'Starting navigation to case listing')
    try {
      const currentUrl = page.url()
      this.utilities.log('NAV', 'Current URL', { url: currentUrl })      
      // Check if we're on case detail page
      const isOnCaseDetail = currentUrl.includes('case2') || currentUrl.includes('case_id=')      
      // Try to get the mainFrame
      let frame = page.frame({ name: 'mainFrame' })      
      if (isOnCaseDetail) {
        this.utilities.log('NAV', 'Currently on case detail page, switching tabs')        
        const pages = context.pages()
        this.utilities.log('NAV', 'Current open tabs', { count: pages.length })        
        if (pages.length > 1) {
          for (const p of pages) {
            const url = p.url()
            if (url.includes('three_day_updates.php') || url.includes('mainFrame')) {
              this.utilities.log('NAV', 'Found case listing tab, switching to it')
              await p.bringToFront()              
              const targetFrame = p.frame({ name: 'mainFrame' })
              if (targetFrame) {
                const frameUrl = targetFrame.url()
                if (!frameUrl.includes('three_day_updates.php')) {
                  await targetFrame.goto('three_day_updates.php?num_of_days=3')
                  await page.waitForLoadState('networkidle', { timeout: 45000 })
                }
              }              
              const frame = page.frame({ name: 'mainFrame' })
              if (frame) {
                await frame.waitForSelector('#casestable tbody tr', { 
                  state: 'visible', 
                  timeout: 10000 
                })                
                this.utilities.log('NAV', 'Successfully returned to case listing tab')
                return {
                  success: true,
                  nextStep: NavigationStep.CASE_LISTING
                }            }            }          }        }             // Fallback: Try frame navigation
        if (frame) {
          try {
            this.utilities.log('NAV', 'Attempting frame navigation to three_day_updates.php')
            await frame.goto('three_day_updates.php?num_of_days=3')
            await page.waitForLoadState('networkidle', { timeout: 45000 })
            
            await frame.waitForSelector('#casestable tbody tr', { 
              state: 'visible', 
              timeout: 10000 
            })            
            this.utilities.log('NAV', 'Successfully navigated to case listing via frame')
            return {
              success: true,
              nextStep: NavigationStep.CASE_LISTING
            }
          } catch (e) {
            this.utilities.log('NAV', 'Frame navigation failed', { 
              error: e instanceof Error ? e.message : 'Unknown error' 
            })
          }
        }        
        throw new Error('All navigation methods from case detail failed')      }      
      // Original flow - from dashboard
      this.utilities.log('NAV', 'Looking for Case Update Needed Listing link')      
      if (!frame) {
        this.utilities.log('NAV', 'Waiting for mainFrame iframe with robust retry mechanism')
        
        // Use our robust waiting method for the iframe
        const iframeFound = await this.utilities.waitForElementRobustly(page, 'iframe[name="mainFrame"]', {
          timeout: 30000,
          retries: 3
        })
        
        if (!iframeFound) {
          // Try alternative iframe selectors
          this.utilities.log('NAV', 'Trying alternative iframe selectors')
          const alternativeSelectors = [
            'iframe[name="mainframe"]',
            'iframe#mainFrame',
            'iframe#mainframe',
            'iframe[src*="main"]',
            'iframe:first-of-type'
          ]
          
          let foundWithAlternative = false
          for (const selector of alternativeSelectors) {
            const altFound = await this.utilities.waitForElementRobustly(page, selector, {
              timeout: 15000,
              retries: 1
            })
            if (altFound) {
              this.utilities.log('NAV', `Found iframe with alternative selector: ${selector}`)
              foundWithAlternative = true
              break
            }
          }
          
          if (!foundWithAlternative) {
            throw new Error('mainFrame iframe not found after trying multiple selectors and retries - please check internet connection')
          }
        }
        
        // Additional wait for frame to be ready
        await page.waitForTimeout(3000)
        frame = page.frame({ name: 'mainFrame' })
        
        if (!frame) {
          // Try alternative frame names
          const altFrameNames = ['mainframe', 'main', 'content']
          for (const frameName of altFrameNames) {
            frame = page.frame({ name: frameName })
            if (frame) {
              this.utilities.log('NAV', `Found frame with alternative name: ${frameName}`)
              break
            }
          }
        }
        
        if (!frame) {
          throw new Error('mainFrame iframe element found but frame context not accessible - please check page structure')
        }
        
        this.utilities.log('NAV', 'mainFrame iframe successfully located and accessible')
      }      
      // Wait for the link with extended timeout and retries for slow connections
      const linkFound = await this.utilities.waitForElementRobustly(page, 'a:has-text("Case Update Needed Listing")', {
        timeout: 20000,
        retries: 3,
        frame: frame
      })
      
      if (!linkFound) {
        throw new Error('Case Update Needed Listing link not found after multiple attempts')
      }      
      this.utilities.log('NAV', 'Clicking Case Update Needed Listing')
      await frame.click('a:has-text("Case Update Needed Listing")')      
      // Wait for network to be completely idle for slow connections
      await page.waitForLoadState('networkidle', { timeout: 45000 })      
      this.utilities.log('NAV', 'Successfully navigated to case listing')      
      // Store the URL for later use
      if (frame) {
        this.caseListingUrl = frame.url()
      }      
      // Just return success - page extraction will be done after filters
      return {
        success: true,
        nextStep: NavigationStep.CASE_LISTING
      }
    } catch (error) {
      this.utilities.log('NAV', 'Failed to navigate to case listing', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return {
        success: false,
        nextStep: NavigationStep.DASHBOARD,
        error: error instanceof Error ? error.message : 'Failed to navigate to case listing'      }    }  }

  getCaseListingUrl(): string | null {
    return this.caseListingUrl
  }
}