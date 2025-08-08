import { Page } from 'playwright';
import { ExtractionResult } from './types';
import {
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
  extractUpdates
} from './utils/extractors';

/**
 * Main function to extract all case data from Updates tab and store in database
 * @param caseId - The case ID to extract data for
 * @param page - Playwright page object positioned on Updates tab
 * @returns ExtractionResult with success status
 */
export async function extractCaseData(
  caseId: string, 
  page: Page
): Promise<ExtractionResult> {
  let recordsInserted = 0;
  
  try {
    console.log(`Starting data extraction for case ${caseId}`);
    
    // Wait for page to be fully loaded before extraction
    console.log('Waiting for page to fully load...');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    
    // Additional wait to ensure dynamic content is loaded
    await page.waitForTimeout(2000);
    
    // Step 0: Insert parent record in case_updates table
    console.log('Creating case update record...');
    const status = 'Open'; // Default status for new cases
    await insertCaseUpdate(caseId, status);
    recordsInserted++;
    
    // Step 1: Extract case details
    console.log('Extracting case details...');
    const caseDetails = await extractCaseDetails(page, caseId);
    await insertCaseDetails(caseDetails);
    recordsInserted++;
    
    // Step 2: Extract vehicle information
    console.log('Extracting vehicle information...');
    const vehicle = await extractVehicle(page, caseId);
    await insertVehicle(vehicle);
    recordsInserted++;
    
    // Step 3: Extract addresses
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
      await insertAddresses(addresses);
      recordsInserted += addresses.length;
    }
    
    // Step 4: Extract update history
    console.log('Extracting update history...');
    const updates = await extractUpdates(page, caseId);
    
    if (updates.length > 0) {
      await insertUpdateHistory(updates);
      recordsInserted += updates.length;
    }
    
    console.log(`Data extraction completed. ${recordsInserted} records inserted.`);
    
    return {
      success: true,
      caseId: caseId,
      recordsInserted: recordsInserted
    };
    
  } catch (error) {
    console.error('Error during data extraction:', error);
    
    return {
      success: false,
      caseId: caseId,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Export for use by Module 1
export default extractCaseData;