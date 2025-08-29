import { Page, BrowserContext } from 'playwright'
import { NavigationResult, NavigationStep } from '../types'
import { NavigationUtilities } from './navigation-utilities.service'
import { AuthenticationHandlerService } from './authentication-handler.service'
import { CaseListingNavigationService } from './case-listing-navigation.service'

export class CaseDetailNavigationService {
  private utilities = new NavigationUtilities()
  private authHandler = new AuthenticationHandlerService()
  private caseListingNav = new CaseListingNavigationService()

  async navigateToSpecificCase(page: Page, caseId: string, isDirectNavigation: boolean = true): Promise<NavigationResult> {
    try {
      const caseUrl = `https://app.recoverydatabase.net/alpha_rdn/module/default/case2/?tab=6&case_id=${caseId}`
      
      this.utilities.log('NAV', `Navigating to specific case: ${caseId}`)
      await page.goto(caseUrl, { 
        waitUntil: 'networkidle',
        timeout: 60000
      })
      
      // Check where we actually landed after navigation
      const currentUrl = page.url()
      this.utilities.log('NAV', 'Navigation completed', { 
        expectedUrl: caseUrl,
        actualUrl: currentUrl 
      })
      
      // Handle different URL scenarios
      if (currentUrl.includes('case2') && currentUrl.includes(caseId)) {
        // SUCCESS: We're on the case page
        this.utilities.log('NAV', 'Successfully reached case page, waiting for content')
        const contentLoaded = await this.utilities.waitForElementRobustly(page, '.section__main', {
          timeout: 30000,
          retries: 1
        })
        
        if (!contentLoaded) {
          throw new Error('Case page loaded but content elements not found')
        }
        this.utilities.log('NAV', 'Case page content loaded successfully')
        
      } else if (currentUrl.includes('main_frame.php')) {
        // REDIRECT: We're on dashboard - choose strategy based on context
        if (isDirectNavigation) {
          this.utilities.log('NAV', 'Redirected to dashboard, retrying direct case navigation')
          return await this.retryDirectCaseNavigation(page, caseId)
        } else {
          this.utilities.log('NAV', 'Redirected to dashboard, using fallback navigation')
          return await this.fallbackToCaseListingNavigation(page, caseId)
        }
        
      } else if (currentUrl.includes('/public/twofactor')) {
        // 2FA REQUIRED: Wait for user to enter OTP
        this.utilities.log('NAV', 'Two-Factor Authentication required - waiting for user OTP input')
        await this.authHandler.handleTwoFactorAuth(page, caseId, isDirectNavigation)
        
      } else if (currentUrl.includes('login')) {
        // SESSION EXPIRED: Need to re-authenticate
        throw new Error('Session expired - redirected to login page')
        
      } else {
        // UNKNOWN: Log and try to continue
        this.utilities.log('NAV', 'Unexpected redirect', { url: currentUrl })
        throw new Error(`Unexpected navigation result: ${currentUrl}`)
      }
      
      this.utilities.log('NAV', `Successfully navigated to case ${caseId}`)
      
      return {
        success: true,
        nextStep: NavigationStep.CASE_DETAIL,
        url: caseUrl,
        data: { caseId }
      }
    } catch (error) {
      this.utilities.log('NAV', `Failed to navigate to case ${caseId}`, { error: error.message })
      return {
        success: false,
        error: `Failed to navigate to case ${caseId}: ${error.message}`
      }
    }
  }

  private async fallbackToCaseListingNavigation(page: Page, caseId: string): Promise<NavigationResult> {
    try {
      this.utilities.log('NAV', `Using fallback navigation for case ${caseId}`)
      
      // We're on dashboard, navigate to case listing
      const caseListingResult = await this.navigateToCaseListing(page, { pages: [] } as BrowserContext)
      if (!caseListingResult.success) {
        throw new Error('Failed to navigate to case listing from dashboard')
      }
      
      // Wait for case listing to load
      await page.waitForTimeout(3000)
      
      // Look for the specific case in the listing
      const frame = page.frame({ name: 'mainFrame' })
      if (!frame) {
        throw new Error('mainFrame not found for case search')
      }
      
      // Try to find case in current page
      const caseLink = await frame.$(`a[href*="case_id=${caseId}"]`)
      if (caseLink) {
        this.utilities.log('NAV', `Found case ${caseId} in listing, clicking`)
        await caseLink.click()
        await page.waitForTimeout(3000)
        
        // Verify we're on the case page
        const finalUrl = page.url()
        if (finalUrl.includes('case2') && finalUrl.includes(caseId)) {
          const contentLoaded = await this.utilities.waitForElementRobustly(page, '.section__main', {
            timeout: 30000,
            retries: 1
          })
          
          if (contentLoaded) {
            this.utilities.log('NAV', `Fallback navigation successful for case ${caseId}`)
            return {
              success: true,
              nextStep: NavigationStep.CASE_DETAIL,
              url: finalUrl,
              data: { caseId }
            }
          }
        }
      }
      
      throw new Error(`Case ${caseId} not found in current listing page`)
      
    } catch (error) {
      this.utilities.log('NAV', `Fallback navigation failed for case ${caseId}`, { error: error.message })
      throw error
    }
  }

  private async retryDirectCaseNavigation(page: Page, caseId: string): Promise<NavigationResult> {
    try {
      this.utilities.log('NAV', `Retrying direct navigation for case ${caseId}`)
      
      // Wait a moment for session to stabilize after redirect
      await page.waitForTimeout(2000)
      
      const caseUrl = `https://app.recoverydatabase.net/alpha_rdn/module/default/case2/?tab=6&case_id=${caseId}`
      
      await page.goto(caseUrl, { 
        waitUntil: 'networkidle',
        timeout: 60000
      })
      
      const currentUrl = page.url()
      this.utilities.log('NAV', 'Retry navigation result', { 
        expectedUrl: caseUrl,
        actualUrl: currentUrl 
      })
      
      if (currentUrl.includes('case2') && currentUrl.includes(caseId)) {
        const contentLoaded = await this.utilities.waitForElementRobustly(page, '.section__main', {
          timeout: 30000,
          retries: 1
        })
        
        if (contentLoaded) {
          this.utilities.log('NAV', `Direct navigation retry successful for case ${caseId}`)
          return {
            success: true,
            nextStep: NavigationStep.CASE_DETAIL,
            url: caseUrl,
            data: { caseId }
          }
        }
      }
      
      throw new Error(`Direct navigation retry failed for case ${caseId}`)
      
    } catch (error) {
      this.utilities.log('NAV', `Direct navigation retry failed for case ${caseId}`, { error: error.message })
      throw error
    }
  }

  // Delegate to case listing navigation service
  private async navigateToCaseListing(page: Page, context: BrowserContext): Promise<NavigationResult> {
    return await this.caseListingNav.navigateToCaseListing(page, context)
  }
}