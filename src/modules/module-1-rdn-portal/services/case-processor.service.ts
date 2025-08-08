import { Page, BrowserContext, Frame } from 'playwright'
import { CaseListingFilters, NavigationResult, NavigationStep } from '../types'
import { waitForIframe } from '../utils/iframe-helpers'
import extractCaseData from '@/modules/data-extraction'

export class CaseProcessor {
  private debug = true

  constructor() {}

  private log(step: string, message: string, data?: unknown) {
    if (this.debug) {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [RDN-${step}]`, message, data ? JSON.stringify(data, null, 2) : '')
    }
  }

  async configureFilters(page: Page, filters: CaseListingFilters): Promise<NavigationResult> {
    this.log('FILTER', 'Starting filter configuration')
    try {
      const frame = await waitForIframe(page, 'mainFrame', 5000)
      if (!frame) throw new Error('Frame not found')

      // Apply case worker filter
      if (filters.caseWorker !== undefined) {
        this.log('FILTER', 'Applying case worker filter', { caseWorker: filters.caseWorker })
        await this.applyFilterSelection(page, frame, filters.caseWorker)
      }

      // Set entries per page
      if (filters.entriesPerPage) {
        this.log('FILTER', 'Setting entries per page', { entries: filters.entriesPerPage })
        await this.setEntriesPerPage(page, filters.entriesPerPage)
      }

      // Apply sorting
      if (filters.sortByLastUpdate) {
        this.log('FILTER', 'Applying sort by last update')
        await this.applySortByLastUpdate(page)
      }

      this.log('FILTER', 'Filter configuration completed successfully')
      return {
        success: true,
        nextStep: NavigationStep.CASE_LISTING
      }
    } catch (error) {
      this.log('FILTER', 'Failed to configure filters', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return {
        success: false,
        nextStep: NavigationStep.CASE_LISTING,
        error: error instanceof Error ? error.message : 'Failed to configure filters'
      }
    }
  }

  private async applyFilterSelection(page: Page, frame: Frame, caseWorker: string): Promise<void> {
    await frame.waitForSelector('select[name="case_worker"]', { timeout: 5000 })
    
    const currentValue = await frame.$eval('select[name="case_worker"]', 
      (el: unknown) => (el as HTMLSelectElement).value
    )
    this.log('FILTER', 'Current case worker selection', { value: currentValue })
    
    await frame.selectOption('select[name="case_worker"]', caseWorker)
    
    const selectedValue = await frame.$eval('select[name="case_worker"]', 
      (el: unknown) => (el as HTMLSelectElement).value
    )
    if (selectedValue !== caseWorker) {
      throw new Error(`Failed to select case worker: expected "${caseWorker}", got "${selectedValue}"`)
    }
    
    const updateButton = await frame.$('input[type="submit"][value="Update"]')
    if (!updateButton) throw new Error('Update button not found')
    
    await updateButton.click()
    
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 15000, waitUntil: 'networkidle' }),
        page.waitForLoadState('networkidle', { timeout: 15000 })
      ])
    } catch {
      this.log('FILTER', 'Wait strategies timed out')
    }
    
    const currentUrl = page.url()
    if (currentUrl.includes('login')) {
      throw new Error('Session expired - redirected to login')
    }
    
    await page.waitForTimeout(2000)
  }

  private async setEntriesPerPage(page: Page, entriesPerPage: number): Promise<void> {
    const frame = await waitForIframe(page, 'mainFrame', 5000)
    if (!frame) throw new Error('Frame not found for entries dropdown')
    
    // Try multiple possible selectors for the entries dropdown
    const selectors = [
      'select[name="casestable_length"]',
      'select[name="DataTables_Table_0_length"]',
      'select[name="length"][aria-controls="casestable"]',
      'select[name="case_table_length"]'
    ]
    
    let found = false
    for (const selector of selectors) {
      try {
        await frame.waitForSelector(selector, { timeout: 2000 })
        await frame.selectOption(selector, entriesPerPage.toString())
        this.log('FILTER', 'Set entries per page using selector', { selector, entries: entriesPerPage })
        found = true
        break
      } catch {
        // Try next selector
        this.log('FILTER', 'Selector not found, trying next', { selector })
      }
    }
    
    if (!found) {
      throw new Error('Could not find entries per page dropdown with any known selector')
    }
    
    await page.waitForTimeout(1000)
  }

  private async applySortByLastUpdate(page: Page): Promise<void> {
    const frame = await waitForIframe(page, 'mainFrame', 5000)
    if (!frame) throw new Error('Frame not found for sorting')
    
    const headers = await frame.$$('table#casestable thead tr th')
    
    for (const [index, header] of headers.entries()) {
      const text = await header.textContent()
      if (text && text.toLowerCase().includes('last update')) {
        this.log('FILTER', 'Found Last Update column', { index, text })
        await header.click()
        await page.waitForTimeout(2000)
        
        const sortIndicator = await header.$('.sorting_desc, .sorting_asc')
        if (sortIndicator) {
          const className = await sortIndicator.getAttribute('class')
          if (className && className.includes('sorting_asc')) {
            this.log('FILTER', 'Clicking again for descending sort')
            await header.click()
            await page.waitForTimeout(2000)
          }
        }
        return
      }
    }
    
    this.log('FILTER', 'Warning: Could not find Last Update column to sort')
  }

  async openCaseDetail(page: Page, context: BrowserContext): Promise<NavigationResult> {
    this.log('CASE', 'Starting case detail opening')
    try {
      await page.waitForLoadState('networkidle')
      const frame = page.frame({ name: 'mainFrame' })
      
      if (!frame) {
        throw new Error('mainFrame iframe not found')
      }
      
      // Wait for case table
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
          this.log('CASE', 'Table found with selector', { selector })
          break
        } catch {
          this.log('CASE', 'Selector not found, trying next', { selector })
        }
      }
      
      if (!tableSelector) {
        throw new Error('Could not find case table with any selector')
      }
      
      const rowCount = await frame.$$eval(tableSelector, rows => rows.length)
      this.log('CASE', 'Case table loaded', { rowCount })
      
      // Find case ID link
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
          this.log('CASE', 'Case ID link found with selector', { selector })
          break
        }
      }
      
      if (!clickableElement) {
        this.log('CASE', 'No case ID link found in table')
        return {
          success: false,
          nextStep: NavigationStep.CASE_LISTING,
          error: 'No cases found in the table'
        }
      }
      
      const pagesBefore = context.pages()
      
      // Click case ID link
      await clickableElement.click()
      
      this.log('CASE', 'Waiting for new tab')
      await page.waitForTimeout(2000)
      
      const pagesAfter = context.pages()
      let targetPage = page
      
      if (pagesAfter.length > pagesBefore.length) {
        targetPage = pagesAfter[pagesAfter.length - 1]
        this.log('CASE', 'Switched to new tab')
        await targetPage.waitForLoadState('domcontentloaded')
        await targetPage.waitForSelector('#tab_6, [onclick*="switchTab(6)"]', { state: 'visible' })
      } else {
        this.log('CASE', 'No new tab detected')
        await page.waitForLoadState('domcontentloaded')
        await page.waitForSelector('#tab_6, [onclick*="switchTab(6)"]', { state: 'visible' })
      }
      
      const currentUrl = targetPage.url()
      this.log('CASE', 'Navigation complete', { url: currentUrl })
      
      return {
        success: true,
        nextStep: NavigationStep.CASE_DETAIL,
        data: {
          url: currentUrl,
          page: targetPage
        }
      }
    } catch (error) {
      this.log('CASE', 'Failed to open case detail', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return {
        success: false,
        nextStep: NavigationStep.CASE_LISTING,
        error: error instanceof Error ? error.message : 'Failed to open case detail'
      }
    }
  }

  async processMultipleCases(
    page: Page, 
    context: BrowserContext,
    maxCases: number,
    navigationManager: { navigateToCaseListing: (page: Page, context: BrowserContext) => Promise<NavigationResult>, clickUpdatesTab: (page: Page) => Promise<boolean> }
  ): Promise<NavigationResult> {
    this.log('MULTI', 'Starting multi-case processing', { maxCases })
    
    let processedCount = 0
    let currentCaseId: string | null = null
    
    for (let i = 0; i < maxCases; i++) {
      this.log('MULTI', `Processing case ${i + 1} of ${maxCases}`)
      
      const caseResult = await this.openCaseDetail(page, context)
      
      if (!caseResult.success) {
        if (caseResult.error?.includes('No cases found')) {
          this.log('MULTI', 'No more cases to process')
          break
        } else {
          this.log('MULTI', 'Error opening case, retrying navigation')
          await navigationManager.navigateToCaseListing(page, context)
          continue
        }
      }
      
      // Get the case detail page
      const casePage = caseResult.data?.page || page
      
      // Click Updates tab
      const updatesClicked = await navigationManager.clickUpdatesTab(casePage)
      if (updatesClicked) {
        this.log('MULTI', 'Updates tab clicked, processing')
        
        // Extract case ID from URL
        const currentUrl = casePage.url()
        const caseIdMatch = currentUrl.match(/case_id=(\d+)/)
        const caseId = caseIdMatch ? caseIdMatch[1] : null
        currentCaseId = caseId // Track the current case ID
        
        if (caseId) {
          this.log('MULTI', 'Starting data extraction', { caseId })
          
          // Update status to EXTRACTING_DATA (this would normally be sent to frontend)
          this.log('STATUS', 'Setting status to EXTRACTING_DATA')
          
          // Call Module 2 to extract data
          try {
            const extractionResult = await extractCaseData(caseId, casePage)
            
            if (extractionResult.success) {
              this.log('MULTI', 'Data extraction successful', { 
                caseId: extractionResult.caseId,
                recordsInserted: extractionResult.recordsInserted 
              })
              
              // Update status to EXTRACTION_COMPLETE
              this.log('STATUS', 'Setting status to EXTRACTION_COMPLETE')
            } else {
              this.log('MULTI', 'Data extraction failed', { 
                caseId: extractionResult.caseId,
                error: extractionResult.error 
              })
            }
          } catch (error) {
            this.log('MULTI', 'Error during extraction', { 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
          }
        } else {
          this.log('MULTI', 'Could not extract case ID from URL', { url: currentUrl })
        }
        
        // Wait a bit before moving to next case
        await casePage.waitForTimeout(2000)
      }
      
      processedCount++
      
      // Comment out navigation back to case listing for Module 3 integration
      // this.log('MULTI', 'Navigating back to case listing')
      // const navResult = await navigationManager.navigateToCaseListing(page, context)
      
      // if (!navResult.success) {
      //   this.log('MULTI', 'Failed to return to case listing')
      //   break
      // }
      
      // await page.waitForTimeout(2000)
    }
    
    this.log('MULTI', 'Multi-case processing completed', { processedCount })
    
    return {
      success: true,
      nextStep: NavigationStep.CASE_DETAIL,
      data: {
        processedCount,
        message: `Processed ${processedCount} cases successfully`,
        caseId: currentCaseId // Include the case ID in return data
      }
    }
  }
}