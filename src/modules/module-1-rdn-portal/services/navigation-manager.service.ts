import { Page, BrowserContext } from 'playwright'
import { NavigationResult, NavigationStep } from '../types'
import { setPageInfo, setNavigationStep, getSelectedPage } from './workflow-state.service'
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
                }            }            }          }        }             // Fallback: Try frame navigation
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
        throw new Error('All navigation methods from case detail failed')      }      
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
      // Just return success - page extraction will be done after filters
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
        error: error instanceof Error ? error.message : 'Failed to navigate to case listing'      }    }  }
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

  async navigateToSpecificCase(page: Page, caseId: string): Promise<NavigationResult> {
    try {
      const caseUrl = `https://app.recoverydatabase.net/alpha_rdn/module/default/case2/?tab=6&case_id=${caseId}`
      
      this.log('NAV', `Navigating to specific case: ${caseId}`)
      await page.goto(caseUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Wait for case page content to load - the page loads directly with tab 6 (My Summary)
      // Just wait for the main content section that's present on the My Summary tab
      await page.waitForSelector('.section__main', { state: 'visible', timeout: 10000 })
      this.log('NAV', 'Case page loaded with My Summary tab')
      
      this.log('NAV', `Successfully navigated to case ${caseId}`)
      
      return {
        success: true,
        nextStep: NavigationStep.CASE_DETAIL,
        url: caseUrl,
        data: { caseId }
      }
    } catch (error) {
      this.log('NAV', `Failed to navigate to case ${caseId}`, { error: error.message })
      return {
        success: false,
        error: `Failed to navigate to case ${caseId}: ${error.message}`
      }
    }
  }
  async extractPageInfo(page: Page): Promise<{ totalPages: number; currentPage: number } | null> {
    try {
      const frame = page.frame({ name: 'mainFrame' })
      if (!frame) {
        this.log('NAV', 'mainFrame not found for page info extraction')
        return null
      }

      // DataTables specific selectors for pagination info
      const dataTablesInfoSelectors = [
        '.dataTables_info',
        'div[id$="_info"]',
        'div:has-text("Showing")',
        '.dataTables_wrapper .info'
      ]

      // Try DataTables info first (e.g., "Showing 1 to 25 of 625 entries")
      for (const selector of dataTablesInfoSelectors) {
        try {
          const element = await frame.$(selector)
          if (element) {
            const text = await element.textContent()
            if (text) {
              // Match "Showing X to Y of Z entries" pattern
              const match = text.match(/Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)\s+entries/i)
              if (match) {
                const startEntry = parseInt(match[1], 10)
                const endEntry = parseInt(match[2], 10)
                const totalEntries = parseInt(match[3], 10)
                const entriesPerPage = endEntry - startEntry + 1
                const totalPages = Math.ceil(totalEntries / entriesPerPage)
                const currentPage = Math.ceil(startEntry / entriesPerPage)
                
                this.log('NAV', 'DataTables pagination detected', {
                  totalEntries,
                  entriesPerPage,
                  totalPages,
                  currentPage
                })
                
                return {
                  currentPage,
                  totalPages
                }
              }
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Fallback: Look for DataTables pagination buttons
      try {
        const paginateButtons = await frame.$$('.dataTables_paginate .paginate_button:not(.previous):not(.next)')
        if (paginateButtons.length > 0) {
          // Get current active page
          const activePage = await frame.$('.dataTables_paginate .paginate_button.current')
          let currentPage = 1
          if (activePage) {
            const activeText = await activePage.textContent()
            if (activeText) {
              currentPage = parseInt(activeText, 10) || 1
            }
          }          
          this.log('NAV', 'Pagination buttons found', {
            totalPages: paginateButtons.length,
            currentPage
          })          
          return {
            currentPage,
            totalPages: paginateButtons.length
          }
        }
      } catch (e) {
        this.log('NAV', 'Error checking pagination buttons', { error: e })
      }

      this.log('NAV', 'Could not extract page info, defaulting to single page')
      return { currentPage: 1, totalPages: 1 }
    } catch (error) {
      this.log('NAV', 'Error extracting page info', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return null
    }
  }
  async navigateToSpecificPage(page: Page, pageNumber: number): Promise<NavigationResult> {
    try {
      const frame = page.frame({ name: 'mainFrame' })
      if (!frame) {
        return {
          success: false,
          nextStep: NavigationStep.ERROR,
          error: 'mainFrame not found'
        }
      }
      this.log('NAV', `Navigating to page ${pageNumber}`)
      // Hide Intercom widget if present to prevent click interference
      try {
        await page.evaluate(() => {
          const intercom = document.querySelector('.intercom-lightweight-app') as HTMLElement
          if (intercom) {
            intercom.style.display = 'none'
          }
        })
        this.log('NAV', 'Intercom widget hidden')
      } catch (e) {
        // Continue even if Intercom hiding fails
      }      // Method 1: Try direct page button click first
      try {
        const dataTablesPageButton = await frame.$(`.dataTables_paginate .paginate_button:has-text("${pageNumber}"):not(.current)`)
        if (dataTablesPageButton) {
          await dataTablesPageButton.click({ force: true }) // Force click to bypass overlays
          await page.waitForTimeout(2000)
          this.log('NAV', `Successfully navigated to page ${pageNumber} via direct button`)
          return {
            success: true,
            nextStep: NavigationStep.CASE_LISTING
          }        }      } catch (e) {
        this.log('NAV', 'Direct page button not visible or clickable')      }
      // Method 2: Progressive navigation for ellipsis pagination
      // Navigate towards target page until it becomes visible
      const currentPageInfo = await this.extractPageInfo(page)
      if (currentPageInfo && currentPageInfo.currentPage !== pageNumber) {
        const maxAttempts = Math.abs(pageNumber - currentPageInfo.currentPage) + 5
        let attempts = 0
        
        while (attempts < maxAttempts) {
          // Check if target page button is now visible
          const targetButton = await frame.$(`.dataTables_paginate .paginate_button:has-text("${pageNumber}"):not(.current)`)
          if (targetButton) {
            try {
              await targetButton.click({ force: true })
              await page.waitForTimeout(2000)
              this.log('NAV', `Successfully clicked page ${pageNumber} after progressive navigation`)
              return {
                success: true,
                nextStep: NavigationStep.CASE_LISTING
              }
            } catch (e) {
              this.log('NAV', 'Failed to click target page button')
            }
          }
          
          // Determine direction and navigate
          const current = await this.extractPageInfo(page)
          if (!current) break
          
          if (current.currentPage < pageNumber) {
            // Need to go forward
            const beforeClick = current.currentPage
            
            // Method 1: Try clicking specific page number button
            if (pageNumber <= 10) { // Only visible page numbers
              try {
                const pageButtons = await frame.$$('.dataTables_paginate .paginate_button:not(.previous):not(.next)')
                for (const btn of pageButtons) {
                  const text = await btn.textContent()
                  if (text?.trim() === pageNumber.toString()) {
                    this.log('NAV', `Clicking page ${pageNumber} button directly`)
                    await btn.click({ force: true })
                    await page.waitForTimeout(2000)
                    
                    const afterClick = await this.extractPageInfo(page)
                    if (afterClick && afterClick.currentPage === pageNumber) {
                      this.log('NAV', `Successfully jumped to page ${pageNumber}`)
                      return {
                        success: true,
                        nextStep: NavigationStep.CASE_LISTING
                      }
                    }
                  }
                }
              } catch (e) {
                this.log('NAV', 'Direct page button click failed', { error: e })
              }
            }
            
            // Method 2: Use JavaScript to click Next button in the frame context
            try {
              const moved = await frame.evaluate(() => {
                // Try to find and click the Next button using JavaScript
                const nextBtn = document.querySelector('#DataTables_Table_0_next')
                if (nextBtn && !nextBtn.classList.contains('disabled')) {
                  nextBtn.click()
                  return true
                }
                
                // Fallback: Try other Next button selectors
                const altNextBtn = document.querySelector('.dataTables_paginate .next:not(.disabled)')
                if (altNextBtn) {
                  altNextBtn.click()
                  return true
                }
                
                return false
              })
              
              if (moved) {
                await page.waitForTimeout(2000)
                const afterClick = await this.extractPageInfo(page)
                if (afterClick && afterClick.currentPage > beforeClick) {
                  this.log('NAV', `JavaScript click moved from page ${beforeClick} to ${afterClick.currentPage}`)
                } else {
                  this.log('NAV', `JavaScript click didn't change page, still on ${beforeClick}`)
                  break
                }
              } else {
                this.log('NAV', 'Could not find Next button via JavaScript')
                break
              }
            } catch (e) {
              this.log('NAV', 'JavaScript navigation failed', { error: e })
              break
            }
          } else if (current.currentPage > pageNumber) {
            // Need to go backward
            const beforeClick = current.currentPage
            
            // Method 1: Try clicking specific page number button
            if (pageNumber <= 10) { // Only visible page numbers
              try {
                const pageButtons = await frame.$$('.dataTables_paginate .paginate_button:not(.previous):not(.next)')
                for (const btn of pageButtons) {
                  const text = await btn.textContent()
                  if (text?.trim() === pageNumber.toString()) {
                    this.log('NAV', `Clicking page ${pageNumber} button directly`)
                    await btn.click({ force: true })
                    await page.waitForTimeout(2000)
                    
                    const afterClick = await this.extractPageInfo(page)
                    if (afterClick && afterClick.currentPage === pageNumber) {
                      this.log('NAV', `Successfully jumped to page ${pageNumber}`)
                      return {
                        success: true,
                        nextStep: NavigationStep.CASE_LISTING                      }                    }                  }                }              } catch (e) {                this.log('NAV', 'Direct page button click failed', { error: e })            }            }            
            // Method 2: Use JavaScript to click Previous button in the frame context
            try {
              const moved = await frame.evaluate(() => {
                // Try to find and click the Previous button using JavaScript
                const prevBtn = document.querySelector('#DataTables_Table_0_previous')
                if (prevBtn && !prevBtn.classList.contains('disabled')) {
                  prevBtn.click()
                  return true
                }                
                // Fallback: Try other Previous button selectors
                const altPrevBtn = document.querySelector('.dataTables_paginate .previous:not(.disabled)')
                if (altPrevBtn) {
                  altPrevBtn.click()
                  return true
                }                
                return false
              })              
              if (moved) {
                await page.waitForTimeout(2000)
                const afterClick = await this.extractPageInfo(page)
                if (afterClick && afterClick.currentPage < beforeClick) {
                  this.log('NAV', `JavaScript click moved from page ${beforeClick} to ${afterClick.currentPage}`)
                } else {
                  this.log('NAV', `JavaScript click didn't change page, still on ${beforeClick}`)
                  break
                }
              } else {
                this.log('NAV', 'Could not find Previous button via JavaScript')
                break
              }
            } catch (e) {
              this.log('NAV', 'JavaScript navigation failed', { error: e })
              break
            }
          } else {
            // We're on the target page
            this.log('NAV', `Already on page ${pageNumber}`)
            return {
              success: true,
              nextStep: NavigationStep.CASE_LISTING
            }          }          
          attempts++
        }      }      
      // If page 1 is requested and we're already there
      if (pageNumber === 1) {
        this.log('NAV', `Already on page 1`)
        return {
          success: true,
          nextStep: NavigationStep.CASE_LISTING
        }      }      
      this.log('NAV', `Could not navigate to page ${pageNumber}`)
      return {
        success: false,
        nextStep: NavigationStep.ERROR,
        error: `Could not navigate to page ${pageNumber}`
      }
    } catch (error) {
      this.log('NAV', 'Failed to navigate to specific page', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return {
        success: false,
        nextStep: NavigationStep.ERROR,
        error: error instanceof Error ? error.message : 'Failed to navigate to page'
      }    }  }}