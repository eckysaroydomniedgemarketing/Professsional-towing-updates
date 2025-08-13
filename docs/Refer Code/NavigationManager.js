/**
 * NavigationManager module - Handles navigation and page manipulation
 */

const config = require('../../../../config/app-config');
const selectors = require('../../../../config/selectors');
const ExtractorUtils = require('../ExtractorUtils');

/**
 * NavigationManager class for handling all navigation-related tasks
 */
class NavigationManager {
  /**
   * @param {import('../UpdatesManager')} manager - Reference to the UpdatesManager
   */
  constructor(manager) {
    this.manager = manager;
    this.browser = manager.browser;
    this.page = manager.browser.page;
  }

  /**
   * Check for and handle pagination if needed to process more cases
   * @param {number} targetCaseCount - Number of cases we want to process
   * @param {number} currentCaseCount - Number of cases currently visible
   * @returns {Promise<{success: boolean, totalCases: number}>} - Result of pagination with updated case count
   */
  async handlePagination(targetCaseCount, currentCaseCount) {
    try {
      // If we have enough cases already visible, no need to paginate
      if (currentCaseCount >= targetCaseCount) {
        console.log(`Already have ${currentCaseCount} cases visible, which is enough to meet target of ${targetCaseCount}`);
        return { success: true, totalCases: currentCaseCount };
      }
      
      console.log(`Need ${targetCaseCount} cases but only ${currentCaseCount} are visible. Looking for pagination link...`);
      
      // Look for the "Next" link at the bottom of the page
      // Expanded selector list to be more comprehensive
      const paginationSelectors = [
        'a:has-text("Next")', // Playwright-specific selector for text content
        'a[href*="page="]:has-text("Next")',
        'a.next-page, a.pagination-next',
        'a[rel="next"]',
        'li.next a, li.pagination-next a',
        // Specific pagination selectors for the Recovery Database system
        'a[href*="offset="]',
        'a[href*="page="]',
        'input[name="submit"][value="Next"]',
        'input[type="submit"][value="Next"]',
        'button:has-text("Next")',
        'button.next, button.pagination-next',
        // If numbered pagination is used
        'a.page-link:not(.active) + a.page-link',
        '.pagination a:not(.active) + a',
        // Additional selectors for this system
        'a.next',
        'a[href*="next"]',
        'a:has-text(">")'
      ];
      
      let nextLink = null;
      let linkType = 'anchor'; // Default to anchor type
      
      // Try each selector until we find a match
      for (const selector of paginationSelectors) {
        console.log(`Trying pagination selector: ${selector}`);
        const potentialNextLink = await this.page.$(selector);
        
        if (potentialNextLink) {
          console.log(`Found potential pagination link with selector: ${selector}`);
          nextLink = potentialNextLink;
          
          // Determine if it's a button/input or anchor link
          if (selector.includes('input') || selector.includes('button')) {
            linkType = 'button';
          }
          break;
        }
      }
      
      // If we couldn't find a next link using selectors, try looking for text
      if (!nextLink) {
        console.log('No pagination link found via CSS selectors. Trying to find link by text content...');
        
        // Get all links on the page
        const allLinks = await this.page.$$('a, input[type="submit"], button');
        
        // Check each element for text content like "Next"
        for (const link of allLinks) {
          const tagName = await link.evaluate(el => el.tagName.toLowerCase());
          let textContent;
          
          if (tagName === 'input') {
            textContent = await link.evaluate(el => el.value);
            linkType = 'button';
          } else {
            textContent = await link.textContent();
            linkType = tagName === 'button' ? 'button' : 'anchor';
          }
          
          if (textContent && textContent.trim().toLowerCase() === 'next') {
            console.log(`Found "Next" ${linkType} by text content`);
            nextLink = link;
            break;
          }
        }
      }
      
      // If we found a next link, click it
      if (nextLink) {
        console.log(`Found "Next" pagination ${linkType}. Clicking to navigate to next page...`);
        
        // Get the URL before clicking for comparison later
        const beforeUrl = this.page.url();
        
        // Before clicking, scroll the nextLink into view
        await nextLink.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(500); // Shorter timeout for faster processing
        
        // Click the next link
        await nextLink.click();
        
        // Wait for navigation to complete - use waitForURL change or timeout
        try {
          // First try waiting for URL change
          await Promise.race([
            this.page.waitForURL(url => url !== beforeUrl, { timeout: config.timeouts.element / 2 }),
            this.page.waitForTimeout(config.timeouts.element / 2)
          ]);
        } catch (navigationError) {
          console.log(`Navigation timeout, continuing: ${navigationError.message}`);
        }
        
        // Give a short delay for the page to render
        await this.page.waitForTimeout(1000);
        
        // Check if the URL actually changed
        const afterUrl = this.page.url();
        if (beforeUrl === afterUrl) {
          console.log('URL did not change after clicking next. Might be using AJAX pagination. Continuing...');
        } else {
          console.log(`URL changed from ${beforeUrl} to ${afterUrl}`);
        }
        
        // Check for updated list of cases - use ExtractorUtils for robust detection
        const updatedViewUpdateLinks = await ExtractorUtils.findViewUpdateLinks(this.page, selectors);
        console.log(`After pagination: Found ${updatedViewUpdateLinks.length} cases`);
        
        // Check if we actually have more cases now or at least a different number (indicating the page changed)
        if (updatedViewUpdateLinks.length !== currentCaseCount) {
          console.log(`Pagination successful. Now have ${updatedViewUpdateLinks.length} cases visible.`);
          return { success: true, totalCases: updatedViewUpdateLinks.length };
        } else {
          // Try one more time with a different strategy - sometimes pagination works but the count remains the same
          // Check if the content has changed by looking at the case IDs
          let beforeIds = new Set();
          let afterIds = new Set();
          
          // Try to extract case IDs from the current view links
          for (const link of updatedViewUpdateLinks) {
            try {
              const href = await link.getAttribute('href');
              const idMatch = href.match(/case_id=(\d+)/);
              if (idMatch && idMatch[1]) {
                afterIds.add(idMatch[1]);
              }
            } catch (e) { /* Ignore extraction errors */ }
          }
          
          // Get all href attributes directly for debugging
          console.log('Examining links for case IDs...');
          const allHrefs = [];
          for (const link of updatedViewUpdateLinks) {
            try {
              const href = await link.getAttribute('href');
              allHrefs.push(href);
            } catch (e) { /* Ignore errors */ }
          }
        
          // Debugging - print a sample of the hrefs
          if (allHrefs.length > 0) {
            console.log(`Sample href: ${allHrefs[0]}`);
          }
        
          // If we found case IDs, pagination worked
          if (afterIds.size > 0) {
            console.log(`Pagination successful. Found ${afterIds.size} unique case IDs.`);
            return { success: true, totalCases: updatedViewUpdateLinks.length };
          }
          
          console.log(`Warning: Pagination may not have worked. Still have ${updatedViewUpdateLinks.length} cases visible.`);
          return { success: false, totalCases: updatedViewUpdateLinks.length };
        }
      } else {
        console.log('No "Next" pagination link found. We may have reached the last page of results.');
        return { success: false, totalCases: currentCaseCount };
      }
    } catch (error) {
      console.error('Error handling pagination:', error);
      return { success: false, totalCases: currentCaseCount };
    }
  }
  
