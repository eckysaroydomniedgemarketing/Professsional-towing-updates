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
  extractAdditionalInfo,
  InvoiceProcessorService
} from './utils/extractors';

/**
 * Main function to extract all case data from My Summary, Invoices, and Updates tabs and store in database
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
  let photoCount = 0;
  let paymentCount = 0;
  
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
    
    // Step 1: Extract case details first to get status
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
      
      // Validate that status was extracted early for invoice processing
      if (!caseDetails.status) {
        const errorMsg = `Failed to extract status for case ${caseId}. Cannot proceed with data extraction.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Insert parent record in case_updates table BEFORE invoice processing (needed for photos FK)
      console.log(`Creating case update record with status: ${caseDetails.status}`);
      await insertCaseUpdate(caseId, caseDetails.status);
      recordsInserted++;
      
      // Navigate to Invoices tab to extract invoice data
      console.log('Navigating to Invoices tab...');
      const invoiceProcessor = new InvoiceProcessorService(page);
      const invoiceResult = await invoiceProcessor.processInvoicesForCase(caseId);
      
      if (invoiceResult.success) {
        console.log(`Invoice extraction: ${invoiceResult.message}`);
        recordsInserted += invoiceResult.itemCount;
        
        // Store and log photo and payment extraction results
        photoCount = invoiceResult.photoCount || 0;
        paymentCount = invoiceResult.paymentCount || 0;
        
        if (photoCount > 0) {
          console.log(`Extracted ${photoCount} vehicle photos`);
        }
        if (paymentCount > 0) {
          console.log(`Extracted ${paymentCount} adjuster payments`);
        }
      } else {
        console.log(`Warning: Invoice extraction failed: ${invoiceResult.message}`);
      }
      
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
      
      // Validate that status was extracted
      if (!caseDetails.status) {
        const errorMsg = `Failed to extract status for case ${caseId}. Cannot proceed with data extraction.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Insert parent record in case_updates table (needed for FK constraints)
      console.log(`Creating case update record with status: ${caseDetails.status}`);
      await insertCaseUpdate(caseId, caseDetails.status);
      recordsInserted++;
    }
    
    await insertCaseDetails(caseDetails, sessionId);
    recordsInserted++;
    
    // Step 2: Extract vehicle information - TEMPORARILY COMMENTED OUT
    console.log('Vehicle information extraction temporarily disabled');
    /*
    console.log('Extracting vehicle information...');
    const vehicle = await extractVehicle(page, caseId);
    await insertVehicle(vehicle, sessionId);
    recordsInserted++;
    */
    
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
    
    console.log(`Data extraction completed. ${recordsInserted} records inserted, ${photoCount} photos, ${paymentCount} payments.`);
    
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