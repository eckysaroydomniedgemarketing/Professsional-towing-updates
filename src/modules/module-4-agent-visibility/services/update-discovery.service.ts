import { Page, ElementHandle } from 'playwright';
import type { UpdateElement } from '../types';

export class UpdateDiscoveryService {
  /**
   * Find all agent updates that are not visible
   */
  async findInvisibleAgentUpdates(casePage: Page): Promise<UpdateElement[]> {
    try {
      const updates: UpdateElement[] = [];
      
      // Find all update containers
      const updateContainers = await casePage.$$('div.update_content');
      console.log(`Found ${updateContainers.length} update containers`);
      
      for (const container of updateContainers) {
        // Check if update is by an agent - look for "Last Updated By" field
        const authorLabel = await container.$('dt:has-text("Last Updated By")');
        if (!authorLabel) {
          continue; // No author field found
        }
        
        // Get the author value (next dd element)
        const authorValue = await container.$('dt:has-text("Last Updated By") + dd');
        const authorText = await authorValue?.textContent();
        
        if (!authorText || !authorText.includes('(Agent)')) {
          continue; // Not an agent update
        }
        
        console.log(`Found agent update by: ${authorText}`);
        
        // Extract and validate company
        let companyName: string | undefined;
        const companyLabel = await container.$('dt:has-text("Company")');
        if (companyLabel) {
          const companyValue = await container.$('dt:has-text("Company") + dd');
          companyName = (await companyValue?.textContent()) || undefined;
          
          // Flexible company matching - check for "professional towing" (case-insensitive)
          const isValidCompany = /professional\s+towing/i.test(companyName || '');
          
          if (!isValidCompany) {
            console.log(`Skipping update - company "${companyName}" doesn't match "Professional Towing"`);
            continue;
          }
          
          console.log(`Valid company found: ${companyName}`);
        } else {
          // No company field found, skip this update
          console.log('No company field found in update, skipping...');
          continue;
        }
        
        // Extract update text content
        let updateText = await this.extractUpdateText(container);
        
        // Find visibility button with "Not Visible" text
        const visibilityButton = await container.$('button.js-visible:has(span:has-text("Not Visible"))');
        
        if (!visibilityButton) {
          console.log('Update is already visible or button not found');
          continue; // Already visible or button not found
        }
        
        // Extract update ID from multiple sources
        const updateId = await this.extractUpdateId(container, visibilityButton);
        
        if (updateId) {
          updates.push({
            updateId: updateId,
            authorElement: authorValue!,
            visibilityButton: visibilityButton,
            company: companyName,
            updateText: updateText,
            isAgent: true,
            isVisible: false
          });
          console.log(`Found agent update ${updateId} from company "${companyName}" marked as Not Visible`);
        }
      }
      
      console.log(`Total invisible agent updates found: ${updates.length}`);
      return updates;
    } catch (error) {
      console.error('Error finding invisible agent updates:', error);
      return [];
    }
  }

  /**
   * Extract update text from container
   */
  private async extractUpdateText(container: ElementHandle): Promise<string | undefined> {
    let updateText: string | undefined;
    
    // Try multiple selectors for update text
    const textSelectors = [
      'dd[id$="_view_comments"]',  // Primary: dd with ID ending in _view_comments
      'dt:has-text("Details") + dd', // Secondary: dd following Details label
      'dd[class*="update-text-"]'    // Tertiary: dd with update-text class
    ];
    
    for (const selector of textSelectors) {
      const updateContentElement = await container.$(selector);
      if (updateContentElement) {
        updateText = (await updateContentElement.textContent()) || undefined;
        if (updateText) {
          // Clean up the text - remove extra whitespace and HTML entities
          updateText = updateText.trim().replace(/\s+/g, ' ');
          console.log(`Extracted update text using selector "${selector}" (first 100 chars): ${updateText.substring(0, 100)}...`);
          break; // Stop once we find text
        }
      }
    }
    
    if (!updateText) {
      console.log('Warning: Could not extract update text with any selector');
    }
    
    return updateText;
  }

  /**
   * Extract update ID from multiple sources
   */
  private async extractUpdateId(container: ElementHandle, visibilityButton: ElementHandle): Promise<string | null> {
    let updateId = null;
    
    // Try from onclick attribute
    const onclickAttr = await visibilityButton.getAttribute('onclick');
    const onclickMatch = onclickAttr?.match(/toggleVisibleUpdate\((\d+)\)/);
    if (onclickMatch) {
      updateId = onclickMatch[1];
    }
    
    // Fallback: Extract from span ID
    if (!updateId) {
      const spanElement = await container.$('span[id^="visiblestate_"]');
      const spanId = await spanElement?.getAttribute('id');
      const spanMatch = spanId?.match(/visiblestate_(\d+)/);
      if (spanMatch) {
        updateId = spanMatch[1];
      }
    }
    
    // Fallback: Extract from container ID
    if (!updateId) {
      const containerId = await container.getAttribute('id');
      const containerMatch = containerId?.match(/updatearea_(\d+)/);
      if (containerMatch) {
        updateId = containerMatch[1];
      }
    }
    
    return updateId;
  }
}