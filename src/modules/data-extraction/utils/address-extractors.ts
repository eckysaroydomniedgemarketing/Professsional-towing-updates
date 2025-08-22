import { Page } from 'playwright';
import { CaseAddress } from '../types';

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
      google_maps_verified: false,
      address_validity: null
    };

    // Extract address validity status
    // Look for Valid/Invalid button indicators
    const validButton = await item.$('button.btn-link.text-success:has-text("Valid")');
    const invalidButton = await item.$('button.btn-link.text-danger:has-text("Invalid")');
    
    if (validButton) {
      address.address_validity = true;
      console.log(`Address marked as VALID`);
    } else if (invalidButton) {
      address.address_validity = false;
      console.log(`Address marked as INVALID`);
    } else {
      // Check for alternative patterns if needed
      const validityText = await item.evaluate((el) => {
        const buttons = el.querySelectorAll('button.btn-link');
        for (const btn of buttons) {
          const text = btn.textContent?.trim();
          if (text?.includes('Valid') && btn.classList.contains('text-success')) {
            return 'valid';
          } else if (text?.includes('Invalid') && btn.classList.contains('text-danger')) {
            return 'invalid';
          }
        }
        return null;
      });
      
      if (validityText === 'valid') {
        address.address_validity = true;
        console.log(`Address marked as VALID (alternative pattern)`);
      } else if (validityText === 'invalid') {
        address.address_validity = false;
        console.log(`Address marked as INVALID (alternative pattern)`);
      } else {
        address.address_validity = null;
        console.log(`Address validity status unknown`);
      }
    }

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