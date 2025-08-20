/**
 * Update Poster Service - Handles posting updates to RDN portal
 * MVP implementation for automated form filling and submission
 */

interface UpdateInfo {
  message: string;
  selectedAddress: string;
}

interface AddressOption {
  value: string;
  text: string;
}

/**
 * Find and validate matching address for dropdown selection
 */
export function findAndValidateAddress(
  options: AddressOption[],
  selectedAddress: string
): AddressOption | null {
  return findMatchingAddress(options, selectedAddress);
}

/**
 * Post update to RDN portal via browser automation
 */
export async function postUpdateToRDN(
  page: any, // Playwright page instance
  caseId: string,
  updateInfo: UpdateInfo
): Promise<boolean> {
  try {
    console.log(`[UPDATE-POSTER] Starting update post for case ${caseId}`);
    
    // Validate input
    if (!updateInfo.message) {
      throw new Error('No update message provided');
    }
    
    // Step 1: Scroll to form
    await scrollToForm(page);
    
    // Step 2: Select Type dropdown - "(O) Agent-Update"
    await selectTypeDropdown(page);
    
    // Step 3: Select Address dropdown with validation
    await selectAddressDropdown(page, updateInfo.selectedAddress);
    
    // Step 4: Fill Details textarea
    await fillDetailsTextarea(page, updateInfo.message);
    
    // Step 5: Click Create button with verification
    const submitted = await clickCreateButton(page);
    
    if (!submitted) {
      throw new Error('Failed to submit update');
    }
    
    // Step 6: Verify submission
    const verified = await verifySubmission(page);
    
    console.log(`[UPDATE-POSTER] Update posting ${verified ? 'successful' : 'completed but not verified'}`);
    return true;
    
  } catch (error) {
    console.error('[UPDATE-POSTER] Error posting update:', error);
    throw error;
  }
}

/**
 * Scroll to the update form
 */
