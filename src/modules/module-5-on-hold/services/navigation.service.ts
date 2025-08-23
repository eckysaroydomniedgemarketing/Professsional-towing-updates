import { Page } from 'playwright';

export class NavigationService {
  private page: Page | null = null;
  private baseUrl = 'https://app.recoverydatabase.net';
  
  /**
   * Set the Playwright page instance
   */
  setPage(page: Page) {
    this.page = page;
  }
  
  async navigateToPendingOnHold(): Promise<boolean> {
    if (!this.page) {
      console.error('[ON-HOLD] Page not initialized');
      return false;
    }
    
    try {
      const url = `${this.baseUrl}/v2/main/view_cases.php?status=Pending+On+Hold`;
      
      // Try to navigate within the mainFrame if it exists
      const mainFrame = this.page.frame({ name: 'mainFrame' });
      if (mainFrame) {
        await mainFrame.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      } else {
        // If no frame, navigate the main page
        await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      }
      
      // Wait for cases to load
      await this.page.waitForTimeout(2000);
      
      console.log('[ON-HOLD] Successfully navigated to Pending On Hold page');
      return true;
    } catch (error) {
      console.error('[ON-HOLD] Navigation error:', error);
      return false;
    }
  }
  
  async openCaseDetail(caseId: string): Promise<boolean> {
    if (!this.page) {
      console.error('[ON-HOLD] Page not initialized');
      return false;
    }
    
    try {
      // Check if we're in an iframe structure
      const mainFrame = this.page.frame({ name: 'mainFrame' });
      const targetFrame = mainFrame || this.page;
      
      // Click on the bold case link (main case link, not the "View Updates" link)
      const caseLink = `a.font-weight-bold[href*="case_id=${caseId}"]:not([href*="tab=6"])`;
      
      // Handle the new tab
      const [newPage] = await Promise.all([
        this.page.context().waitForEvent('page'),
        targetFrame.click(caseLink)
      ]);
      
      if (newPage) {
        await newPage.waitForLoadState('networkidle');
        this.page = newPage; // Switch to the new tab
        console.log(`[ON-HOLD] Opened case ${caseId} in new tab`);
        return true;
      }
      
      // Fallback: try clicking normally if no new page opened
      await targetFrame.click(caseLink);
      await this.page.waitForLoadState('networkidle');
      return true;
      
    } catch (error) {
      console.error('[ON-HOLD] Error opening case:', error);
      return false;
    }
  }
  
  async extractCaseList(): Promise<string[]> {
    if (!this.page) {
      console.error('[ON-HOLD] Page not initialized');
      return [];
    }
    
    try {
      // Check if we're in an iframe structure
      const mainFrame = this.page.frame({ name: 'mainFrame' });
      const targetFrame = mainFrame || this.page;
      
      // Wait for the table to load
      await targetFrame.waitForSelector('table.table', { timeout: 5000 }).catch(() => {});
      
      // Extract case IDs from the table - target the bold case number links
      const caseIds = await targetFrame.evaluate(() => {
        // Look for the bold case links (main case links, not "View Updates")
        const links = document.querySelectorAll('a.font-weight-bold[href*="case_id="]');
        const ids: string[] = [];
        
        links.forEach(link => {
          const href = link.getAttribute('href') || '';
          const match = href.match(/case_id=(\d+)/);
          if (match) {
            ids.push(match[1]);
          }
        });
        
        return ids; // No need to dedupe as we're targeting specific links
      });
      
      console.log(`[ON-HOLD] Found ${caseIds.length} cases`);
      return caseIds;
      
    } catch (error) {
      console.error('[ON-HOLD] Error extracting cases:', error);
      return [];
    }
  }
  
  async closeCurrentTab(): Promise<void> {
    if (!this.page) return;
    
    try {
      const pages = this.page.context().pages();
      if (pages.length > 1) {
        await this.page.close();
        // Switch back to the first page
        this.page = pages[0];
      }
    } catch (error) {
      console.error('[ON-HOLD] Error closing tab:', error);
    }
  }
}