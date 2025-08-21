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
   * Validates session is still active by checking the opened page URL
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
      
      // Validate session by checking if we're on the expected case page
      const currentUrl = newPage.url();
      const expectedUrlPattern = `/alpha_rdn/module/default/case2/?tab=6&case_id=${caseId}`;
      
      // Check if URL contains the expected pattern
      if (!currentUrl.includes(`case_id=${caseId}`) || !currentUrl.includes('/case2/')) {
        // Check if it's a login page (session lost)
        if (currentUrl.includes('/login') || currentUrl.includes('sign') || currentUrl.includes('auth')) {
          console.error(`Session lost! Redirected to login page instead of case ${caseId}`);
          throw new Error(`SESSION_LOST: Session expired while opening case ${caseId}. Please re-login.`);
        }
        
        console.error(`Unexpected page opened. Expected case ${caseId}, got: ${currentUrl}`);
        throw new Error(`SESSION_ERROR: Failed to open case ${caseId}. Unexpected page loaded.`);
      }
      
      console.log(`Successfully opened case ${caseId}`);
      return newPage;
    } catch (error) {
      // Re-throw session errors to be handled by workflow manager
      if (error instanceof Error && error.message.startsWith('SESSION_')) {
        throw error;
      }
      
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