async function scrollToForm(page: any): Promise<void> {
  try {
    await page.evaluate(() => {
      const form = document.querySelector('#updatesForm');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    // Wait for scroll to complete
    await page.waitForTimeout(1000);
  } catch (error) {
    console.log('[UPDATE-POSTER] Could not scroll to form, continuing');
  }
}

/**
 * Select Type dropdown - always "(O) Agent-Update"
 */
async function selectTypeDropdown(page: any): Promise<void> {
  try {
    await page.selectOption('#updates_type', '36');
    console.log('[UPDATE-POSTER] Selected type: (O) Agent-Update');
  } catch (error) {
    console.error('[UPDATE-POSTER] Failed to select type dropdown:', error);
    throw new Error('Could not select update type');
  }
}

/**
 * Select matching address from dropdown with validation
 */
async function selectAddressDropdown(page: any, selectedAddress: string): Promise<void> {
  try {
    // Get all dropdown options
    const options: AddressOption[] = await page.evaluate(() => {
      const select = document.querySelector('#is_address_update_select');
      if (!select) return [];
      
      return Array.from(select.options).map((opt: any) => ({
        value: opt.value,
        text: opt.textContent.trim()
      }));
    });
    
    console.log(`[UPDATE-POSTER] Found ${options.length} address options`);
    
    if (options.length === 0) {
      throw new Error('No addresses available in dropdown');
    }
    
    if (!selectedAddress) {
      throw new Error('No address provided for selection');
    }
    
    // Find matching address
    const match = findMatchingAddress(options, selectedAddress);
    
    if (!match) {
      console.error('[UPDATE-POSTER] No matching address found');
      console.error(`Selected: "${selectedAddress}"`);
      console.error(`Available options: ${options.map(o => o.text).join(', ')}`);
      throw new Error('Could not find matching address in dropdown');
    }
    
    // Select the matching option
    await page.selectOption('#is_address_update_select', match.value);
    console.log(`[UPDATE-POSTER] Selected address: "${match.text}"`);
    
  } catch (error) {
    console.error('[UPDATE-POSTER] Failed to select address:', error);
    throw error;
  }
}

/**
 * Find matching address using exact and partial matching
 */
function findMatchingAddress(options: AddressOption[], selectedAddress: string): AddressOption | null {
  // Normalize address for comparison
  const normalizeAddress = (addr: string): string => {
    return addr
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[,\.]+/g, ',')
      .replace(/,\s*$/, '');
  };
  
  const normalizedSelected = normalizeAddress(selectedAddress);
  
  // Phase 1: Try exact match
  const exactMatch = options.find(opt => {
    const normalizedOption = normalizeAddress(opt.text);
    return normalizedOption === normalizedSelected;
  });
  
  if (exactMatch) {
    console.log('[UPDATE-POSTER] Found exact address match');
    return exactMatch;
  }
  
  // Phase 2: Try partial match
  console.log('[UPDATE-POSTER] No exact match, trying partial match');
  
  // Extract key parts of address
  const addressParts = selectedAddress.split(',')[0].trim().toLowerCase();
  
  // Find best partial match
  let bestMatch: AddressOption | null = null;
  let highestScore = 0;
  
  for (const option of options) {
    if (!option.value || option.value === '0' || option.value === '') {
      continue; // Skip empty options
    }
    
    const optionLower = option.text.toLowerCase();
    
    // Calculate match score
    let score = 0;
    
    // Check if option contains the street address part
    if (addressParts && optionLower.includes(addressParts)) {
      score = 0.8; // 80% match for street address
    }
    
    // Check for any word matches
    const selectedWords = selectedAddress.toLowerCase().split(/[\s,]+/);
    const matchingWords = selectedWords.filter(word => 
      word.length > 2 && optionLower.includes(word)
    );
    
    if (matchingWords.length > 0) {
      score = Math.max(score, matchingWords.length / selectedWords.length);
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = option;
    }
  }
  
  // Accept match if confidence is above 70%
  if (bestMatch && highestScore >= 0.7) {
    const percentage = (highestScore * 100).toFixed(0);
    console.log(`[UPDATE-POSTER] Found partial match with ${percentage}% confidence`);
    return bestMatch;
  }
  
  return null;
}

/**
 * Fill the Details textarea with update content
 */
async function fillDetailsTextarea(page: any, message: string): Promise<void> {
  try {
    // Clear existing content
    await page.focus('#comments');
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    
    // Type the message (preserves newlines)
    await page.type('#comments', message, { delay: 10 });
    
    console.log('[UPDATE-POSTER] Filled details textarea');
  } catch (error) {
    console.error('[UPDATE-POSTER] Failed to fill textarea:', error);
    throw new Error('Could not fill update details');
  }
}

/**
 * Click Create button with multiple strategies
 */
async function clickCreateButton(page: any): Promise<boolean> {
  try {
    console.log('[UPDATE-POSTER] Clicking Create button');
    
    // Strategy 1: Direct click
    try {
      await page.click('#create_button');
      console.log('[UPDATE-POSTER] Create button clicked');
      
      // Wait for response
      await page.waitForTimeout(1000);
      
      // Check if click was successful
      const clickSuccess = await verifyClickRegistered(page);
      if (clickSuccess) {
        return true;
      }
    } catch (clickError) {
      console.log('[UPDATE-POSTER] Direct click failed, trying alternative');
    }
    
    // Strategy 2: JavaScript click
    try {
      await page.evaluate(() => {
        const button = document.querySelector('#create_button');
        if (button) {
          (button as HTMLElement).click();
        }
      });
      
      console.log('[UPDATE-POSTER] JavaScript click executed');
      await page.waitForTimeout(1000);
      
      const clickSuccess = await verifyClickRegistered(page);
      if (clickSuccess) {
        return true;
      }
    } catch (jsError) {
      console.log('[UPDATE-POSTER] JavaScript click failed');
    }
    
    // Strategy 3: Direct function call if available
    try {
      const functionCalled = await page.evaluate(() => {
        if (typeof (window as any).new_update === 'function') {
          (window as any).new_update(true);
          return true;
        }
        return false;
      });
      
      if (functionCalled) {
        console.log('[UPDATE-POSTER] Direct function call executed');
        await page.waitForTimeout(1000);
        return true;
      }
    } catch (funcError) {
      console.log('[UPDATE-POSTER] Direct function call not available');
    }
    
    // If all strategies fail, return false
    console.error('[UPDATE-POSTER] All click strategies failed');
    return false;
    
  } catch (error) {
    console.error('[UPDATE-POSTER] Error clicking Create button:', error);
    return false;
  }
}

/**
 * Verify if the click was registered
 */
async function verifyClickRegistered(page: any): Promise<boolean> {
  try {
    const indicators = await page.evaluate(() => {
      const textarea = document.querySelector('#comments') as HTMLTextAreaElement;
      const successMessage = document.querySelector('.alert-success, .success-message');
      const loadingIndicator = document.querySelector('.loading, .spinner');
      
      return {
        textareaCleared: textarea ? textarea.value === '' : false,
        successVisible: successMessage ? true : false,
        loadingVisible: loadingIndicator ? true : false
      };
    });
    
    return indicators.textareaCleared || indicators.successVisible || indicators.loadingVisible;
    
  } catch (error) {
    console.log('[UPDATE-POSTER] Could not verify click registration');
    return false;
  }
}

/**
 * Verify the update was submitted successfully
 */
async function verifySubmission(page: any): Promise<boolean> {
  try {
    console.log('[UPDATE-POSTER] Verifying submission');
    
    // Wait for any of these conditions
    const verified = await Promise.race([
      // Textarea cleared
      page.waitForFunction(
        () => {
          const textarea = document.querySelector('#comments') as HTMLTextAreaElement;
          return textarea && textarea.value === '';
        },
        { timeout: 5000 }
      ).then(() => true),
      
      // Success message appears
      page.waitForSelector('.alert-success, .success-message', {
        timeout: 5000,
        state: 'visible'
      }).then(() => true),
      
      // Page navigates
      page.waitForNavigation({ timeout: 5000 }).then(() => true)
    ]).catch(() => false);
    
    if (verified) {
      console.log('[UPDATE-POSTER] Submission verified');
    } else {
      console.log('[UPDATE-POSTER] Could not verify submission, but may have succeeded');
    }
    
    return verified;
    
  } catch (error) {
    console.log('[UPDATE-POSTER] Verification error:', error);
    return false;
  }
}