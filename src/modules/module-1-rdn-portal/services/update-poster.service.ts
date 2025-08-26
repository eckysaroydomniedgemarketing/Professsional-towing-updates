import { Page, Frame } from 'playwright'
import { NavigationResult } from '../types'
import { BrowserManager } from './browser-manager.service'
import { AddressMatcherService } from './address-matcher.service'

/**
 * Service for posting updates to RDN portal
 * Handles form navigation, filling, and submission
 */
export class UpdatePosterService {
  private addressMatcher: AddressMatcherService

  constructor(private browserManager: BrowserManager) {
    this.addressMatcher = new AddressMatcherService()
  }

  /**
   * Check for update form in main page and iframes
   */
  private async checkForUpdateForm(page: Page): Promise<{ exists: boolean; frame: Frame | null }> {
    // First check if we're already on the Updates tab by looking for the form or update elements
    const hasUpdateElements = await page.evaluate(() => {
      // Check for any update-related elements that indicate we're on the right page
      return !!(
        document.querySelector('#updatesForm') ||
        document.querySelector('#updates_type') ||
        document.querySelector('#is_address_update_select') ||
        document.querySelector('form[name="updatesform"]') ||
        document.querySelector('[name="comments"]')
      )
    })
    
    if (hasUpdateElements) {
      console.log('[UPDATE-POSTER] Update form/elements found in main document')
      return { exists: true, frame: null }
    }
    
    // Check all frames for update form
    const frames = page.frames()
    console.log(`[UPDATE-POSTER] Checking ${frames.length} frames for update form`)
    
    for (const frame of frames) {
      try {
        const hasFormInFrame = await frame.evaluate(() => {
          return !!(
            document.querySelector('#updatesForm') ||
            document.querySelector('#updates_type') ||
            document.querySelector('#is_address_update_select')
          )
        })
        
        if (hasFormInFrame) {
          console.log('[UPDATE-POSTER] Update form found in iframe')
          return { exists: true, frame: frame }
        }
      } catch (e) {
        // Frame might be detached or cross-origin
        continue
      }
    }
    
    return { exists: false, frame: null }
  }

