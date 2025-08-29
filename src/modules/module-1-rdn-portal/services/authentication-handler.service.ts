import { Page } from 'playwright'
import { NavigationUtilities } from './navigation-utilities.service'

export class AuthenticationHandlerService {
  private utilities = new NavigationUtilities()

  async handleTwoFactorAuth(page: Page, caseId: string, isDirectNavigation: boolean = true): Promise<void> {
    try {
      this.utilities.log('NAV', 'Waiting for user to complete Two-Factor Authentication (2 minutes timeout)')
      
      const startTime = Date.now()
      const timeout = 2 * 60 * 1000 // 2 minutes in milliseconds
      
      // Poll URL every 2 seconds to check if 2FA is completed
      while (Date.now() - startTime < timeout) {
        await page.waitForTimeout(2000) // Check every 2 seconds
        
        const currentUrl = page.url()
        
        // Check if we've moved away from 2FA page
        if (!currentUrl.includes('/public/twofactor')) {
          this.utilities.log('NAV', '2FA completed successfully', { newUrl: currentUrl })
          
          // Now retry the case navigation based on context
          if (currentUrl.includes('main_frame.php')) {
            // Landed on dashboard - choose strategy based on context
            if (isDirectNavigation) {
              this.utilities.log('NAV', 'After 2FA: On dashboard, retrying direct case navigation')
              await this.retryDirectCaseNavigation(page, caseId)
              return
            } else {
              this.utilities.log('NAV', 'After 2FA: On dashboard, using fallback navigation')
              await this.fallbackToCaseListingNavigation(page, caseId)
              return
            }
          } else {
            // Try direct case navigation again
            this.utilities.log('NAV', 'After 2FA: Attempting direct case navigation')
            const caseUrl = `https://app.recoverydatabase.net/alpha_rdn/module/default/case2/?tab=6&case_id=${caseId}`
            await page.goto(caseUrl, { waitUntil: 'networkidle', timeout: 30000 })
            
            const finalUrl = page.url()
            if (finalUrl.includes('case2') && finalUrl.includes(caseId)) {
              // Success - wait for case content
              const contentLoaded = await this.utilities.waitForElementRobustly(page, '.section__main', {
                timeout: 30000,
                retries: 1
              })
              
              if (!contentLoaded) {
                throw new Error('Case page loaded but content elements not found after 2FA')
              }
              
              this.utilities.log('NAV', 'Successfully navigated to case after 2FA completion')
              return
            } else {
              // Still redirected - choose strategy based on context
              if (isDirectNavigation) {
                await this.retryDirectCaseNavigation(page, caseId)
              } else {
                await this.fallbackToCaseListingNavigation(page, caseId)
              }
              return
            }
          }
        }
        
        // Log progress every 30 seconds
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        if (elapsed > 0 && elapsed % 30 === 0) {
          const remaining = Math.floor((timeout - (Date.now() - startTime)) / 1000)
          this.utilities.log('NAV', `Still waiting for 2FA completion... ${remaining}s remaining`)
        }
      }
      
      // Timeout reached
      this.utilities.log('NAV', '2FA timeout reached - user did not complete authentication in 2 minutes')
      throw new Error('Two-Factor Authentication timeout - please complete 2FA within 2 minutes')
      
    } catch (error) {
      this.utilities.log('NAV', '2FA handling failed', { error: error.message })
      throw error
    }
  }

  private async retryDirectCaseNavigation(page: Page, caseId: string): Promise<void> {
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
          return
        }
      }
      
      throw new Error(`Direct navigation retry failed for case ${caseId}`)
      
    } catch (error) {
      this.utilities.log('NAV', `Direct navigation retry failed for case ${caseId}`, { error: error.message })
      throw error
    }
  }

  private async fallbackToCaseListingNavigation(page: Page, caseId: string): Promise<void> {
    // Note: This creates a circular dependency issue. 
    // In practice, this should be handled by the parent navigation coordinator
    // or passed as a callback function to avoid tight coupling.
    throw new Error('Fallback case listing navigation should be coordinated by the parent NavigationManager')
  }
}