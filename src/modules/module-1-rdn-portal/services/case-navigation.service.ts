import { NavigationStep, NavigationResult, NavigationState } from '../types'
import { BrowserManager } from './browser-manager.service'
import { NavigationManager } from './navigation-manager.service'
import extractCaseData from '@/modules/data-extraction'
import { Page } from '@playwright/test'

export class CaseNavigationService {
  constructor(
    private navigationManager: NavigationManager,
    private browserManager: BrowserManager
  ) {}

  async navigateToSpecificCase(
    state: NavigationState,
    caseId: string
  ): Promise<{ result: NavigationResult; updatedState: NavigationState }> {
    const page = this.browserManager.getPage()
    if (!page) {
      return {
        result: {
          success: false,
          nextStep: NavigationStep.ERROR,
          error: 'Browser page not available'
        },
        updatedState: state
      }
    }
    
    const result = await this.navigationManager.navigateToSpecificCase(page, caseId)
    if (result.success) {
      const updatedState = { ...state }
      updatedState.currentStep = NavigationStep.CASE_DETAIL
      updatedState.currentCaseId = caseId
      
      // Set case page reference when navigating to specific case
      this.browserManager.setCasePage(page)
      console.log(`[CASE-NAV] Set case page reference for specific case ${caseId}`)
      
      // Extract case data after navigating to the case
      console.log(`[CASE-NAV] Starting data extraction for case ${caseId}`)
      updatedState.currentStep = NavigationStep.EXTRACTING_DATA
      
      const extractionResult = await extractCaseData(caseId, page, true)
      
      if (!extractionResult.success) {
        console.error(`[CASE-NAV] Data extraction failed for case ${caseId}`)
        return {
          result: {
            success: false,
            nextStep: NavigationStep.ERROR,
            error: extractionResult.error || 'Data extraction failed'
          },
          updatedState
        }
      }
      
      console.log(`[CASE-NAV] Data extraction successful for case ${caseId}`)
      updatedState.currentStep = NavigationStep.EXTRACTION_COMPLETE
      
      return {
        result: {
          success: true,
          nextStep: NavigationStep.EXTRACTION_COMPLETE,
          data: {
            caseId: caseId,
            sessionId: extractionResult.sessionId,
            message: 'Case data extracted successfully',
            recordsInserted: extractionResult.recordsInserted
          }
        },
        updatedState
      }
    }
    return { result, updatedState: state }
  }

  async processNextCase(
    browserManager: BrowserManager,
    state: NavigationState,
    lastProcessedCaseId: string | null
  ): Promise<{ result: NavigationResult; updatedState: NavigationState; lastCaseId: string | null }> {
    const context = browserManager.getContext()
    if (!context) {
      return {
        result: {
          success: false,
          nextStep: NavigationStep.ERROR,
          error: 'Browser context not available'
        },
        updatedState: state,
        lastCaseId: lastProcessedCaseId
      }
    }
    
    try {
      console.log('[CASE-NAV] Finding next case in listing')
      
      // Get the current page (should be case listing after closing tabs)
      const pages = context.pages()
      const page = pages[0]
      
      if (!page) {
        return {
          result: {
            success: false,
            nextStep: NavigationStep.ERROR,
            error: 'No page available'
          },
          updatedState: state,
          lastCaseId: lastProcessedCaseId
        }
      }
      
      // Ensure page is in focus and loaded
      await page.bringToFront()
      await page.waitForLoadState('domcontentloaded')
      console.log('[CASE-NAV] Case listing page brought to front')
      
      // Validate we're on the correct page (not a case detail)
      const currentUrl = page.url()
      console.log(`[CASE-NAV] Current page URL: ${currentUrl}`)
      
      if (currentUrl.includes('case_id=') && !currentUrl.includes('case_listing')) {
        console.error('[CASE-NAV] ERROR: Still on case detail page, not listing page')
        return {
          result: {
            success: false,
            nextStep: NavigationStep.ERROR,
            error: 'Wrong tab selected - still on case detail page. URL: ' + currentUrl
          },
          updatedState: state,
          lastCaseId: lastProcessedCaseId
        }
      }
      
      // Get the mainFrame iframe where the case table is located
      const frame = page.frame({ name: 'mainFrame' })
      if (!frame) {
        console.log('[CASE-NAV] mainFrame not found, waiting for it')
        try {
          await page.waitForSelector('iframe[name="mainFrame"]', { timeout: 10000 })
        } catch (error) {
          console.error('[CASE-NAV] Timeout waiting for mainFrame iframe')
          console.error('[CASE-NAV] Page might be incorrect. Current URL:', currentUrl)
          return {
            result: {
              success: false,
              nextStep: NavigationStep.ERROR,
              error: `Could not find mainFrame iframe. Page URL: ${currentUrl}`
            },
            updatedState: state,
            lastCaseId: lastProcessedCaseId
          }
        }
        
        const frameRetry = page.frame({ name: 'mainFrame' })
        if (!frameRetry) {
          return {
            result: {
              success: false,
              nextStep: NavigationStep.ERROR,
              error: 'Could not access mainFrame iframe after waiting'
            },
            updatedState: state,
            lastCaseId: lastProcessedCaseId
          }
        }
      }
      
      const activeFrame = frame || page.frame({ name: 'mainFrame' })
      if (!activeFrame) {
        return {
          result: {
            success: false,
            nextStep: NavigationStep.ERROR,
            error: 'mainFrame iframe not accessible'
          },
          updatedState: state,
          lastCaseId: lastProcessedCaseId
        }
      }
      
      // Wait for case listing table inside the iframe
      await activeFrame.waitForSelector('#casestable tbody tr, table.js-datatable tbody tr', { timeout: 10000 })
      console.log('[CASE-NAV] Case table found in iframe')
      
      // Find all case links inside the iframe
      const caseLinks = await activeFrame.$$('tbody tr td:first-child a[href*="case_id="] b')
      console.log(`[CASE-NAV] Found ${caseLinks.length} cases in listing`)
      
      if (caseLinks.length === 0) {
        return {
          result: {
            success: false,
            nextStep: NavigationStep.ERROR,
            error: 'No cases available in listing'
          },
          updatedState: state,
          lastCaseId: lastProcessedCaseId
        }
      }
      
      // Find the next case to process
      let nextCaseLink = null
      let caseId = null
      
      if (lastProcessedCaseId) {
        // Find the index of the last processed case
        console.log(`[CASE-NAV] Looking for last processed case: ${lastProcessedCaseId}`)
        let foundIndex = -1
        
        for (let i = 0; i < caseLinks.length; i++) {
          const linkText = await caseLinks[i].textContent()
          if (linkText === lastProcessedCaseId) {
            foundIndex = i
            console.log(`[CASE-NAV] Found last processed case at index ${i}`)
            break
          }
        }
        
        // Get the next case after the last processed one
        if (foundIndex >= 0 && foundIndex < caseLinks.length - 1) {
          nextCaseLink = caseLinks[foundIndex + 1]
          caseId = await nextCaseLink.textContent()
          console.log(`[CASE-NAV] Clicking on next case after ${lastProcessedCaseId}: ${caseId}`)
        } else if (foundIndex === caseLinks.length - 1) {
          return {
            result: {
              success: false,
              nextStep: NavigationStep.ERROR,
              error: 'No more cases to process - reached end of list'
            },
            updatedState: state,
            lastCaseId: lastProcessedCaseId
          }
        } else {
          // If we can't find the last processed case, take the first one
          console.log(`[CASE-NAV] Could not find last processed case, selecting first case`)
          nextCaseLink = caseLinks[0]
          caseId = await nextCaseLink.textContent()
        }
      } else {
        // No last processed case, take the first one
        console.log(`[CASE-NAV] No last processed case, selecting first case`)
        nextCaseLink = caseLinks[0]
        caseId = await nextCaseLink.textContent()
      }
      
      console.log(`[CASE-NAV] Clicking on next case: ${caseId}`)
      
      // Update state to show we're processing this case
      const updatedState = { ...state }
      updatedState.currentStep = NavigationStep.PROCESSING_CASE
      updatedState.currentCaseId = caseId || undefined
      
      // Click opens in new tab
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        nextCaseLink.click()
      ])
      
