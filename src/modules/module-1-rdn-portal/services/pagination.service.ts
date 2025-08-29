import { Page } from 'playwright'
import { NavigationResult, NavigationStep } from '../types'
import { NavigationUtilities } from './navigation-utilities.service'

export class PaginationService {
  private utilities = new NavigationUtilities()

  async extractPageInfo(page: Page): Promise<{ totalPages: number; currentPage: number } | null> {
    try {
      const frame = page.frame({ name: 'mainFrame' })
      if (!frame) {
        this.utilities.log('NAV', 'mainFrame not found for page info extraction')
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
                
                this.utilities.log('NAV', 'DataTables pagination detected', {
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
          this.utilities.log('NAV', 'Pagination buttons found', {
            totalPages: paginateButtons.length,
            currentPage
          })          
          return {
            currentPage,
            totalPages: paginateButtons.length
          }
        }
      } catch (e) {
        this.utilities.log('NAV', 'Error checking pagination buttons', { error: e })
      }

      this.utilities.log('NAV', 'Could not extract page info, defaulting to single page')
      return { currentPage: 1, totalPages: 1 }
    } catch (error) {
      this.utilities.log('NAV', 'Error extracting page info', { 
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
      this.utilities.log('NAV', `Navigating to page ${pageNumber}`)
      // Hide Intercom widget if present to prevent click interference
      try {
        await page.evaluate(() => {
          const intercom = document.querySelector('.intercom-lightweight-app') as HTMLElement
          if (intercom) {
            intercom.style.display = 'none'
          }
        })
        this.utilities.log('NAV', 'Intercom widget hidden')
      } catch (e) {
        // Continue even if Intercom hiding fails
      }      // Method 1: Try direct page button click first
      try {
        const dataTablesPageButton = await frame.$(`.dataTables_paginate .paginate_button:has-text("${pageNumber}"):not(.current)`)
        if (dataTablesPageButton) {
          await dataTablesPageButton.click({ force: true }) // Force click to bypass overlays
          await page.waitForTimeout(2000)
          this.utilities.log('NAV', `Successfully navigated to page ${pageNumber} via direct button`)
          return {
            success: true,
            nextStep: NavigationStep.CASE_LISTING
          }        }      } catch (e) {
        this.utilities.log('NAV', 'Direct page button not visible or clickable')      }
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
              this.utilities.log('NAV', `Successfully clicked page ${pageNumber} after progressive navigation`)
              return {
                success: true,
                nextStep: NavigationStep.CASE_LISTING
              }
            } catch (e) {
              this.utilities.log('NAV', 'Failed to click target page button')
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
                    this.utilities.log('NAV', `Clicking page ${pageNumber} button directly`)
                    await btn.click({ force: true })
                    await page.waitForTimeout(2000)
                    
                    const afterClick = await this.extractPageInfo(page)
                    if (afterClick && afterClick.currentPage === pageNumber) {
                      this.utilities.log('NAV', `Successfully jumped to page ${pageNumber}`)
                      return {
                        success: true,
                        nextStep: NavigationStep.CASE_LISTING
                      }
                    }
                  }
                }
              } catch (e) {
                this.utilities.log('NAV', 'Direct page button click failed', { error: e })
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
                  this.utilities.log('NAV', `JavaScript click moved from page ${beforeClick} to ${afterClick.currentPage}`)
                } else {
                  this.utilities.log('NAV', `JavaScript click didn't change page, still on ${beforeClick}`)
                  break
                }
              } else {
                this.utilities.log('NAV', 'Could not find Next button via JavaScript')
                break
              }
            } catch (e) {
              this.utilities.log('NAV', 'JavaScript navigation failed', { error: e })
              break
            }
          } else if (current.currentPage > pageNumber) {
            // Need to go backward - similar logic for Previous button
            const beforeClick = current.currentPage
            
            // Method 1: Try clicking specific page number button
            if (pageNumber <= 10) { // Only visible page numbers
              try {
                const pageButtons = await frame.$$('.dataTables_paginate .paginate_button:not(.previous):not(.next)')
                for (const btn of pageButtons) {
                  const text = await btn.textContent()
                  if (text?.trim() === pageNumber.toString()) {
                    this.utilities.log('NAV', `Clicking page ${pageNumber} button directly`)
                    await btn.click({ force: true })
                    await page.waitForTimeout(2000)
                    
                    const afterClick = await this.extractPageInfo(page)
                    if (afterClick && afterClick.currentPage === pageNumber) {
                      this.utilities.log('NAV', `Successfully jumped to page ${pageNumber}`)
                      return {
                        success: true,
                        nextStep: NavigationStep.CASE_LISTING                      }                    }                  }                }              } catch (e) {                this.utilities.log('NAV', 'Direct page button click failed', { error: e })            }            }            
            // Method 2: Use JavaScript to click Previous button in the frame context
            try {
              const moved = await frame.evaluate(() => {
                const prevBtn = document.querySelector('#DataTables_Table_0_previous')
                if (prevBtn && !prevBtn.classList.contains('disabled')) {
                  prevBtn.click()
                  return true
                }                
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
                  this.utilities.log('NAV', `JavaScript click moved from page ${beforeClick} to ${afterClick.currentPage}`)
                } else {
                  this.utilities.log('NAV', `JavaScript click didn't change page, still on ${beforeClick}`)
                  break
                }
              } else {
                this.utilities.log('NAV', 'Could not find Previous button via JavaScript')
                break
              }
            } catch (e) {
              this.utilities.log('NAV', 'JavaScript navigation failed', { error: e })
              break
            }
          } else {
            // We're on the target page
            this.utilities.log('NAV', `Already on page ${pageNumber}`)
            return {
              success: true,
              nextStep: NavigationStep.CASE_LISTING
            }          }          
          attempts++
        }      }      
      // If page 1 is requested and we're already there
      if (pageNumber === 1) {
        this.utilities.log('NAV', `Already on page 1`)
        return {
          success: true,
          nextStep: NavigationStep.CASE_LISTING
        }      }      
      this.utilities.log('NAV', `Could not navigate to page ${pageNumber}`)
      return {
        success: false,
        nextStep: NavigationStep.ERROR,
        error: `Could not navigate to page ${pageNumber}`
      }
    } catch (error) {
      this.utilities.log('NAV', 'Failed to navigate to specific page', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return {
        success: false,
        nextStep: NavigationStep.ERROR,
        error: error instanceof Error ? error.message : 'Failed to navigate to page'
      }    }  }
}