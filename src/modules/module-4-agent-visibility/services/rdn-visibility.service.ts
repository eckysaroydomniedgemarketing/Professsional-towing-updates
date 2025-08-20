import { Page } from 'playwright';
import type { CaseUpdate, UpdateElement, ProcessCaseResult } from '../types';

class RDNVisibilityService {
  private page: Page | null = null;

  /**
   * Set the Playwright page instance
   */
  setPage(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to new updates page
   */
  async navigateToNewUpdates(): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      await this.page.goto(
        'https://app.recoverydatabase.net/v2/main/new_updates.php?case_worker=ALL&order=priority&type=ALL&days_since_update=all&case_status%5B%5D=Open',
        { waitUntil: 'networkidle' }
      );
      return true;
    } catch (error) {
      console.error('Error navigating to new updates:', error);
      return false;
    }
  }

  /**
   * Get the first case from new updates list
   */
  async getFirstCase(): Promise<string | null> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // Find the first "View Case And Remove From List" button
      const firstCaseButton = await this.page.$('a.btn-secondary.js-remove-new');
      
      if (!firstCaseButton) {
        console.log('No cases found in new updates list');
        return null;
      }

      // Extract case ID from href
      const href = await firstCaseButton.getAttribute('href');
      const caseIdMatch = href?.match(/case_id=(\d+)/);
      
      if (!caseIdMatch) {
        console.error('Could not extract case ID from button');
        return null;
      }

      return caseIdMatch[1];
    } catch (error) {
      console.error('Error getting first case:', error);
      return null;
    }
  }

  /**
   * Open case in new tab and switch to it
   */
  async openCaseInNewTab(caseId: string): Promise<Page | null> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // Click the "View Case And Remove From List" button
      const selector = `a.btn-secondary.js-remove-new[href*="case_id=${caseId}"]`;
      
      // Wait for new page to open
      const [newPage] = await Promise.all([
        this.page.context().waitForEvent('page'),
        this.page.click(selector)
      ]);

      // Wait for new page to load
      await newPage.waitForLoadState('networkidle');
      
      return newPage;
    } catch (error) {
      console.error('Error opening case in new tab:', error);
      return null;
    }
  }

  /**
   * Click "ALL" in pagination to load all updates
   */
  async loadAllUpdates(casePage: Page): Promise<boolean> {
    try {
      // Click the ALL pagination button
      const allButton = await casePage.$('a.page-link[data-page="ALL"]');
      
      if (allButton) {
        await allButton.click();
        // Wait minimum 30 seconds as per requirement
        await casePage.waitForTimeout(30000);
        await casePage.waitForLoadState('networkidle');
        return true;
      }
      
      console.log('ALL button not found, updates may already be loaded');
      return true;
    } catch (error) {
      console.error('Error loading all updates:', error);
      return false;
    }
  }

  /**
   * Find all agent updates that are not visible
   */
  async findInvisibleAgentUpdates(casePage: Page): Promise<UpdateElement[]> {
    try {
      const updates: UpdateElement[] = [];
      
      // Find all update containers
      const updateContainers = await casePage.$$('div.update_content');
      console.log(`Found ${updateContainers.length} update containers`);
      
      for (const container of updateContainers) {
        // Check if update is by an agent - look for "Last Updated By" field
        const authorLabel = await container.$('dt:has-text("Last Updated By")');
        if (!authorLabel) {
          continue; // No author field found
        }
        
        // Get the author value (next dd element)
        const authorValue = await container.$('dt:has-text("Last Updated By") + dd');
        const authorText = await authorValue?.textContent();
        
        if (!authorText || !authorText.includes('(Agent)')) {
          continue; // Not an agent update
        }
        
        console.log(`Found agent update by: ${authorText}`);
        
        // Extract and validate company
        let companyName: string | undefined;
        const companyLabel = await container.$('dt:has-text("Company")');
        if (companyLabel) {
          const companyValue = await container.$('dt:has-text("Company") + dd');
          companyName = (await companyValue?.textContent()) || undefined;
          
          // Flexible company matching - check for "professional towing" (case-insensitive)
          const isValidCompany = /professional\s+towing/i.test(companyName || '');
          
          if (!isValidCompany) {
            console.log(`Skipping update - company "${companyName}" doesn't match "Professional Towing"`);
            continue;
          }
          
          console.log(`Valid company found: ${companyName}`);
        } else {
          // No company field found, skip this update
          console.log('No company field found in update, skipping...');
          continue;
        }
        
        // Extract update text content
        let updateText: string | undefined;
        
        // Try multiple selectors for update text
        const textSelectors = [
          'dd[id$="_view_comments"]',  // Primary: dd with ID ending in _view_comments
          'dt:has-text("Details") + dd', // Secondary: dd following Details label
          'dd[class*="update-text-"]'    // Tertiary: dd with update-text class
        ];
        
        for (const selector of textSelectors) {
          const updateContentElement = await container.$(selector);
          if (updateContentElement) {
            updateText = (await updateContentElement.textContent()) || undefined;
            if (updateText) {
              // Clean up the text - remove extra whitespace and HTML entities
              updateText = updateText.trim().replace(/\s+/g, ' ');
              console.log(`Extracted update text using selector "${selector}" (first 100 chars): ${updateText.substring(0, 100)}...`);
              break; // Stop once we find text
            }
          }
        }
        
        if (!updateText) {
          console.log('Warning: Could not extract update text with any selector');
        }
        
        // Find visibility button with "Not Visible" text
        const visibilityButton = await container.$('button.js-visible:has(span:has-text("Not Visible"))');
        
        if (!visibilityButton) {
          console.log('Update is already visible or button not found');
          continue; // Already visible or button not found
        }
        
        // Extract update ID from multiple sources
        let updateId = null;
        
        // Try from onclick attribute
        const onclickAttr = await visibilityButton.getAttribute('onclick');
        const onclickMatch = onclickAttr?.match(/toggleVisibleUpdate\((\d+)\)/);
        if (onclickMatch) {
          updateId = onclickMatch[1];
        }
        
        // Fallback: Extract from span ID
        if (!updateId) {
          const spanElement = await container.$('span[id^="visiblestate_"]');
          const spanId = await spanElement?.getAttribute('id');
          const spanMatch = spanId?.match(/visiblestate_(\d+)/);
          if (spanMatch) {
            updateId = spanMatch[1];
          }
        }
        
        // Fallback: Extract from container ID
        if (!updateId) {
          const containerId = await container.getAttribute('id');
          const containerMatch = containerId?.match(/updatearea_(\d+)/);
          if (containerMatch) {
            updateId = containerMatch[1];
          }
        }
        
        if (updateId) {
          updates.push({
            updateId: updateId,
            authorElement: authorValue!,
            visibilityButton: visibilityButton,
            company: companyName,
            updateText: updateText,
            isAgent: true,
            isVisible: false
          });
          console.log(`Found agent update ${updateId} from company "${companyName}" marked as Not Visible`);
        }
      }
      
      console.log(`Total invisible agent updates found: ${updates.length}`);
      return updates;
    } catch (error) {
      console.error('Error finding invisible agent updates:', error);
      return [];
    }
  }

  /**
   * Toggle visibility for a single update
   */
  async toggleUpdateVisibility(casePage: Page, updateId: string): Promise<boolean> {
    try {
      console.log(`Toggling visibility for update ${updateId}`);
      
      // Multiple strategies to find the button
      let notVisibleButton = null;
      
      // Strategy 1: Direct button with onclick containing the updateId
      notVisibleButton = await casePage.$(`button[onclick*="toggleVisibleUpdate(${updateId})"]`);
      
      // Strategy 2: Find by span ID and get parent button
      if (!notVisibleButton) {
        const spanSelector = `span#visiblestate_${updateId}:has-text("Not Visible")`;
        const spanElement = await casePage.$(spanSelector);
        if (spanElement) {
          // Get parent button
          notVisibleButton = await casePage.evaluateHandle(
            (span) => span.closest('button'),
            spanElement
          );
        }
      }
      
      // Strategy 3: Find button containing the specific span
      if (!notVisibleButton) {
        notVisibleButton = await casePage.$(`button:has(span#visiblestate_${updateId}:has-text("Not Visible"))`);
      }
      
      // Strategy 4: Find within update container if it exists
      if (!notVisibleButton) {
        const container = await casePage.$(`div#updatearea_${updateId}`);
        if (container) {
          notVisibleButton = await container.$('button.js-visible:has-text("Not Visible")');
        }
      }
      
      if (!notVisibleButton) {
        console.error(`Not Visible button not found for update ${updateId} after trying all strategies`);
        return false;
      }
      
      // Click the button
      await notVisibleButton.click();
      console.log(`Clicked Not Visible button for update ${updateId}`);
      
      // Wait for modal to appear with network idle
      await casePage.waitForSelector('#formModal', { 
        state: 'visible',
        timeout: 20000 
      });
      await casePage.waitForLoadState('networkidle');
      console.log('Modal appeared and network idle');
      
      // Small delay to ensure modal is fully rendered
      await casePage.waitForTimeout(1000);
      
      // Find Continue button with retry logic
      let continueButton = null;
      let retries = 3;
      
      while (!continueButton && retries > 0) {
        // Try multiple selectors
        const selectors = [
          `button[onclick*="togglePostVisibleUpdate(${updateId})"]`,
          'button.btn-warning:has-text("Continue")',
          '#formModal button:has-text("Continue")',
          '.modal-footer button:has-text("Continue")',
          'button:has-text("Continue")'
        ];
        
        for (const selector of selectors) {
          try {
            continueButton = await casePage.$(selector);
            if (continueButton) {
              const isVisible = await continueButton.isVisible();
              const isEnabled = await continueButton.isEnabled();
              if (isVisible && isEnabled) {
                console.log(`Found Continue button with selector: ${selector}`);
                break;
              }
              continueButton = null;
            }
          } catch (e) {
            // Selector failed, try next
          }
        }
        
        if (!continueButton) {
          console.log(`Retry ${4 - retries}/3: Continue button not found, waiting...`);
          await casePage.waitForTimeout(1500);
          retries--;
        }
      }
      
      if (!continueButton) {
        console.error(`Continue button not found in modal for update ${updateId}`);
        // Try to close modal if it's open
        const closeButton = await casePage.$('button[data-dismiss="modal"], .modal-header .close, .modal-header button.close');
        if (closeButton) {
          await closeButton.click();
          await casePage.waitForTimeout(500);
        }
        return false;
      }
      
      // Click with retry mechanism
      let clickSuccess = false;
      for (let i = 0; i < 3; i++) {
        try {
          // Scroll button into view first
          await continueButton.scrollIntoViewIfNeeded();
          await casePage.waitForTimeout(200);
          
          // Try regular click
          await continueButton.click({ timeout: 5000 });
          clickSuccess = true;
          console.log('Successfully clicked Continue button');
          break;
        } catch (clickError) {
          console.log(`Click attempt ${i + 1} failed: ${clickError.message}`);
          
          if (i < 2) {
            await casePage.waitForTimeout(1000);
          } else {
            // Last attempt - try force click
            try {
              await continueButton.click({ force: true });
              clickSuccess = true;
              console.log('Force clicked Continue button');
            } catch (forceError) {
              // Try JavaScript click as final fallback
              try {
                await casePage.evaluate((el) => el.click(), continueButton);
                clickSuccess = true;
                console.log('JavaScript clicked Continue button');
              } catch (jsError) {
                console.error('All click methods failed');
              }
            }
          }
        }
      }
      
      if (!clickSuccess) {
        console.error(`Failed to click Continue button for update ${updateId}`);
        return false;
      }
      
      // Wait for modal to close with retry
      try {
        await casePage.waitForSelector('#formModal', { 
          state: 'hidden',
          timeout: 20000 
        });
      } catch (error) {
        console.log('Modal close timeout, checking if already closed...');
        const modalVisible = await casePage.isVisible('#formModal');
        if (modalVisible) {
          console.error('Modal still visible after timeout');
          // Try to force close
          await casePage.evaluate(() => {
            const modal = document.querySelector('#formModal');
            if (modal) {
              modal.style.display = 'none';
              document.body.classList.remove('modal-open');
              const backdrop = document.querySelector('.modal-backdrop');
              if (backdrop) backdrop.remove();
            }
          });
          await casePage.waitForTimeout(500);
        }
      }
      
      // Wait for the span text to change to "Visible"
      try {
        await casePage.waitForFunction(
          (updateId) => {
            const span = document.querySelector(`#visiblestate_${updateId}`);
            return span && span.textContent?.trim() === 'Visible';
          },
          updateId,
          { timeout: 5000 }
        );
        
        // Double-check the status
        const visibilitySpan = await casePage.$(`#visiblestate_${updateId}`);
        const newStatus = await visibilitySpan?.textContent();
        const success = newStatus?.trim() === 'Visible';
        
        if (success) {
          console.log(`Successfully toggled visibility for update ${updateId}`);
        } else {
          console.error(`Failed to verify visibility change for update ${updateId}. Current status: ${newStatus}`);
        }
        
        return success;
      } catch (timeoutError) {
        console.error(`Timeout waiting for visibility change for update ${updateId}`);
        // Check final status anyway
        const visibilitySpan = await casePage.$(`#visiblestate_${updateId}`);
        const finalStatus = await visibilitySpan?.textContent();
        const isVisible = finalStatus?.trim() === 'Visible';
        
        if (isVisible) {
          console.log(`Update ${updateId} is now visible despite timeout`);
          return true;
        }
        
        return false;
      }
    } catch (error) {
      console.error(`Error toggling visibility for update ${updateId}:`, error);
      return false;
    }
  }

  /**
   * Process all invisible agent updates in a case
   */
  async processCase(casePage: Page, caseId: string): Promise<ProcessCaseResult> {
    try {
      // Load all updates
      const allLoaded = await this.loadAllUpdates(casePage);
      
      if (!allLoaded) {
        return {
          caseId,
          updatesProcessed: 0,
          success: false,
          error: 'Failed to load all updates'
        };
      }
      
      // Find invisible agent updates
      const invisibleUpdates = await this.findInvisibleAgentUpdates(casePage);
      
      if (invisibleUpdates.length === 0) {
        console.log(`No invisible agent updates found for case ${caseId}`);
        return {
          caseId,
          updatesProcessed: 0,
          success: true
        };
      }
      
      console.log(`Found ${invisibleUpdates.length} invisible agent updates from Professional Towing for case ${caseId}`);
      
      // Toggle visibility for each update
      let processedCount = 0;
      let companyName: string | undefined;
      let combinedUpdateText = '';
      
      for (const update of invisibleUpdates) {
        const toggled = await this.toggleUpdateVisibility(casePage, update.updateId);
        
        if (toggled) {
          processedCount++;
          console.log(`Toggled visibility for update ${update.updateId} from company: ${update.company}`);
          
          // Store company name from first processed update
          if (!companyName && update.company) {
            companyName = update.company;
          }
          
          // Combine update texts (with separator if multiple)
          if (update.updateText) {
            if (combinedUpdateText) {
              combinedUpdateText += ' | '; // Separator between multiple updates
            }
            combinedUpdateText += update.updateText;
          }
        } else {
          console.error(`Failed to toggle visibility for update ${update.updateId} from company: ${update.company}`);
        }
        
        // Small delay between updates to avoid overwhelming the server
        await casePage.waitForTimeout(1000);
      }
      
      // Truncate combined update text if too long (database field limit)
      if (combinedUpdateText.length > 5000) {
        combinedUpdateText = combinedUpdateText.substring(0, 4997) + '...';
      }
      
      return {
        caseId,
        updatesProcessed: processedCount,
        company: companyName,
        updateText: combinedUpdateText || undefined,
        success: processedCount === invisibleUpdates.length
      };
    } catch (error) {
      console.error(`Error processing case ${caseId}:`, error);
      return {
        caseId,
        updatesProcessed: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Close case tab and return to new updates page
   */
  async closeCaseTab(casePage: Page): Promise<void> {
    try {
      await casePage.close();
    } catch (error) {
      console.error('Error closing case tab:', error);
    }
  }
}

export const rdnVisibilityService = new RDNVisibilityService();