  /**
   * Navigate to specific case page
   */
  private async navigateToCase(page: Page, caseId: string): Promise<void> {
    console.log(`[UPDATE-POSTER] Navigating to case ${caseId}...`)
    
    await page.goto(`https://app.recoverydatabase.net/alpha_rdn/module/default/case2/?tab=1&case_id=${caseId}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    })
    
    // Wait for navigation and page to load
    await page.waitForTimeout(3000)
    
    console.log(`[UPDATE-POSTER] Successfully navigated to case ${caseId}`)
  }

  /**
   * Navigate to Updates tab
   */
  private async navigateToUpdatesTab(targetFrame: Frame | Page): Promise<boolean> {
    console.log('[UPDATE-POSTER] Checking if on Updates tab')
    
    // Check if Updates tab is already active
    const isOnUpdatesTab = await targetFrame.evaluate(() => {
      const activeTab = document.querySelector('.nav-tabs .active, .tab-active, [aria-selected="true"]')
      return activeTab?.textContent?.toLowerCase().includes('update') || false
    })
    
    if (!isOnUpdatesTab) {
      console.log('[UPDATE-POSTER] Navigating to Updates tab')
      
      // Try multiple selectors for Updates tab
      const updatesTabClicked = await targetFrame.evaluate(() => {
        const selectors = [
          'a[href="#updates"]',
          'a[href*="updates"]',
          'button:has-text("Updates")',
          '.nav-tabs a:has-text("Updates")',
          '[data-tab="updates"]',
          'a:has-text("Updates")'
        ]
        
        for (const selector of selectors) {
          try {
            const element = document.querySelector(selector) as HTMLElement
            if (element) {
              element.click()
              return true
            }
          } catch (e) {
            continue
          }
        }
        return false
      })
      
      if (updatesTabClicked) {
        console.log('[UPDATE-POSTER] Clicked Updates tab, waiting for content to load')
        await targetFrame.page().waitForTimeout(2000)
        return true
      } else {
        console.log('[UPDATE-POSTER] Could not find Updates tab, attempting to proceed anyway')
        return false
      }
    } else {
      console.log('[UPDATE-POSTER] Already on Updates tab')
      return true
    }
  }

  /**
   * Fill and submit update form
   */
  private async fillAndSubmitForm(
    targetFrame: Frame | Page,
    addressId: string,
    draftContent: string,
    addressText?: string
  ): Promise<void> {
    // Scroll to the form section
    await targetFrame.evaluate(() => {
      const form = document.querySelector('#updatesForm') || 
                  document.querySelector('#updates_type')?.closest('form') ||
                  document.querySelector('form[name*="update"]')
      form?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    
    // Wait briefly for scroll
    await targetFrame.page().waitForTimeout(1000)
    
    // Select Type dropdown - "(O) Agent-Update" with value="36"
    await targetFrame.selectOption('#updates_type', '36')
    console.log('[UPDATE-POSTER] Selected Agent-Update type')
    
    // Find and select matching address in dropdown
    if (addressText) {
      const addressOptions = await targetFrame.evaluate(() => {
        const select = document.querySelector('#is_address_update_select') as HTMLSelectElement
        if (!select) return []
        return Array.from(select.options).map(opt => ({
          value: opt.value,
          text: opt.textContent?.trim() || ''
        }))
      })
      
      console.log(`[UPDATE-POSTER] Looking for address match for: "${addressText}"`)
      console.log(`[UPDATE-POSTER] Available options: ${addressOptions.length}`)
      
      // Use smart address matching
      const bestMatch = this.addressMatcher.findBestAddressMatch(addressText, addressOptions)
      
      if (bestMatch) {
        await targetFrame.selectOption('#is_address_update_select', bestMatch.value)
        console.log(`[UPDATE-POSTER] Selected best matching address: "${bestMatch.text}" (score: ${bestMatch.score})`)
      } else {
        // No good match found, try to use addressId as fallback
        console.log('[UPDATE-POSTER] No good address match found, trying addressId fallback')
        try {
          await targetFrame.selectOption('#is_address_update_select', addressId)
          console.log(`[UPDATE-POSTER] Selected address by ID: ${addressId}`)
        } catch (e) {
          console.error('[UPDATE-POSTER] Failed to select by addressId, selecting first option')
          // Last resort - select first non-empty option
          const firstOption = addressOptions.find((opt: any) => opt.value && opt.value !== '')
          if (firstOption) {
            await targetFrame.selectOption('#is_address_update_select', firstOption.value)
            console.log(`[UPDATE-POSTER] Selected first available address: "${firstOption.text}"`)
          }
        }
      }
    } else {
      // Use addressId directly
      await targetFrame.selectOption('#is_address_update_select', addressId)
      console.log(`[UPDATE-POSTER] Selected address by ID: ${addressId}`)
    }
    
    // Fill Details textarea with draft content
    await targetFrame.fill('#comments', draftContent)
    console.log('[UPDATE-POSTER] Filled update content')
    
    // Click Create button to submit
    await targetFrame.click('#create_button')
    console.log('[UPDATE-POSTER] Clicked create button')
    
    // Wait for submission
    await targetFrame.page().waitForTimeout(2000)
  }

  /**
   * Main method to post update to RDN portal
   */
  async postUpdate(
    addressId: string,
    draftContent: string,
    addressText?: string,
    caseId?: string
  ): Promise<NavigationResult> {
    try {
      const page = this.browserManager.getPage()
      if (!page) {
        return {
          success: false,
          error: 'No browser page available',
          nextStep: 'error' as const
        }
      }

      console.log('[UPDATE-POSTER] Starting to post update to RDN portal')
      
      // Check current URL first
      const currentUrl = page.url()
      console.log('[UPDATE-POSTER] Current URL:', currentUrl)
      
      // Check if update form is already present
      let formCheck = await this.checkForUpdateForm(page)
      console.log('[UPDATE-POSTER] Update form exists:', formCheck.exists)
      
      // Store the frame context for later use
      let targetFrame = formCheck.frame || page
      
      // Check if we're already on a case page
      const isOnCasePage = currentUrl.includes('/case') || currentUrl.includes('case_id')
      
      // Only navigate if form doesn't exist and caseId is provided
      // But skip navigation if we're already on ANY case page with the form
      if (!formCheck.exists && caseId && !isOnCasePage) {
        try {
          await this.navigateToCase(page, caseId)
          
          // Re-check for form after navigation
          formCheck = await this.checkForUpdateForm(page)
          
          if (!formCheck.exists) {
            throw new Error('Navigation completed but update form not found')
          }
          
          // Update target frame if form was found
          targetFrame = formCheck.frame || page
        } catch (navError) {
          console.error('[UPDATE-POSTER] Failed to navigate to case page:', navError)
          return {
            success: false,
            error: `Failed to navigate to case ${caseId}: ${navError instanceof Error ? navError.message : 'Unknown error'}`,
            nextStep: 'error' as const
          }
        }
      } else if (formCheck.exists) {
        console.log('[UPDATE-POSTER] Already on case page with update form, skipping navigation')
      } else if (isOnCasePage) {
        console.log('[UPDATE-POSTER] Already on a case page, will try to navigate to Updates tab')
      }
      
      // Navigate to Updates tab if not already there
      const tabNavigated = await this.navigateToUpdatesTab(targetFrame)
      
      if (tabNavigated) {
        // Re-check for form after clicking Updates tab
        formCheck = await this.checkForUpdateForm(page)
        if (formCheck.exists) {
          console.log('[UPDATE-POSTER] Update form appeared after clicking Updates tab')
          targetFrame = formCheck.frame || page
        }
      }
      
      // Wait for update form to be visible
      console.log('[UPDATE-POSTER] Waiting for update form elements')
      
      try {
        // Wait for the updates_type dropdown
        await targetFrame.waitForSelector('#updates_type', { timeout: 5000 })
        console.log('[UPDATE-POSTER] Update form found')
      } catch (e) {
        // Check if form exists with alternative selectors
        const formExists = await targetFrame.evaluate(() => {
          return !!(document.querySelector('#updates_type') || 
                   document.querySelector('#updatesForm') || 
                   document.querySelector('select[name*="update"]'))
        })
        
        if (!formExists) {
          console.error('[UPDATE-POSTER] Update form not found on page')
          return {
            success: false,
            error: 'Update form not found. Make sure you are on the Updates tab of a case.',
            nextStep: 'error' as const
          }
        }
      }
      
      // Fill and submit the form
      await this.fillAndSubmitForm(targetFrame, addressId, draftContent, addressText)
      
      return {
        success: true,
        message: 'Update posted successfully to RDN portal',
        nextStep: 'complete' as const
      }
    } catch (error) {
      console.error('[UPDATE-POSTER] Error posting update:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to post update',
        nextStep: 'error' as const
      }
    }
  }
}