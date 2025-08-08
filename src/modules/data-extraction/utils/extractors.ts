import { Page } from 'playwright';
import { 
  CaseDetails, 
  CaseVehicle, 
  CaseAddress, 
  CaseUpdateHistory 
} from '../types';

const EXCLUSION_KEYWORDS = ['DRN', 'LPR', 'GPS', 'Surrender'];

// Extract case details from the top section
export async function extractCaseDetails(page: Page, caseId: string): Promise<CaseDetails> {
  const details: CaseDetails = {
    case_id: caseId,
    order_date: null,
    ref_number: null,
    order_type: null,
    status: null,
    client: null,
    collector: null,
    lien_holder: null,
    client_account_number: null
  };

  // Extract Order Date
  const orderDateElement = await page.$('dt:has-text("Order Date") + dd');
  if (orderDateElement) {
    details.order_date = await orderDateElement.textContent() || null;
  }

  // Extract Ref Number
  const refNumberElement = await page.$('dt:has-text("Ref. Number") + dd');
  if (refNumberElement) {
    details.ref_number = await refNumberElement.textContent() || null;
  }

  // Extract Order Type - Try both patterns (badge and dropdown)
  // Pattern 1: Try badge/span pattern first
  let orderTypeElement = await page.$('#case_order_type_static span[class*="badge-"]');
  if (orderTypeElement) {
    details.order_type = await orderTypeElement.textContent() || null;
    console.log('Order type extracted from badge pattern:', details.order_type);
  } else {
    // Pattern 2: Try dropdown pattern
    console.log('Badge pattern not found, trying dropdown pattern...');
    
    // Method 1: Get selected option directly
    const selectedOption = await page.$('#orderto option[selected]');
    if (selectedOption) {
      details.order_type = await selectedOption.textContent() || null;
      console.log('Order type extracted from dropdown (selected option):', details.order_type);
    } else {
      // Method 2: Get value from select element
      const selectElement = await page.$('#orderto');
      if (selectElement) {
        details.order_type = await selectElement.evaluate((el: HTMLSelectElement) => {
          return el.options[el.selectedIndex]?.text || null;
        });
        console.log('Order type extracted from dropdown (select value):', details.order_type);
      } else {
        console.log('Order type element not found in either pattern');
      }
    }
  }

  // Extract Status
  const statusElement = await page.$('.badge-open, .badge-repo, .badge-closed');
  if (statusElement) {
    details.status = await statusElement.textContent() || null;
    console.log('Status extracted:', details.status);
  }

  // Extract Client
  const clientElement = await page.$('dt:has-text("Client") + dd');
  if (clientElement) {
    details.client = await clientElement.textContent() || null;
  }

  // Extract Collector
  const collectorElement = await page.$('dt:has-text("Collector") + dd');
  if (collectorElement) {
    details.collector = await collectorElement.textContent() || null;
  }

  // Extract Lien Holder
  const lienHolderElement = await page.$('dt:has-text("Lien Holder") + dd');
  if (lienHolderElement) {
    details.lien_holder = await lienHolderElement.textContent() || null;
  }

  // Extract Client Account Number
  const clientAcctElement = await page.$('dt:has-text("Client Acct No") + dd');
  if (clientAcctElement) {
    details.client_account_number = await clientAcctElement.textContent() || null;
  }

  return details;
}