  /**
   * Navigate to a specific page number using combined smart navigation strategies
   * @param {number} pageNumber - The page number to navigate to
   * @returns {Promise<boolean>} - True if navigation successful
   */
  async navigateToSpecificPage(pageNumber) {
    try {
      console.log(`🎯 Smart navigation to page ${pageNumber}...`);
      
      // First validate we're on the correct domain and logged in
      const sessionValid = await this.validateSession();
      if (!sessionValid) {
        console.log(`❌ Session validation failed, cannot navigate to page ${pageNumber}`);
        return false;
      }
      
      // Strategy 1: Direct Click (fastest for visible pages)
      console.log(`📍 Strategy 1: Direct click for page ${pageNumber}`);
      const directResult = await this.tryDirectClick(pageNumber);
      if (directResult) {
        console.log(`✅ Direct click successful for page ${pageNumber}`);
        return true;
      }
      
      // Strategy 2: URL Navigation (bypasses UI limitations)
      console.log(`📍 Strategy 2: URL navigation for page ${pageNumber}`);
      const urlResult = await this.navigateToPageViaURL(pageNumber);
      if (urlResult) {
        console.log(`✅ URL navigation successful for page ${pageNumber}`);
        return true;
      }
      
      // Strategy 3: Jump & Walk (efficient for distant pages)
      console.log(`📍 Strategy 3: Jump & walk for page ${pageNumber}`);
      const jumpWalkResult = await this.tryJumpAndWalk(pageNumber);
      if (jumpWalkResult) {
        console.log(`✅ Jump & walk successful for page ${pageNumber}`);
        return true;
      }
      
      // Strategy 4: Reverse Navigation (from last page if closer)
      console.log(`📍 Strategy 4: Reverse navigation for page ${pageNumber}`);
      const reverseResult = await this.tryReverseNavigation(pageNumber);
      if (reverseResult) {
        console.log(`✅ Reverse navigation successful for page ${pageNumber}`);
        return true;
      }
      
      // Strategy 5: Incremental Navigation (safe fallback)
      console.log(`📍 Strategy 5: Incremental navigation for page ${pageNumber}`);
      const incrementalResult = await this.tryIncrementalNavigation(pageNumber);
      if (incrementalResult) {
        console.log(`✅ Incremental navigation successful for page ${pageNumber}`);
        return true;
      }
      
      console.log(`❌ All navigation strategies failed for page ${pageNumber}`);
      return false;
      
    } catch (error) {
      console.error(`❌ Smart navigation failed for page ${pageNumber}:`, error.message);
      return false;
    }
  }
  
