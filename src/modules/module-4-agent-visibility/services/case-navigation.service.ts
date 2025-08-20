import { Page } from 'playwright';

export class CaseNavigationService {
  /**
   * Navigate to new updates page
   */
  async navigateToNewUpdates(page: Page): Promise<boolean> {
    try {
      await page.goto(
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
  async getFirstCase(page: Page): Promise<string | null> {
    try {
      // Find the first "View Case And Remove From List" button
      const firstCaseButton = await page.$('a.btn-secondary.js-remove-new');
      
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
  async openCaseInNewTab(page: Page, caseId: string): Promise<Page | null> {
    try {
      // Click the "View Case And Remove From List" button
      const selector = `a.btn-secondary.js-remove-new[href*="case_id=${caseId}"]`;
      
      // Wait for new page to open
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.click(selector)
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
   * Load all updates by clicking "ALL" in pagination
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