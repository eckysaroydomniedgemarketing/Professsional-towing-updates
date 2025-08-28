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
        document.querySelector('form[name="updatesform"]') ||  // RDN form name
        document.querySelector('#updates_type') ||
        document.querySelector('#is_address_update_select') ||
        document.querySelector('[name="comments"]') ||
        document.querySelector('#create_button')  // The submit button
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
            document.querySelector('form[name="updatesform"]') ||
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

  // Removed navigateToCase method - no longer needed
  // We should never navigate the entire page when already on a case
  // Instead, we just switch tabs within the case page

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
      
      // Try multiple selectors for Updates tab (including RDN-specific ones)
      const updatesTabClicked = await targetFrame.evaluate(() => {
        const selectors = [
          '#tab_6 a',                    // RDN specific Updates tab ID
          '[onclick*="switchTab(6)"]',   // RDN onclick handler for tab 6
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
        // Get page object - targetFrame could be Page or Frame
        const pageObj = 'waitForTimeout' in targetFrame ? targetFrame : targetFrame.page()
        await pageObj.waitForTimeout(2000)
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
    const pageObj = 'waitForTimeout' in targetFrame ? targetFrame : targetFrame.page()
    await pageObj.waitForTimeout(1000)
    
    // Select Type dropdown - "(O) Agent-Update" with value="36"
    await targetFrame.selectOption('#updates_type', '36')
    console.log('[UPDATE-POSTER] Selected Agent-Update type')
    
    // Check if address dropdown has any options
    const addressOptions = await targetFrame.evaluate(() => {
      const select = document.querySelector('#is_address_update_select') as HTMLSelectElement
      if (!select) return []
      return Array.from(select.options).map(opt => ({
        value: opt.value,
        text: opt.textContent?.trim() || ''
      }))
    })
    
    console.log(`[UPDATE-POSTER] Address dropdown has ${addressOptions.length} options`)
    
    // Only try to select address if dropdown has options
    if (addressOptions.length > 0) {
      console.log(`[UPDATE-POSTER] Looking for address match for: "${addressText}"`)
      
      if (addressText) {
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
        try {
          await targetFrame.selectOption('#is_address_update_select', addressId)
          console.log(`[UPDATE-POSTER] Selected address by ID: ${addressId}`)
        } catch (e) {
          // If addressId selection fails, select first option
          const firstOption = addressOptions.find((opt: any) => opt.value && opt.value !== '')
          if (firstOption) {
            await targetFrame.selectOption('#is_address_update_select', firstOption.value)
            console.log(`[UPDATE-POSTER] Selected first available address as fallback`)
          }
        }
      }
    } else {
      console.log('[UPDATE-POSTER] Address dropdown is empty, skipping address selection')
    }
    
    // Fill Details textarea with draft content
    await targetFrame.fill('#comments', draftContent)
    console.log('[UPDATE-POSTER] Filled update content')
    
    // Click Create button to submit
    await targetFrame.click('#create_button')
    console.log('[UPDATE-POSTER] Clicked create button')
    
    // Wait for submission
    await pageObj.waitForTimeout(2000)
  }

  /**
   * Click protocol buttons after posting update
   */
  private async clickProtocolButtons(page: Page): Promise<void> {
    try {
      console.log('[UPDATE-POSTER] Waiting for page to refresh after update posting...')
      await page.waitForTimeout(3000)
      
      // Find the most recent update (should be the first one after refresh)
      const updateFound = await page.evaluate(() => {
        // Look for update containers - adjust selector based on actual RDN structure
        const updates = document.querySelectorAll('[id^="updatearea_"], .update-container, .case-update')
        return updates.length > 0
      })
      
      if (!updateFound) {
        console.log('[UPDATE-POSTER] No update containers found after refresh')
        return
      }
      
      // Click Transfer to Client button
      const transferClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const transferBtn = buttons.find(btn => 
          btn.className.includes('js-transfer2client') || 
          btn.textContent?.includes('Transfer to Client')
        )
        if (transferBtn) {
          (transferBtn as HTMLElement).click()
          return true
        }
        return false
      })
      
      if (transferClicked) {
        console.log('[UPDATE-POSTER] Clicked Transfer to Client button')
        await page.waitForTimeout(500)
      }
      
      // Click Client button
      const clientClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const clientBtn = buttons.find(btn => 
          btn.textContent?.trim() === 'Client' ||
          (btn.className.includes('btn-link') && btn.textContent?.includes('Client'))
        )
        if (clientBtn && !clientBtn.textContent?.includes('Transfer')) {
          (clientBtn as HTMLElement).click()
          return true
        }
        return false
      })
      
      if (clientClicked) {
        console.log('[UPDATE-POSTER] Clicked Client button')
        await page.waitForTimeout(500)
      }
      
      // Click Collector button
      const collectorClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const collectorBtn = buttons.find(btn => 
          btn.textContent?.trim() === 'Collector' ||
          btn.getAttribute('onclick')?.includes('emailSlider(\'collector\'') ||
          (btn.className.includes('btn-link') && btn.textContent?.includes('Collector'))
        )
        if (collectorBtn) {
          (collectorBtn as HTMLElement).click()
          return true
        }
        return false
      })
      
      if (collectorClicked) {
        console.log('[UPDATE-POSTER] Clicked Collector button')
        await page.waitForTimeout(500)
      }
      
      console.log('[UPDATE-POSTER] Protocol buttons clicking completed')
    } catch (error) {
      console.error('[UPDATE-POSTER] Error clicking protocol buttons:', error)
    }
  }

  /**
   * Main method to post update to RDN portal
   */
  async postUpdate(
    addressId: string,
    draftContent: string,
    addressText?: string,
    caseId?: string,
    autoClickProtocol: boolean = false
  ): Promise<NavigationResult> {
    try {
      // Always use the case page (Tab 1) for posting updates
      let casePage = this.browserManager.getCasePage()
      let page: Page
      
      if (casePage) {
        console.log('[UPDATE-POSTER] Using case detail page (Tab 1) for update posting')
        page = casePage
      } else {
        // Try to find case tab from browser context
        console.log('[UPDATE-POSTER] Case page reference lost, searching for case tab...')
        const context = this.browserManager.getContext()
        
        if (context) {
          const pages = context.pages()
          console.log(`[UPDATE-POSTER] Found ${pages.length} open tabs`)
          
          // Find the case tab (has case_id in URL)
          const caseTab = pages.find(p => {
            const url = p.url()
            const isCase = url.includes('case_id=') && (url.includes('/case') || url.includes('case2'))
            if (isCase) {
              console.log(`[UPDATE-POSTER] Found potential case tab with URL: ${url}`)
            }
            return isCase
          })
          
          if (caseTab) {
            console.log('[UPDATE-POSTER] Found case tab, setting as case page reference')
            // Bring the case tab to front
            await caseTab.bringToFront()
            console.log('[UPDATE-POSTER] Brought case tab to front')
            this.browserManager.setCasePage(caseTab)
            page = caseTab
          } else {
            // No case tab found - this is an error
            console.error('[UPDATE-POSTER] No case tab found among open tabs')
            const tabUrls = pages.map(p => p.url()).join(', ')
            console.error(`[UPDATE-POSTER] Open tab URLs: ${tabUrls}`)
            return {
              success: false,
              error: 'No case tab found. Please ensure a case is open before posting updates.',
              nextStep: 'error' as const
            }
          }
        } else {
          return {
            success: false,
            error: 'Browser context not available',
            nextStep: 'error' as const
          }
        }
      }

      console.log('[UPDATE-POSTER] Starting to post update to RDN portal')
      
      // Check current URL first
      const currentUrl = page.url()
      console.log('[UPDATE-POSTER] Current URL:', currentUrl)
      
      // Check if update form is already present
      let formCheck = await this.checkForUpdateForm(page)
      console.log('[UPDATE-POSTER] Update form exists:', formCheck.exists)
      
      // If form doesn't exist, we need to switch to Updates tab
      if (!formCheck.exists) {
        console.log('[UPDATE-POSTER] Form not found, switching to Updates tab within case page')
        
        // Navigate to Updates tab within the same case page
        const tabNavigated = await this.navigateToUpdatesTab(page)
        
        if (tabNavigated) {
          console.log('[UPDATE-POSTER] Updates tab clicked, waiting for form to appear')
          // Give time for tab content to load
          await page.waitForTimeout(2000)
          
          // Re-check for form after switching tabs
          formCheck = await this.checkForUpdateForm(page)
          
          if (formCheck.exists) {
            console.log('[UPDATE-POSTER] Update form found after switching to Updates tab')
          } else {
            console.error('[UPDATE-POSTER] Form still not found after switching tabs')
            return {
              success: false,
              error: 'Could not find update form. Make sure you are on a case page.',
              nextStep: 'error' as const
            }
          }
        } else {
          console.error('[UPDATE-POSTER] Could not navigate to Updates tab')
          return {
            success: false,
            error: 'Failed to switch to Updates tab within case page',
            nextStep: 'error' as const
          }
        }
      } else {
        console.log('[UPDATE-POSTER] Update form already visible, no tab switching needed')
      }
      
      // Store the frame context for later use
      let targetFrame = formCheck.frame || page
      
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
      
      // If auto-click protocol is enabled, click the protocol buttons after page refreshes
      if (autoClickProtocol) {
        console.log('[UPDATE-POSTER] Auto-click protocol buttons enabled')
        await this.clickProtocolButtons(page)
      }
      
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