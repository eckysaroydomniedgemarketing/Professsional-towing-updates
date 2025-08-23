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
  
  async changeStatusToHold(): Promise<boolean> {
    if (!this.page) {
      console.error('[ON-HOLD] Page not initialized for status change');
      return false;
    }
    
    try {
      // Wait for status dropdown to be available
      const statusSelector = 'select#status_static, select[name="status"]';
      await this.page.waitForSelector(statusSelector, { timeout: 10000 });
      
      // Select "Hold" from dropdown
      await this.page.selectOption(statusSelector, 'Hold');
      console.log('[ON-HOLD] Selected "Hold" status');
      
      // Wait a moment for any onChange handlers
      await this.page.waitForTimeout(500);
      
      // Find and click submit/change button
      const submitButton = await this.page.locator('button:has-text("Change"), button:has-text("Submit"), button[type="submit"]').first();
      if (submitButton) {
        await submitButton.click();
        console.log('[ON-HOLD] Clicked submit button');
        
        // Wait for the change to process
        await this.page.waitForTimeout(2000);
        
        // Verify the change
        const verified = await this.verifyStatusChange();
        return verified;
      }
      
      console.error('[ON-HOLD] Submit button not found');
      return false;
      
    } catch (error) {
      console.error('[ON-HOLD] Error changing status:', error);
      return false;
    }
  }
  
  async extractCaseDetails(): Promise<CaseDetails | null> {
    if (!this.page) {
      console.error('[ON-HOLD] Page not initialized for extraction');
      return null;
    }
    
    try {
      // Extract case ID from URL
      const url = this.page.url();
      const caseIdMatch = url.match(/case_id=(\d+)/);
      const caseId = caseIdMatch ? caseIdMatch[1] : '';
      
      // Extract VIN - try multiple selectors
      let vin = '';
      const vinSelectors = [
        'span.text-uppercase',
        'td:has-text("VIN") + td',
        '[data-vin]',
        'td:has-text("VIN:") + td'
      ];
      
      for (const selector of vinSelectors) {
        try {
          const vinElement = await this.page.locator(selector).first();
          if (await vinElement.count() > 0) {
            vin = await vinElement.textContent() || '';
            vin = vin.trim();
            if (vin) break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      // Extract current status
      let status = '';
      const statusSelectors = [
        '.badge-open, .badge-close, .badge-hold, [class*="badge-"]',
        '#case_status_static span',
        'select#status_static option:checked'
      ];
      
      for (const selector of statusSelectors) {
        try {
          const statusElement = await this.page.locator(selector).first();
          if (await statusElement.count() > 0) {
            status = await statusElement.textContent() || '';
            status = status.trim();
            if (status) break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      console.log(`[ON-HOLD] Extracted - Case: ${caseId}, VIN: ${vin}, Status: ${status}`);
      
      return {
        caseId,
        vin,
        status
      };
      
    } catch (error) {
      console.error('[ON-HOLD] Error extracting case details:', error);
      return null;
    }
  }
  
  async verifyStatusChange(): Promise<boolean> {
    if (!this.page) return false;
    
    try {
      // Wait for any status badge to update
      await this.page.waitForTimeout(1000);
      
      // Check if status is now "Hold"
      const statusSelectors = [
        '.badge-hold',
        'span:has-text("Hold")',
        'select#status_static option:checked:has-text("Hold")'
      ];
      
      for (const selector of statusSelectors) {
        try {
          const element = await this.page.locator(selector).first();
          if (await element.count() > 0) {
            console.log('[ON-HOLD] Status change verified - now showing "Hold"');
            return true;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      // Also check if the select value is "Hold"
      const selectValue = await this.page.locator('select#status_static, select[name="status"]').first().inputValue();
      if (selectValue === 'Hold') {
        console.log('[ON-HOLD] Status change verified via select value');
        return true;
      }
      
      console.warn('[ON-HOLD] Could not verify status change to Hold');
      return false;
      
    } catch (error) {
      console.error('[ON-HOLD] Error verifying status:', error);
      return false;
    }
  }
}