import { Page } from 'playwright';
import { CaseDetails } from '../types';

export class CaseStatusService {
  private page: Page | null = null;
  
  /**
   * Set the Playwright page instance
   */
  setPage(page: Page) {
    this.page = page;
  }
  
  async changeStatusToClose(): Promise<boolean> {
    if (!this.page) {
      console.error('[PENDING-CLOSE] Page not initialized for status change');
      return false;
    }
    
    try {
      // Log current page URL for debugging
      console.log(`[PENDING-CLOSE] Current page URL: ${this.page.url()}`);
      
      // Wait for the page to fully load
      await this.page.waitForLoadState('networkidle');
      
      // Wait for status dropdown to be available
      const statusSelector = 'select#status_static';
      await this.page.waitForSelector(statusSelector, { timeout: 10000 });
      console.log('[PENDING-CLOSE] Found status dropdown');
      
      // Get current status value before change
      const currentStatus = await this.page.locator(statusSelector).inputValue();
      console.log(`[PENDING-CLOSE] Current status: ${currentStatus}`);
      
      // Select "Closed" from dropdown
      await this.page.selectOption(statusSelector, 'Closed');
      console.log('[PENDING-CLOSE] Selected "Closed" status');
      
      // Wait for modal dialog to appear after status change
      await this.page.waitForTimeout(1000);
      console.log('[PENDING-CLOSE] Waiting for modal dialog to appear...');
      
      // Wait for the modal submit button
      const modalSubmitSelector = 'input.btn-warning[value="Submit"]';
      await this.page.waitForSelector(modalSubmitSelector, { timeout: 10000 });
      console.log('[PENDING-CLOSE] Modal dialog appeared with submit button');
      
      // Click the submit button in modal
      await this.page.click(modalSubmitSelector);
      console.log('[PENDING-CLOSE] Clicked submit button in modal dialog');
      
      // Wait for the change to process (page reloads after submit)
      await this.page.waitForTimeout(3000);
      
      console.log('[PENDING-CLOSE] Status change completed successfully');
      return true;
      
    } catch (error) {
      console.error('[PENDING-CLOSE] Error changing status:', error);
      return false;
    }
  }
  
  async extractCaseDetails(): Promise<CaseDetails | null> {
    if (!this.page) {
      console.error('[PENDING-CLOSE] Page not initialized for extraction');
      return null;
    }
    
    try {
      // Wait for page to load and case header to appear
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForSelector('h5:has-text("Case #")', { timeout: 5000 }).catch(() => {});
      
      // Extract case ID from URL
      const url = this.page.url();
      const caseIdMatch = url.match(/case_id=(\d+)/);
      const caseId = caseIdMatch ? caseIdMatch[1] : '';
      
      // Extract VIN - try multiple selectors
      let vin = '';
      const vinSelectors = [
        'span.text-uppercase',
        'td:contains("VIN")',
        'td:has-text("VIN")',
        '[data-vin]'
      ];
      
      for (const selector of vinSelectors) {
        try {
          // Use evaluate to search for VIN in the page
          vin = await this.page.evaluate(() => {
            // Look for VIN in various formats
            const vinPatterns = [
              /VIN[:\s]+([A-Z0-9]{17})/i,
              /\b[A-HJ-NPR-Z0-9]{17}\b/
            ];
            
            const text = document.body.innerText;
            for (const pattern of vinPatterns) {
              const match = text.match(pattern);
              if (match) {
                return match[1] || match[0];
              }
            }
            
            // Look for span with uppercase text (common for VINs)
            const spans = document.querySelectorAll('span.text-uppercase');
            for (const span of spans) {
              const content = span.textContent?.trim();
              if (content && content.length === 17) {
                return content;
              }
            }
            
            return '';
          });
          
          if (vin) break;
        } catch (e) {
          // Try next method
        }
      }
      
      // Extract current status
      let status = '';
      try {
        status = await this.page.evaluate(() => {
          // Try to get from select dropdown first
          const select = document.querySelector('select#status_static, select[name="status"]') as HTMLSelectElement;
          if (select && select.selectedOptions.length > 0) {
            return select.selectedOptions[0].text;
          }
          
          // Try badge elements
          const badges = document.querySelectorAll('[class*="badge-"]');
          for (const badge of badges) {
            const text = badge.textContent?.trim();
            if (text && (text.includes('Close') || text.includes('Open') || text.includes('Hold'))) {
              return text;
            }
          }
          
          return '';
        });
      } catch (e) {
        console.error('[PENDING-CLOSE] Error extracting status:', e);
      }
      
      console.log(`[PENDING-CLOSE] Extracted - Case: ${caseId}, VIN: ${vin}, Status: ${status}`);
      
      return {
        caseId,
        vin,
        status
      };
      
    } catch (error) {
      console.error('[PENDING-CLOSE] Error extracting case details:', error);
      return null;
    }
  }
  
  async verifyStatusChange(): Promise<boolean> {
    if (!this.page) return false;
    
    try {
      // Wait for any status badge to update
      await this.page.waitForTimeout(1000);
      
      // Check if status is now "Closed"
      const statusSelectors = [
        '.badge-close',
        'span:has-text("Closed")',
        'select#status_static option:checked:has-text("Closed")'
      ];
      
      for (const selector of statusSelectors) {
        try {
          const element = await this.page.locator(selector).first();
          if (await element.count() > 0) {
            console.log('[PENDING-CLOSE] Status change verified - now showing "Closed"');
            return true;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      // Also check if the select value is "Closed"
      const selectValue = await this.page.locator('select#status_static, select[name="status"]').first().inputValue();
      if (selectValue === 'Closed') {
        console.log('[PENDING-CLOSE] Status change verified via select value');
        return true;
      }
      
      console.warn('[PENDING-CLOSE] Could not verify status change to Closed');
      return false;
      
    } catch (error) {
      console.error('[PENDING-CLOSE] Error verifying status:', error);
      return false;
    }
  }
}