  /**
   * Try direct click navigation (Strategy 1)
   * @param {number} pageNumber - Target page number
   * @returns {Promise<boolean>} - Success status
   */
  async tryDirectClick(pageNumber) {
    try {
      // First try to find and click the specific page number
      const pageSelector = selectors.threeDay.paginationPage(pageNumber);
      console.log(`Looking for page ${pageNumber} with selector: ${pageSelector}`);
      
      const pageLink = await this.page.$(pageSelector);
      
      if (pageLink) {
        console.log(`Found page ${pageNumber} link, attempting click...`);
        await pageLink.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(500);
        
        // Get pagination info before click
        const beforeInfo = await this.getPaginationInfo();
        console.log(`Before click: ${beforeInfo}`);
        
        await pageLink.click();
        await this.page.waitForTimeout(2000); // Wait for page to update
        
        // Get pagination info after click  
        const afterInfo = await this.getPaginationInfo();
        console.log(`After click: ${afterInfo}`);
        
        // Verify if we actually moved to the correct page
        const actualPage = await this.getCurrentPageFromPagination();
        if (actualPage === pageNumber) {
          console.log(`✅ Successfully navigated to page ${pageNumber}`);
          return true;
        } else {
          console.log(`❌ Click failed - on page ${actualPage}, expected ${pageNumber}`);
          return false;
        }
      } else {
        console.log(`❌ Could not find page ${pageNumber} link with selector: ${pageSelector}`);
        
        // Try alternative approach: use "Next" button clicking
        console.log(`Trying "Next" button approach to reach page ${pageNumber}...`);
        return await this.tryNextButtonNavigation(pageNumber);
      }
      
    } catch (error) {
      console.log(`Direct click failed: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Try jump and walk navigation (Strategy 3)
   * @param {number} pageNumber - Target page number
   * @returns {Promise<boolean>} - Success status
   */
  async tryJumpAndWalk(pageNumber) {
    try {
      // Get current page number
      const currentPage = await this.getCurrentPageNumber();
      if (!currentPage) return false;
      
      const distance = Math.abs(pageNumber - currentPage);
      
      // Only use jump & walk for distant pages (>5 pages away)
      if (distance <= 5) {
        console.log(`Page ${pageNumber} is only ${distance} pages away, skipping jump & walk`);
        return false;
      }
      
      // Find the closest visible page to target
      const visiblePages = await this.getVisiblePageNumbers();
      let closestPage = null;
      let minDistance = Infinity;
      
      for (const visiblePage of visiblePages) {
        const dist = Math.abs(pageNumber - visiblePage);
        if (dist < minDistance) {
          minDistance = dist;
          closestPage = visiblePage;
        }
      }
      
      if (closestPage && minDistance < distance) {
        console.log(`Jumping to intermediate page ${closestPage}, then walking to ${pageNumber}`);
        
        // Jump to closest visible page
        const jumpResult = await this.tryDirectClick(closestPage);
        if (!jumpResult) return false;
        
        // Walk from there to target
        return await this.walkToPage(closestPage, pageNumber);
      }
      
      return false;
    } catch (error) {
      console.log(`Jump & walk failed: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Try reverse navigation from last page (Strategy 4)
   * @param {number} pageNumber - Target page number
   * @returns {Promise<boolean>} - Success status
   */
  async tryReverseNavigation(pageNumber) {
    try {
      // Get total page count
      const totalPages = await this.getTotalPageCount();
      if (!totalPages || pageNumber >= totalPages) return false;
      
      // Only use reverse navigation if target is closer to end than beginning
      const distanceFromEnd = totalPages - pageNumber;
      const distanceFromStart = pageNumber - 1;
      
      if (distanceFromEnd >= distanceFromStart) {
        console.log(`Page ${pageNumber} is closer to start (${distanceFromStart}) than end (${distanceFromEnd})`);
        return false;
      }
      
      console.log(`Navigating to last page ${totalPages}, then walking backwards to ${pageNumber}`);
      
      // Navigate to last page
      const lastPageResult = await this.tryDirectClick(totalPages);
      if (!lastPageResult) return false;
      
      // Walk backwards to target
      return await this.walkToPage(totalPages, pageNumber);
    } catch (error) {
      console.log(`Reverse navigation failed: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Try incremental navigation (Strategy 5 - safe fallback)
   * @param {number} pageNumber - Target page number
   * @returns {Promise<boolean>} - Success status
   */
  async tryIncrementalNavigation(pageNumber) {
    try {
      const currentPage = await this.getCurrentPageNumber();
      if (!currentPage) return false;
      
      console.log(`Walking from page ${currentPage} to page ${pageNumber}`);
      return await this.walkToPage(currentPage, pageNumber);
    } catch (error) {
      console.log(`Incremental navigation failed: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Walk from one page to another using next/previous buttons
   * @param {number} fromPage - Starting page
   * @param {number} toPage - Target page
   * @returns {Promise<boolean>} - Success status
   */
  async walkToPage(fromPage, toPage) {
    try {
      let currentPage = fromPage;
      const maxSteps = Math.abs(toPage - fromPage);
      const direction = toPage > fromPage ? 'next' : 'previous';
      
      console.log(`Walking ${direction} from page ${fromPage} to ${toPage} (${maxSteps} steps)`);
      
      for (let step = 0; step < maxSteps; step++) {
        const buttonSelector = direction === 'next' ? 
          'a:has-text("Next"), a:has-text(">")' : 
          'a:has-text("Previous"), a:has-text("<")';
        
        const button = await this.page.$(buttonSelector);
        if (!button) {
          console.log(`No ${direction} button found at step ${step + 1}`);
          return false;
        }
        
        await button.click();
        await this.page.waitForTimeout(2000);
        
        currentPage += direction === 'next' ? 1 : -1;
        console.log(`Step ${step + 1}/${maxSteps}: Now on page ${currentPage}`);
        
        if (currentPage === toPage) {
          return await this.waitForPageLoad(toPage, 30000);
        }
      }
      
      return false;
    } catch (error) {
      console.log(`Walk navigation failed: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get current page number from pagination display
   * @returns {Promise<number|null>} - Current page number or null
   */
  async getCurrentPageNumber() {
    try {
      const activePageElement = await this.page.$('.pagination .active, .current');
      if (activePageElement) {
        const pageText = await activePageElement.textContent();
        const pageNumber = parseInt(pageText.trim(), 10);
        return !isNaN(pageNumber) ? pageNumber : null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Get list of visible page numbers in pagination
   * @returns {Promise<number[]>} - Array of visible page numbers
   */
  async getVisiblePageNumbers() {
    try {
      const pageElements = await this.page.$$('.pagination a');
      const pageNumbers = [];
      
      for (const element of pageElements) {
        const text = await element.textContent();
        const pageNumber = parseInt(text.trim(), 10);
        if (!isNaN(pageNumber)) {
          pageNumbers.push(pageNumber);
        }
      }
      
      return pageNumbers.sort((a, b) => a - b);
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Get total page count from pagination
   * @returns {Promise<number|null>} - Total page count or null
   */
  async getTotalPageCount() {
    try {
      // Look for pagination info text like "Page 1 of 25"
      const infoElement = await this.page.$('.dataTables_info');
      if (infoElement) {
        const infoText = await infoElement.textContent();
        const match = infoText.match(/of\s+(\d+)/i);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
      
      // Fallback: get highest visible page number
      const visiblePages = await this.getVisiblePageNumbers();
      return visiblePages.length > 0 ? Math.max(...visiblePages) : null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Wait for page to load and verify navigation success
   * @param {number} pageNumber - Expected page number
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} - Success status
   */
  async waitForPageLoad(pageNumber, timeout = 600000) {
    try {
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        // First verify we're still on the correct domain
        const currentUrl = this.page.url();
        if (!currentUrl.includes('app.recoverydatabase.net')) {
          console.log(`❌ Page load failed - redirected to wrong domain: ${currentUrl}`);
          return false;
        }
        
        // Check if dropdown exists (indicates page loaded)
        const dropdown = await this.page.$('select[name="DataTables_Table_0_length"]');
        if (dropdown) {
          // Verify we have cases on the page
          const viewUpdateLinks = await ExtractorUtils.findViewUpdateLinks(this.page, selectors);
          if (viewUpdateLinks.length > 0) {
            console.log(`✓ Page ${pageNumber} loaded successfully (${viewUpdateLinks.length} cases found)`);
            return true;
          }
        }
        
        await this.page.waitForTimeout(2000);
      }
      
      console.log(`⚠️ Page ${pageNumber} load timeout after ${timeout/1000}s`);
      return false;
    } catch (error) {
      console.log(`Page load verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Sort the "Last Update" column in ascending order (oldest first)
   * @returns {Promise<boolean>} - True if sorting successful
   */
  async sortLastUpdateColumn() {
    try {
      console.log('Sorting "Last Update" column in ascending order (oldest first)...');
      
      // Wait for page to be fully loaded with data
      await this.page.waitForTimeout(2000);
      
      // Strategy 1: Try Playwright's built-in text selectors first (most reliable)
      let columnHeader = null;
      let usedSelector = null;
      
      try {
        console.log('Trying Playwright getByRole selector...');
        columnHeader = await this.page.getByRole('gridcell', { name: /Last Update.*activate to sort/i }).first();
        if (columnHeader && await columnHeader.isVisible()) {
          console.log('Found "Last Update" column header using Playwright getByRole selector');
          usedSelector = 'Playwright getByRole';
        } else {
          columnHeader = null;
        }
      } catch (e) {
        console.log(`Playwright getByRole selector failed: ${e.message}`);
      }
      
      // Strategy 2: Find all potential column headers and check their text content
      if (!columnHeader) {
        console.log('Trying to find column header by text content...');
        
        // Get all potential column header elements
        const potentialHeaders = await this.page.$(selectors.threeDay.lastUpdateColumnHeader);
        
        for (const header of potentialHeaders) {
          try {
            const textContent = await header.textContent();
            if (textContent && textContent.toLowerCase().includes('last update')) {
              console.log(`Found "Last Update" column header with text: "${textContent.trim()}"`);
              columnHeader = header;
              usedSelector = 'Text content matching';
              break;
            }
          } catch (e) {
            // Skip this element if we can't get its text content
          }
        }
      }
      
      // Strategy 3: Try alternative Playwright selectors
      if (!columnHeader) {
        console.log('Trying alternative Playwright selectors...');
        const alternativeSelectors = [
          () => this.page.getByText('Last Update', { exact: false }),
          () => this.page.locator('th:has-text("Last Update")'),
          () => this.page.locator('[role="gridcell"]:has-text("Last Update")')
        ];
        
        for (const selectorFn of alternativeSelectors) {
          try {
            const element = selectorFn();
            if (await element.isVisible()) {
              columnHeader = element;
              usedSelector = 'Alternative Playwright selector';
              console.log('Found "Last Update" column header using alternative selector');
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      }
      
      if (columnHeader) {
        console.log(`Clicking "Last Update" column header to sort (using ${usedSelector})...`);
        
        // Scroll the header into view if needed
        await columnHeader.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(500);
        
        // Click the column header to trigger sorting
        await columnHeader.click();
        
        console.log('✓ Successfully clicked "Last Update" column header');
        
        // Wait for table to update after sorting
        console.log('Waiting for table to update after sorting...');
        await this.page.waitForTimeout(3000);
        
        console.log('✓ Successfully sorted "Last Update" column in ascending order (oldest first)');
        return true;
      } else {
        console.log('Warning: Could not find "Last Update" column header for sorting. Will continue without sorting.');
        return false;
      }
    } catch (error) {
      console.error('Error sorting Last Update column:', error);
      console.log('Will continue processing without sorting.');
      return false;
    }
  }

  /**
   * Navigate to the three day updates page
   * @param {boolean} preservePageNumber - Whether to try to preserve current page number
   * @returns {Promise<boolean>} - True if navigation successful
   */
  async navigateToUpdatesPage(preservePageNumber = false) {
    try {
      // Check current URL to see if we need to preserve page state
      let targetUrl = config.urls.threeDay;
      
      if (preservePageNumber) {
        try {
          const currentUrl = this.page.url();
          // Extract page parameter if it exists
          const pageMatch = currentUrl.match(/[?&]page=(\d+)/i);
          const offsetMatch = currentUrl.match(/[?&]offset=(\d+)/i);
          
          if (pageMatch) {
            targetUrl = `${config.urls.threeDay}${config.urls.threeDay.includes('?') ? '&' : '?'}page=${pageMatch[1]}`;
            console.log(`Preserving page number: ${pageMatch[1]}`);
          } else if (offsetMatch) {
            targetUrl = `${config.urls.threeDay}${config.urls.threeDay.includes('?') ? '&' : '?'}offset=${offsetMatch[1]}`;
            console.log(`Preserving offset: ${offsetMatch[1]}`);
          }
        } catch (e) {
          console.log('Could not extract page parameters, using default URL');
        }
      }
      
      console.log(`Navigating to three day updates page: ${targetUrl}`);
      
      // Use the browser's navigate method with global timeout settings
      const navigationSuccess = await this.browser.navigate(targetUrl);
      
      if (!navigationSuccess) {
        console.error('❌ Failed to navigate to three day updates page');
        return false;
      }
      
      // As soon as any case number is detected, we can proceed to task 5.2
      console.log('Looking for cases on the page - will proceed as soon as any case is detected...');
      
      // Try different selectors to find any view updates link
      const viewUpdateSelectors = [
        selectors.threeDay.viewUpdatesLink,
        'a[target="gotoupdate"]',
        'a[href*="case_id"]',
        'a[href*="/alpha_rdn/module/default/case2/"]',
        'a[href*="View Updates"]',
        'a:has-text("View Updates")',
        'td a[target]'
      ];
      
      // Try each selector and check if any elements are found
      let anyCase = false;
      for (const selector of viewUpdateSelectors) {
        try {
          console.log(`Looking for cases with selector: ${selector}`);
          const elements = await this.page.$(selector);
          if (elements) {
            console.log(`Found at least one case with selector: ${selector}`);
            anyCase = true;
            break;
          }
        } catch (err) {
          console.log(`Error checking for cases with selector ${selector}: ${err.message}`);
        }
      }
      
      if (anyCase) {
        console.log('✓ Task 5.1 completed: Found at least one case, proceeding to task 5.2');
        return true;
      }
      
      // If no cases found after a minimum wait time, check the URL and try to proceed anyway
      console.log('No cases detected with any selector, checking URL...');
      const currentUrl = this.page.url();
      
      if (currentUrl.includes('three_day_updates.php')) {
        console.log('We are on the correct page. Will attempt to proceed with task 5.2 anyway.');
        return true;
      }
      
      console.error('❌ Task 5.1 issue: Not on the expected page and no cases found');
      return false;
    } catch (error) {
      console.error('Failed to navigate to updates page:', error);
      
      // Check if we're on the right page despite the error
      try {
        const currentUrl = this.page.url();
        console.log(`Current URL after navigation error: ${currentUrl}`);
        
        if (currentUrl.includes('three_day_updates.php')) {
          console.log('Despite error, we are on the correct page. Will attempt to proceed with task 5.2.');
          return true;
        }
      } catch (err) {
        console.error('Error checking URL after navigation error:', err);
      }
      
      return false;
    }
  }

  /**
   * Process a specific case directly by URL (Task 5.3)
   * @param {string} url - Case URL or ID
   * @param {string|null} caseId - Case ID if known
   * @returns {Promise<boolean>} - True if processing successful
   */
  async processSpecificCase(url, caseId = null) {
    try {
      console.log(`Processing specific case: ${caseId || url}`);
      
      // Check if the input is a URL or just a case ID
      if (!url.startsWith('http')) {
        // It's likely just a case ID
        caseId = url;
        url = `https://app.recoverydatabase.net/alpha_rdn/module/default/case2/?tab=6&case_id=${caseId}`;
        console.log(`Constructed URL from case ID: ${url}`);
      } else {
        // It's a URL, ensure it has tab=6 parameter for viewing updates
        if (!url.includes('tab=6')) {
          // Make sure the URL has the tab=6 parameter for viewing updates
          if (url.includes('?')) {
            // URL already has parameters, add tab=6
            url = url.includes('case_id=') ? url + '&tab=6' : url;
          } else if (url.includes('case_id=')) {
            // Add tab parameter
            url = url + '&tab=6';
          }
        }
      }
      
      // If we have a case ID but the URL doesn't include it, construct a proper URL
      if (caseId && !url.includes('case_id=')) {
        url = `https://app.recoverydatabase.net/alpha_rdn/module/default/case2/?tab=6&case_id=${caseId}`;
      }
      
      console.log(`Navigating directly to case updates at URL: ${url}`);
      
      // Navigate directly to the properly formatted URL
      this.manager.currentCaseTab = await this.browser.openNewPage(url);
      
      if (!this.manager.currentCaseTab) {
        console.error(`❌ Failed to open case page at URL: ${url}`);
        return false;
      }
      
      console.log(`Case page opened with URL: ${await this.manager.currentCaseTab.url()}`);
      
      // Wait for the page to load - allow sufficient time as specified in Task 5.3
      console.log('Allowing sufficient time for the page to fully load...');
      try {
        await Promise.race([
          this.manager.currentCaseTab.waitForLoadState('networkidle', { timeout: 15000 }), // Increased timeout
          this.manager.currentCaseTab.waitForLoadState('domcontentloaded', { timeout: 10000 }),
          this.manager.currentCaseTab.waitForTimeout(config.timeouts.element) // Use full element timeout
        ]);
      } catch (e) {
        console.log(`Page load wait completed: ${e ? e.message : 'success'}`);
      }
      
      // Extract case ID from URL if not provided
      if (!caseId) {
        const currentUrl = await this.manager.currentCaseTab.url();
        const caseIdMatch = currentUrl.match(/case_id=(\d+)/);
        caseId = caseIdMatch ? caseIdMatch[1] : 'unknown';
        console.log(`Extracted case ID from URL: ${caseId}`);
      }
      
      // Proceed with task 5.4 - click ALL link to load all previous updates
      console.log('Task 5.4: Locating and clicking the "ALL" link to load all previous updates');
      try {
        // Use our ExtractorUtils to efficiently find and click the ALL link
        const allLinkSuccess = await ExtractorUtils.clickAllLink(this.manager.currentCaseTab, caseId);
        
        if (allLinkSuccess) {
          console.log('Successfully clicked ALL link, waiting for updates to load...');
          // Wait for all updates to load on the page
          await this.manager.currentCaseTab.waitForTimeout(8000); // 8 seconds to ensure all updates load
        } else {
          console.log('Could not click ALL link, continuing with available updates');
        }
      } catch (allLinkError) {
        console.log(`Error handling ALL link: ${allLinkError.message}. Will continue with available updates`);
      }
      
      // Set up report files if not already done
      if (!this.manager.caseSummaryFile || !this.manager.updateSummaryFile) {
        await this.manager.reportManager.setupReportFiles();
      }
      
      // Process the case (Proceed to data extraction and analysis - Tasks 5.5, 5.6, 5.7)
      console.log('Proceeding to data extraction and analysis for this case');
      const processResult = await this.manager.processCase(caseId);
      
      // Generate final reports for specific case processing
      try {
        const FinalReportGenerator = require('../FinalReportGenerator');
        const finalReportGenerator = new FinalReportGenerator(this.manager.database);
        
        console.log('\n🎯 Generating comprehensive final reports for specific case processing...');
        const sessionInfo = {
          mode: 'specific',
          autoMode: false,
          processedCases: 1,
          updatesPosted: processResult && processResult.updatePosted ? 1 : 0,
          casesRequiringNoUpdate: processResult && !processResult.updatePosted ? 1 : 0,
          sessionTerminated: false
        };
        
        const reportResults = await finalReportGenerator.generateAllReports(sessionInfo, {
          sessionId: this.manager.currentSessionId
        });
        
        if (reportResults.error) {
          console.error('❌ Error generating final reports:', reportResults.error);
        }
      } catch (error) {
        console.error('❌ Failed to generate final reports:', error.message);
        // Don't throw - continue with normal flow even if final reports fail
      }
      
      // After processing the specific case, ask what the user wants to do next (Task 5.3)
      console.log('Case processing completed. Asking user for next action...');
      const { nextAction } = await this.manager.userInputManager.askForNextAction();
      
      // Close the current case tab
      try {
        await this.manager.currentCaseTab.close({ runBeforeUnload: false }).catch(err => console.log(`Warning: Error closing tab: ${err.message}`));
      } catch (closeError) {
        console.log(`Non-critical error closing tab: ${closeError.message}`);
      }
      this.manager.currentCaseTab = null;
      
      // Handle next action based on user's choice
      if (nextAction === 'another') {
        // 1) Process another specific case (repeat this option) - Task 5.3
        console.log('User chose to process another specific case');
        const { mode, caseId, url } = await this.manager.userInputManager.askForProcessingMode();
        if (mode === 'specific' && url) {
          return await this.processSpecificCase(url, caseId);
        } else {
          return await this.navigateToUpdatesPage();
        }
      } else if (nextAction === 'standard') {
        // 2) Return to the standard workflow (go to task 5.2) - Task 5.3
        console.log('User chose to return to the standard workflow');
        return await this.navigateToUpdatesPage();
      } else {
        // 3) Exit the automation - Task 5.3
        console.log('User chose to exit the automation');
        return true;
      }
    } catch (error) {
      console.error(`Failed to process specific case:`, error);
      return false;
    }
  }

  /**
   * Navigate to a specific page using URL manipulation (fallback for ellipsis issues)
   * @param {number} pageNumber - The page number to navigate to
   * @returns {Promise<boolean>} - True if navigation successful
   */
  async navigateToPageViaURL(pageNumber) {
    try {
      console.log(`Attempting URL-based navigation to page ${pageNumber}...`);
      
      const currentUrl = this.page.url();
      
      // Validate we're on the correct domain before URL manipulation
      if (!currentUrl.includes('app.recoverydatabase.net')) {
        console.log(`❌ Not on correct domain (${currentUrl}), cannot use URL navigation`);
        return false;
      }
      
      let targetUrl;
      
      // Check if URL already has pagination parameters
      if (currentUrl.includes('start=') || currentUrl.includes('page=')) {
        // This system doesn't use 'start' parameter - it's server-side generated
        // We need to determine the correct pagination parameter by examining the current URL
        console.log(`❌ URL manipulation not supported - this system uses server-side pagination`);
        console.log(`Current URL: ${currentUrl}`);
        console.log(`System requires clicking actual pagination elements, not URL manipulation`);
        return false;
      } else {
        // This system doesn't support URL-based pagination at all
        console.log(`❌ URL manipulation not supported - system uses server-side pagination only`);
        return false;
      }
      
      console.log(`Navigating to URL: ${targetUrl}`);
      
      // Ensure targetUrl uses correct domain
      if (!targetUrl.includes('app.recoverydatabase.net')) {
        console.log(`❌ Target URL has incorrect domain: ${targetUrl}`);
        return false;
      }
      
      // Navigate to the new URL
      await this.page.goto(targetUrl, { 
        waitUntil: 'networkidle', 
        timeout: 600000 // 10 minute timeout
      });
      
      // Wait for page to stabilize
      await this.page.waitForTimeout(3000);
      
      // Verify we're on the correct page by checking for cases
      const ExtractorUtils = require('../ExtractorUtils');
      const selectors = require('../../../../config/selectors');
      const viewUpdateLinks = await ExtractorUtils.findViewUpdateLinks(this.page, selectors);
      
      if (viewUpdateLinks.length > 0) {
        console.log(`✓ Successfully navigated to page ${pageNumber} via URL (found ${viewUpdateLinks.length} cases)`);
        
        // Try to verify the page number in the pagination display
        try {
          const paginationInfo = await this.page.$eval('.dataTables_info, .pagination-info', el => el.textContent);
          console.log(`Pagination info: ${paginationInfo}`);
        } catch (e) {
          // Pagination info not found, but we have cases so continue
        }
        
        return true;
      } else {
        console.log(`Warning: URL navigation to page ${pageNumber} completed but no cases found`);
        return false;
      }
      
    } catch (error) {
      console.error(`URL-based navigation to page ${pageNumber} failed:`, error.message);
      return false;
    }
  }

  /**
   * Try navigation using Next button clicks (your suggested approach)
   * @param {number} targetPage - Target page number
   * @returns {Promise<boolean>} - Success status
   */
  async tryNextButtonNavigation(targetPage) {
    try {
      const currentPage = await this.getCurrentPageFromPagination();
      if (!currentPage) {
        console.log(`❌ Cannot determine current page for Next button navigation`);
        return false;
      }
      
      console.log(`📍 Next button navigation: from page ${currentPage} to page ${targetPage}`);
      
      if (currentPage === targetPage) {
        console.log(`✅ Already on target page ${targetPage}`);
        return true;
      }
      
      const clicksNeeded = targetPage - currentPage;
      if (clicksNeeded < 0) {
        console.log(`❌ Cannot go backwards using Next button (current: ${currentPage}, target: ${targetPage})`);
        return false;
      }
      
      if (clicksNeeded > 10) {
        console.log(`❌ Too many clicks needed (${clicksNeeded}), skipping Next button approach`);
        return false;
      }
      
      // Click Next button the required number of times
      for (let i = 0; i < clicksNeeded; i++) {
        console.log(`Clicking Next button (${i + 1}/${clicksNeeded})...`);
        
        // Find and click Next button
        const nextButton = await this.page.$('a:has-text("Next"), .paginate_button.next:not(.disabled) a, a.page-link:has-text("Next")');
        if (!nextButton) {
          console.log(`❌ Next button not found or disabled at step ${i + 1}`);
          return false;
        }
        
        await nextButton.click();
        await this.page.waitForTimeout(2000); // Wait for page to load
        
        // Verify we moved to the next page
        const newPage = await this.getCurrentPageFromPagination();
        const expectedPage = currentPage + i + 1;
        
        console.log(`After click ${i + 1}: on page ${newPage}, expected ${expectedPage}`);
        
        if (newPage !== expectedPage) {
          console.log(`❌ Next button click failed - expected page ${expectedPage}, got ${newPage}`);
          return false;
        }
      }
      
      // Final verification
      const finalPage = await this.getCurrentPageFromPagination();
      if (finalPage === targetPage) {
        console.log(`✅ Next button navigation successful - reached page ${targetPage}`);
        return true;
      } else {
        console.log(`❌ Next button navigation failed - on page ${finalPage}, expected ${targetPage}`);
        return false;
      }
      
    } catch (error) {
      console.log(`❌ Next button navigation failed: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get current pagination information from the page
   * @returns {Promise<string>} - Pagination info text
   */
  async getPaginationInfo() {
    try {
      const infoElement = await this.page.$('.dataTables_info');
      if (infoElement) {
        return await infoElement.textContent();
      }
      return 'Pagination info not found';
    } catch (error) {
      return `Error getting pagination info: ${error.message}`;
    }
  }
  
  /**
   * Extract current page number from pagination display
   * @returns {Promise<number|null>} - Current page number
   */
  async getCurrentPageFromPagination() {
    try {
      // Look for active/current page indicator
      const activePageElement = await this.page.$('.paginate_button.current, .page-item.active .page-link, .current');
      if (activePageElement) {
        const pageText = await activePageElement.textContent();
        const pageNumber = parseInt(pageText.trim(), 10);
        return !isNaN(pageNumber) ? pageNumber : null;
      }
      
      // Fallback: try to extract from pagination info text
      const paginationInfo = await this.getPaginationInfo();
      const match = paginationInfo.match(/Showing\\s+(\\d+)\\s+to\\s+(\\d+)\\s+of\\s+(\\d+)/);
      if (match) {
        const startRecord = parseInt(match[1], 10);
        const recordsPerPage = 10; // Observed from your output
        const currentPage = Math.ceil(startRecord / recordsPerPage);
        return currentPage;
      }
      
      return null;
    } catch (error) {
      console.log(`Error determining current page: ${error.message}`);
      return null;
    }
  }

  /**
   * Validate current session and domain to ensure navigation will work
   * @returns {Promise<boolean>} - True if session is valid
   */
  async validateSession() {
    try {
      const currentUrl = this.page.url();
      
      // Check if we're on the correct domain
      if (!currentUrl.includes('app.recoverydatabase.net')) {
        console.log(`❌ Session validation failed - wrong domain: ${currentUrl}`);
        return false;
      }
      
      // Check if we're redirected to login
      if (currentUrl.includes('secureauth') || currentUrl.includes('login')) {
        console.log(`❌ Session validation failed - redirected to login: ${currentUrl}`);
        return false;
      }
      
      // Check for elements that indicate we're logged in and on the correct page
      const isOnCorrectPage = await this.page.$('select[name="DataTables_Table_0_length"], .dataTables_wrapper, table');
      if (!isOnCorrectPage) {
        console.log(`❌ Session validation failed - not on cases page`);
        return false;
      }
      
      console.log(`✓ Session validation successful`);
      return true;
    } catch (error) {
      console.log(`❌ Session validation error: ${error.message}`);
      return false;
    }
  }
}

module.exports = NavigationManager;