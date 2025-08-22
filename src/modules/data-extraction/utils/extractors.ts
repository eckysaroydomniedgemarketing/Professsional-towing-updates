import { Page } from 'playwright';
import { 
  CaseDetails, 
  CaseVehicle
} from '../types';
import { normalizeStatus } from './status-normalizer';
import { cleanText } from './text-utils';
import { extractAddresses } from './address-extractors';
import { extractUpdates, extractAdditionalInfo } from './update-extractors';

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
    client_account_number: null,
    my_summary_additional_info: null
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

  // Extract Status - Try multiple patterns for dynamic extraction
  // Method 1: Try dropdown select element first (most reliable)
  const statusDropdown = await page.$('#status_static');
  if (statusDropdown) {
    const dropdownValue = await statusDropdown.evaluate((el: HTMLSelectElement) => {
      return el.options[el.selectedIndex]?.text || el.value || null;
    });
    if (dropdownValue) {
      details.status = normalizeStatus(dropdownValue);
      console.log('Status extracted from dropdown:', details.status);
    }
  }
  
  // Method 2: If dropdown not found or empty, try badge elements
  if (!details.status) {
    const statusBadge = await page.$('.badge-open, .badge-repo, .badge-closed, .badge-auction, .badge-transfer, .badge-info, [class*="badge-"]');
    if (statusBadge) {
      const badgeText = await statusBadge.textContent();
      details.status = normalizeStatus(badgeText);
      console.log('Status extracted from badge:', details.status);
    }
  }
  
  // Method 3: Try JavaScript variable as fallback
  if (!details.status) {
    try {
      const jsStatus = await page.evaluate(() => {
        return (window as any).case_status || null;
      });
      if (jsStatus) {
        details.status = normalizeStatus(jsStatus);
        console.log('Status extracted from JavaScript variable:', details.status);
      }
    } catch (error) {
      console.log('Could not extract status from JavaScript variable');
    }
  }
  
  // Method 4: Try to find status in text pattern (last resort)
  if (!details.status) {
    try {
      const statusFromText = await page.evaluate(() => {
        // Look for elements containing "Status" text
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          if (el.textContent?.includes('Status') && !el.textContent.includes('Sub-Status')) {
            // Check next sibling or child elements for status value
            const nextEl = el.nextElementSibling;
            if (nextEl && ['Open', 'Repossessed', 'repo', 'Office Transfer', 'Need Info', 'Auction'].some(s => nextEl.textContent?.includes(s))) {
              return nextEl.textContent?.trim();
            }
          }
        }
        return null;
      });
      if (statusFromText) {
        details.status = normalizeStatus(statusFromText);
        console.log('Status extracted from text pattern:', details.status);
      }
    } catch (error) {
      console.log('Could not extract status from text pattern');
    }
  }
  
  if (!details.status) {
    console.error('WARNING: Could not extract status from any source');
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

  // Extract Additional Information from My Summary tab
  // This should be called when on the My Summary tab
  try {
    const additionalInfoElement = await page.$('#additional_info');
    if (additionalInfoElement) {
      const additionalInfoText = await additionalInfoElement.textContent();
      details.my_summary_additional_info = cleanText(additionalInfoText);
      console.log('Additional Information extracted in case details:', details.my_summary_additional_info);
    } else {
      console.log('Additional Information element not found, setting to null');
      details.my_summary_additional_info = null;
    }
  } catch (error) {
    console.log('Warning: Error extracting Additional Information, setting to null:', error);
    details.my_summary_additional_info = null;
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

// Re-export the functions from the new modules
export { extractAddresses } from './address-extractors';
export { extractUpdates, extractAdditionalInfo } from './update-extractors';
export { cleanText } from './text-utils';