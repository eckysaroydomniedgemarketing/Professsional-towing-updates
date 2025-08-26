import { Page } from 'playwright';

export async function navigateToCase(page: Page, caseId: string) {
  try {
    console.log(`Navigating to case ${caseId}...`);
    
    // Direct navigation to case URL
    const caseUrl = `https://app.recoverydatabase.net/alpha_rdn/module/default/case2/?tab=1&case_id=${caseId}`;
    await page.goto(caseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for case page to load - check for tabs that indicate case detail page
    await page.waitForSelector('#tab_6, [onclick*="switchTab(6)"], #tab_1', { 
      state: 'visible',
      timeout: 10000 
    });
    
    console.log(`Successfully navigated to case ${caseId}`);
    
    return {
      success: true,
      page: page
    };
  } catch (error) {
    console.error(`Failed to navigate to case ${caseId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Navigation failed'
    };
  }
}