import { Page } from 'playwright';
import { CaseUpdateHistory } from '../types';
import { cleanText } from './text-utils';

const EXCLUSION_KEYWORDS = ['DRN', 'LPR', 'GPS', 'Surrender'];

// Extract update history (when available)
export async function extractUpdates(page: Page, caseId: string): Promise<CaseUpdateHistory[]> {
  const updates: CaseUpdateHistory[] = [];
  
  // Wait for content to load in #ContentLoader after switchTab
  try {
    // First wait for ContentLoader to exist
    await page.waitForSelector('#ContentLoader', { timeout: 10000 });
    
    // Wait a bit for dynamic content to load
    await page.waitForTimeout(2000);
    
    // Check for pagination and click "ALL" if available
    const paginationExists = await page.$('.js-update-pagination');
    if (paginationExists) {
      console.log('Pagination found, looking for ALL button...');
      
      // Find and click the ALL button
      const allButton = await page.$('a[data-page="ALL"]');
      if (allButton) {
        console.log('Clicking ALL button to show all updates...');
        await allButton.click();
        
        // Wait for loading indicator to appear and disappear
        try {
          await page.waitForSelector('#loading', { state: 'visible', timeout: 5000 });
          await page.waitForSelector('#loading', { state: 'hidden', timeout: 15000 });
        } catch {
          // Loading indicator might not always show, continue anyway
          console.log('Loading indicator not detected, continuing...');
        }
        
        // Extra wait for content to fully render
        await page.waitForTimeout(3000);
      } else {
        console.log('ALL button not found, extracting visible updates only');
      }
    }
    
    // Look for update containers with the pattern div[id^="updatearea_"]
    await page.waitForSelector('div[id^="updatearea_"]', { timeout: 10000 });
  } catch (error) {
    console.log('Updates content not loaded, trying alternative selectors...');
    
    // Try alternative: look for "Last Two Updates" section
    try {
      await page.waitForSelector('#listing_last2updates', { timeout: 5000 });
    } catch {
      console.log('No updates found or updates section not loaded');
      return updates;
    }
  }
  
  // Find all update containers
  const updateContainers = await page.$$('div[id^="updatearea_"]');
  console.log(`Found ${updateContainers.length} update containers`);
  
  for (const container of updateContainers) {
    const update: CaseUpdateHistory = {
      case_id: caseId,
      update_date: null,
      update_type: null,
      update_author: null,
      update_content: null,
      address_associated: null,
      contains_exclusion_keyword: false,
      exclusion_keywords: null,
      is_visible: true
    };

    // Extract update date - try multiple selectors
    const dateElement = await container.$('dt:has-text("Updated Date/Time") + dd');
    if (dateElement) {
      update.update_date = await dateElement.textContent() || null;
    } else {
      // Fallback: try "Saved to RDN" date
      const savedDateElement = await container.$('dt:has-text("Saved to RDN") + dd');
      if (savedDateElement) {
        update.update_date = await savedDateElement.textContent() || null;
      }
    }

    // Extract update type
    const typeElement = await container.$('dt:has-text("Update Type") + dd');
    if (typeElement) {
      update.update_type = await typeElement.textContent() || null;
    }

    // Extract update author
    const authorElement = await container.$('dt:has-text("Last Updated By") + dd');
    if (authorElement) {
      update.update_author = await authorElement.textContent() || null;
    }

    // Extract update content/details
    const contentElement = await container.$('dt:has-text("Details") + dd');
    if (contentElement) {
      update.update_content = await contentElement.textContent() || null;
      
      // Check for exclusion keywords
      if (update.update_content) {
        const foundKeywords = EXCLUSION_KEYWORDS.filter(keyword => 
          update.update_content!.includes(keyword)
        );
        
        if (foundKeywords.length > 0) {
          update.contains_exclusion_keyword = true;
          update.exclusion_keywords = foundKeywords;
        }
      }
    }

    // Extract address if present
    const addressElement = await container.$('dt:has-text("Address") + dd');
    if (addressElement) {
      update.address_associated = await addressElement.textContent() || null;
    }

    // Check for visibility indicators in content
    if (update.update_content && update.update_content.includes('Not Visible')) {
      update.is_visible = false;
    }

    // Clean up extracted text
    if (update.update_date) update.update_date = cleanText(update.update_date);
    if (update.update_type) update.update_type = cleanText(update.update_type);
    if (update.update_author) update.update_author = cleanText(update.update_author);
    if (update.update_content) update.update_content = cleanText(update.update_content);

    updates.push(update);
  }

  // Handle pagination if needed (MVP - just check for it)
  const paginationExists = await page.$('select[name*="_length"], .dataTables_paginate');
  if (paginationExists) {
    console.log('Pagination detected - extracting visible updates only (MVP)');
  }

  console.log(`Extracted ${updates.length} updates`);
  return updates;
}

// Extract Additional Information from My Summary tab
export async function extractAdditionalInfo(page: Page, caseId: string): Promise<string | null> {
  try {
    // Wait for the Additional Information section to be present
    const additionalInfoElement = await page.$('#additional_info');
    
    if (additionalInfoElement) {
      const additionalInfoText = await additionalInfoElement.textContent();
      console.log(`Additional Information extracted for case ${caseId}:`, additionalInfoText);
      
      // Clean and return the text
      return cleanText(additionalInfoText);
    } else {
      console.log(`No Additional Information found for case ${caseId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error extracting Additional Information for case ${caseId}:`, error);
    return null;
  }
}