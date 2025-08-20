import { Page } from 'playwright';
import { ExtractionResult } from './types';
import {
  createProcessingSession,
  updateSessionStatus,
  insertCaseUpdate,
  insertCaseDetails,
  insertVehicle,
  insertAddresses,
  insertUpdateHistory,
  checkZipCodeCoverage
} from './services/database';
import {
  extractCaseDetails,
  extractVehicle,
  extractAddresses,
  extractUpdates,
  extractAdditionalInfo
} from './utils/extractors';

/**
 * Main function to extract all case data from My Summary and Updates tabs and store in database
 * @param caseId - The case ID to extract data for
 * @param page - Playwright page object (starts on My Summary tab)
 * @param isOnMySummary - Whether the page is currently on My Summary tab (default: true)
 * @returns ExtractionResult with success status
 */
export async function extractCaseData(
  caseId: string, 
  page: Page,
  isOnMySummary: boolean = true
): Promise<ExtractionResult> {
  let recordsInserted = 0;
  let sessionId: string | null = null;
  
  try {
    console.log(`Starting data extraction for case ${caseId}`);
    
    // Create a new processing session
    sessionId = await createProcessingSession(caseId, 'module-2');
    console.log(`Created session ${sessionId} for case ${caseId}`);
    
    // Simple wait strategy for MVP - avoid complex state checking that can timeout
    console.log('Waiting for page to stabilize...');
    await page.waitForTimeout(3000);
    
    // Check if key elements are present but don't fail if not found
    if (isOnMySummary) {
      try {
        await page.waitForSelector('.section__main', { timeout: 2000 });
        console.log('My Summary page structure detected');
      } catch {
        console.log('Warning: My Summary page structure not fully loaded, continuing anyway');
      }
    }
    
    // Step 0: Insert parent record in case_updates table
    console.log('Creating case update record...');
    const status = 'Open'; // Default status for new cases
    await insertCaseUpdate(caseId, status);
    recordsInserted++;
    
    // Step 1: Extract case details with session ID
    // If we're on My Summary tab, extract Additional Info first
    console.log('Extracting case details...');
    let caseDetails: any;
    
    if (isOnMySummary) {
      console.log('On My Summary tab - extracting Additional Information...');
      
      // Check if Additional Info element exists before extraction
      const hasAdditionalInfo = await page.$('#additional_info');
      if (hasAdditionalInfo) {
        console.log('Additional Information element found');
      } else {
        console.log('Warning: Additional Information element not found, will extract other data');
      }
      
      // Extract case details including Additional Info from My Summary
      caseDetails = await extractCaseDetails(page, caseId);
      
      // Now navigate to Updates tab for remaining extraction
      console.log('Clicking Updates tab...');
      const updatesTab = await page.$('#tab_6 a, [onclick*="switchTab(6)"]');
      if (updatesTab) {
        await updatesTab.click();
        
        // Simple wait for tab switch - no complex state checking
        await page.waitForTimeout(3000);
        
        // Try to wait for Updates tab content but don't fail
        try {
          await page.waitForSelector('#ContentLoader', { timeout: 2000 });
          console.log('Updates tab content area detected');
        } catch {
          console.log('Warning: Updates tab content not fully loaded, continuing anyway');
        }
      } else {
        console.log('Warning: Could not find Updates tab button');
      }
    } else {
      // Already on Updates tab, just extract case details
      caseDetails = await extractCaseDetails(page, caseId);
    }
    
    await insertCaseDetails(caseDetails, sessionId);
    recordsInserted++;
    
    // Step 2: Extract vehicle information with session ID
    console.log('Extracting vehicle information...');
    const vehicle = await extractVehicle(page, caseId);
    await insertVehicle(vehicle, sessionId);
    recordsInserted++;
    
    // Step 3: Extract addresses with session ID
    console.log('Extracting addresses...');
    const addresses = await extractAddresses(page, caseId);
    
    // Check ZIP code coverage for each address
    for (const address of addresses) {
      if (address.zip_code) {
        address.is_covered = await checkZipCodeCoverage(address.zip_code);
        console.log(`ZIP ${address.zip_code} coverage check: ${address.is_covered ? 'COVERED' : 'NOT COVERED'}`);
      }
    }
    
    if (addresses.length > 0) {
      await insertAddresses(addresses, sessionId);
      recordsInserted += addresses.length;
    }
    
    // Step 4: Extract update history with session ID
    console.log('Extracting update history...');
    const updates = await extractUpdates(page, caseId);
    
    if (updates.length > 0) {
      await insertUpdateHistory(updates, sessionId);
      recordsInserted += updates.length;
    }
    
    // Mark session as completed
    await updateSessionStatus(sessionId, 'completed', {
      recordsInserted,
      extractionTime: new Date().toISOString()
    });
    
    console.log(`Data extraction completed. ${recordsInserted} records inserted.`);
    
    return {
      success: true,
      caseId: caseId,
      recordsInserted: recordsInserted,
      sessionId: sessionId
    };
    
  } catch (error) {
    console.error('Error during data extraction:', error);
    
    // Mark session as failed if it was created
    if (sessionId) {
      await updateSessionStatus(sessionId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return {
      success: false,
      caseId: caseId,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Export for use by Module 1
export default extractCaseData;