// Extract vehicle information
export async function extractVehicle(page: Page, caseId: string): Promise<CaseVehicle> {
  const vehicle: CaseVehicle = {
    case_id: caseId,
    vin: null,
    year: null,
    make: null,
    model: null,
    color: null,
    license_plate: null,
    license_state: null
  };

  // Extract VIN
  const vinElement = await page.$('dt:has-text("V.I.N.") + dd');
  if (vinElement) {
    vehicle.vin = await vinElement.textContent() || null;
  }

  // Extract Year
  const yearElement = await page.$('dt:has-text("Year") + dd');
  if (yearElement) {
    const yearText = await yearElement.textContent();
    vehicle.year = yearText ? parseInt(yearText) : null;
  }

  // Extract Make
  const makeElement = await page.$('dt:has-text("Make") + dd');
  if (makeElement) {
    vehicle.make = await makeElement.textContent() || null;
  }

  // Extract Model
  const modelElement = await page.$('dt:has-text("Model") + dd');
  if (modelElement) {
    vehicle.model = await modelElement.textContent() || null;
  }

  // Extract Color
  const colorElement = await page.$('dt:has-text("Color") + dd');
  if (colorElement) {
    vehicle.color = await colorElement.textContent() || null;
  }

  // Extract License Plate
  const plateElement = await page.$('dt:has-text("License Plate") + dd');
  if (plateElement) {
    vehicle.license_plate = await plateElement.textContent() || null;
  }

  // Extract License State
  const stateElement = await page.$('dt:has-text("License State") + dd');
  if (stateElement) {
    vehicle.license_state = await stateElement.textContent() || null;
  }

  return vehicle;
}

// Extract all addresses
export async function extractAddresses(page: Page, caseId: string): Promise<CaseAddress[]> {
  const addresses: CaseAddress[] = [];
  
  // Find all address items
  const addressItems = await page.$$('.address_item');
  
  for (let i = 0; i < addressItems.length; i++) {
    const item = addressItems[i];
    
    const address: CaseAddress = {
      case_id: caseId,
      address_type: null,
      full_address: null,
      street_address: null,
      city: null,
      state: null,
      zip_code: null,
      is_covered: null,
      google_maps_verified: false
    };

    // Extract address type/category
    // The Category is in a div.col containing both dt and dd elements
    const categoryDiv = await item.$('div.col:has(dt:has-text("Category"))');
    if (categoryDiv) {
      const categoryDd = await categoryDiv.$('dd');
      if (categoryDd) {
        const categoryText = await categoryDd.textContent();
        address.address_type = categoryText ? categoryText.trim() : null;
        console.log(`Address category extracted: ${address.address_type}`);
      }
    } else {
      // Fallback: try to find dt with "Category" and then navigate to dd
      const categoryDt = await item.$('dt:has-text("Category")');
      if (categoryDt) {
        // Use evaluate within the item context to find the dd element
        const categoryText = await item.evaluate((element) => {
          // Find the dt with "Category" within this address item
          const dtElements = element.querySelectorAll('dt');
          for (const dt of dtElements) {
            if (dt.textContent?.includes('Category')) {
              // Look for dd in the same parent container
              const parent = dt.parentElement;
              const dd = parent?.querySelector('dd');
              return dd?.textContent?.trim() || null;
            }
          }
          return null;
        });
        
        if (categoryText) {
          address.address_type = categoryText;
          console.log(`Address category extracted (fallback): ${address.address_type}`);
        }
      }
    }

    // Extract address components
    const addressElement = await item.$('.address-simple');
    if (addressElement) {
      const streetAddr = await addressElement.getAttribute('data-address');
      const city = await addressElement.getAttribute('data-city');
      const state = await addressElement.getAttribute('data-state');
      let zip = await addressElement.getAttribute('data-zip');
      
      // Extract only first 5 digits from ZIP code (handle ZIP+4 format)
      if (zip) {
        // Take only first 5 digits, removing any non-digit characters first
        const cleanZip = zip.replace(/\D/g, ''); // Remove non-digits
        zip = cleanZip.substring(0, 5); // Take first 5 digits
        console.log(`ZIP extracted: ${zip} from original: ${await addressElement.getAttribute('data-zip')}`);
      }
      
      address.street_address = streetAddr || null;
      address.city = city || null;
      address.state = state || null;
      address.zip_code = zip || null;
      
      // Build full address with 5-digit ZIP
      if (streetAddr && city && state && zip) {
        address.full_address = `${streetAddr}, ${city}, ${state} ${zip}`;
      }
    }

    addresses.push(address);
  }

  return addresses;
}

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

// Helper function to clean text
export function cleanText(text: string | null): string | null {
  if (!text) return null;
  return text.trim().replace(/\s+/g, ' ');
}