      // Switch to new tab and wait for it to load
      await newPage.waitForLoadState('domcontentloaded')
      
      // Update browser manager's page references
      browserManager.setPage(newPage)
      browserManager.setCasePage(newPage)  // Track this as the case detail page
      console.log(`[CASE-NAV] Set case page reference for case ${caseId}`)
      
      // Extract data for the new case
      if (caseId) {
        console.log(`[CASE-NAV] Starting data extraction for case ${caseId}`)
        
        // Update state to show we're extracting data
        updatedState.currentStep = NavigationStep.EXTRACTING_DATA
        
        // Extract data starting from My Summary tab (we just opened the case)
        // The extraction function will handle navigating to Updates tab
        const extractionResult = await extractCaseData(caseId, newPage, true)
        
        if (!extractionResult.success) {
          console.error(`[CASE-NAV] Data extraction failed for case ${caseId}`)
          return {
            result: {
              success: false,
              nextStep: NavigationStep.ERROR,
              error: extractionResult.error || 'Data extraction failed'
            },
            updatedState,
            lastCaseId: lastProcessedCaseId
          }
        }
        
        console.log(`[CASE-NAV] Data extraction successful for case ${caseId}`)
        updatedState.currentStep = NavigationStep.EXTRACTION_COMPLETE
        
        // Store the last processed case ID for next iteration
        const newLastCaseId = caseId
        console.log(`[CASE-NAV] Stored last processed case ID: ${newLastCaseId}`)
        
        return {
          result: {
            success: true,
            nextStep: NavigationStep.EXTRACTION_COMPLETE,
            data: {
              caseId: caseId,
              sessionId: extractionResult.sessionId,
              message: 'Case data extracted successfully',
              recordsInserted: extractionResult.recordsInserted
            }
          },
          updatedState,
          lastCaseId: newLastCaseId
        }
      }
      
      updatedState.currentStep = NavigationStep.CASE_DETAIL
      
      return {
        result: {
          success: true,
          nextStep: NavigationStep.CASE_DETAIL,
          data: {
            caseId: caseId || ''
          }
        },
        updatedState,
        lastCaseId: caseId
      }
    } catch (error) {
      return {
        result: {
          success: false,
          nextStep: NavigationStep.ERROR,
          error: error instanceof Error ? error.message : 'Failed to process next case'
        },
        updatedState: state,
        lastCaseId: lastProcessedCaseId
      }
    }
  }
}