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
    
    // Step 5: Validate form before submission
    const formValid = await validateFormBeforeSubmit(page);
    if (!formValid) {
      throw new Error('Form validation failed - required fields not filled');
    }
    
    // Step 6: Submit with retry mechanism
    const submitted = await submitFormWithRetry(page, updateInfo.message);
    
    if (!submitted) {
      // Take screenshot for debugging
      await captureDebugInfo(page, caseId);
      throw new Error('Failed to submit update after 3 attempts');
    }
    
    console.log(`[UPDATE-POSTER] Update posting successful for case ${caseId}`);
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
    
    // Wait for selection to be registered
    await page.waitForFunction(
      () => {
        const select = document.querySelector('#updates_type') as HTMLSelectElement;
        return select && select.value === '36';
      },
      { timeout: 5000 }
    );
    
    // Additional wait for any onChange handlers
    await page.waitForTimeout(500);
    
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
    
    // Wait for selection to be registered
    await page.waitForFunction(
      (expectedValue: string) => {
        const select = document.querySelector('#is_address_update_select') as HTMLSelectElement;
        return select && select.value === expectedValue;
      },
      match.value,
      { timeout: 5000 }
    );
    
    // Additional wait for any onChange handlers
    await page.waitForTimeout(500);
    
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
    
    // Small wait after clearing
    await page.waitForTimeout(200);
    
    // Type the message (preserves newlines)
    await page.type('#comments', message, { delay: 20 });
    
    // Verify content was entered correctly
    const actualContent = await page.inputValue('#comments');
    if (!actualContent || actualContent.length < message.length * 0.9) {
      console.warn('[UPDATE-POSTER] Content verification failed, retrying...');
      // Retry with fill method
      await page.fill('#comments', message);
    }
    
    // Wait for any input handlers
    await page.waitForTimeout(500);
    
    console.log('[UPDATE-POSTER] Filled details textarea');
  } catch (error) {
    console.error('[UPDATE-POSTER] Failed to fill textarea:', error);
    throw new Error('Could not fill update details');
  }
}

/**
 * Validate form is filled before submission
 */
async function validateFormBeforeSubmit(page: any): Promise<boolean> {
  try {
    const formState = await page.evaluate(() => {
      const typeSelect = document.querySelector('#updates_type') as HTMLSelectElement;
      const addressSelect = document.querySelector('#is_address_update_select') as HTMLSelectElement;
      const commentsTextarea = document.querySelector('#comments') as HTMLTextAreaElement;
      
      return {
        typeValue: typeSelect?.value || '',
        addressValue: addressSelect?.value || '',
        commentsLength: commentsTextarea?.value?.length || 0,
        formExists: !!(typeSelect && addressSelect && commentsTextarea)
      };
    });
    
    const isValid = formState.formExists && 
                    formState.typeValue === '36' && 
                    formState.addressValue && 
                    formState.addressValue !== '0' && 
                    formState.commentsLength > 0;
    
    if (!isValid) {
      console.error('[UPDATE-POSTER] Form validation failed:', formState);
    }
    
    return isValid;
  } catch (error) {
    console.error('[UPDATE-POSTER] Error validating form:', error);
    return false;
  }
}

/**
 * Submit form with retry mechanism
 */
async function submitFormWithRetry(page: any, expectedMessage: string): Promise<boolean> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`[UPDATE-POSTER] Submission attempt ${attempt} of 3`);
    
    try {
      // Different strategy for each attempt
      if (attempt === 1) {
        // Direct click
        await page.click('#create_button');
      } else if (attempt === 2) {
        // JavaScript click
        await page.evaluate(() => {
          const button = document.querySelector('#create_button') as HTMLElement;
          if (button) button.click();
        });
      } else {
        // Direct function call
        await page.evaluate(() => {
          if (typeof (window as any).new_update === 'function') {
            (window as any).new_update(true);
          }
        });
      }
      
      console.log('[UPDATE-POSTER] Click executed, waiting for response...');
      
      // Wait for network activity to settle
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      // Additional wait for server processing
      await page.waitForTimeout(3000);
      
      // Verify submission
      const success = await verifyUpdatePosted(page, expectedMessage);
      
      if (success) {
        console.log(`[UPDATE-POSTER] Update verified on attempt ${attempt}`);
        return true;
      }
      
      console.log(`[UPDATE-POSTER] Attempt ${attempt} failed, update not found`);
      
      // Wait before retry
      if (attempt < 3) {
        await page.waitForTimeout(attempt * 2000);
      }
      
    } catch (error) {
      console.error(`[UPDATE-POSTER] Error on attempt ${attempt}:`, error);
      
      // Wait before retry
      if (attempt < 3) {
        await page.waitForTimeout(attempt * 2000);
      }
    }
  }
  
  return false;
}

/**
 * Verify the update was actually posted
 */
async function verifyUpdatePosted(page: any, expectedMessage: string): Promise<boolean> {
  try {
    console.log('[UPDATE-POSTER] Checking if update appears in the list...');
    
    // Check multiple indicators
    const updateFound = await page.evaluate((messageSnippet: string) => {
      // Check if textarea was cleared (basic indicator)
      const textarea = document.querySelector('#comments') as HTMLTextAreaElement;
      const textareaCleared = textarea && textarea.value === '';
      
      // Look for the update in various possible locations
      const updateContainers = [
        '.update-content',
        '.comment-text', 
        '.case-update',
        '[class*="update"]',
        '[class*="comment"]',
        'td:has(> span)',
        'div.text-sm',
        'p:not(#comments)'
      ];
      
      let foundInList = false;
      const snippet = messageSnippet.substring(0, 50).toLowerCase();
      
      for (const selector of updateContainers) {
        const elements = document.querySelectorAll(selector);
        for (const el of Array.from(elements)) {
          const text = (el as HTMLElement).textContent?.toLowerCase() || '';
          if (text.includes(snippet)) {
            foundInList = true;
            console.log(`Found update in: ${selector}`);
            break;
          }
        }
        if (foundInList) break;
      }
      
      // Check for success messages
      const successIndicators = document.querySelectorAll('.alert-success, .success-message, [class*="success"]');
      const hasSuccessMessage = successIndicators.length > 0;
      
      // Check if form is reset
      const typeSelect = document.querySelector('#updates_type') as HTMLSelectElement;
      const formReset = typeSelect && (typeSelect.value === '' || typeSelect.value === '0');
      
      return {
        textareaCleared,
        foundInList,
        hasSuccessMessage,
        formReset,
        verified: foundInList || (textareaCleared && (hasSuccessMessage || formReset))
      };
    }, expectedMessage);
    
    console.log('[UPDATE-POSTER] Verification results:', updateFound);
    
    return updateFound.verified;
    
  } catch (error) {
    console.error('[UPDATE-POSTER] Error verifying update:', error);
    return false;
  }
}

/**
 * Capture debug information on failure
 */
async function captureDebugInfo(page: any, caseId: string): Promise<void> {
  try {
    // Take screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `./debug-update-failure-${caseId}-${timestamp}.png`;
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false 
    });
    console.log(`[UPDATE-POSTER] Debug screenshot saved: ${screenshotPath}`);
    
    // Log form state
    const formState = await page.evaluate(() => {
      const typeSelect = document.querySelector('#updates_type') as HTMLSelectElement;
      const addressSelect = document.querySelector('#is_address_update_select') as HTMLSelectElement;
      const commentsTextarea = document.querySelector('#comments') as HTMLTextAreaElement;
      const createButton = document.querySelector('#create_button') as HTMLButtonElement;
      
      return {
        type: typeSelect?.value,
        address: addressSelect?.value,
        commentsLength: commentsTextarea?.value?.length,
        buttonEnabled: createButton ? !createButton.disabled : false,
        formVisible: !!(typeSelect && addressSelect && commentsTextarea)
      };
    });
    
    console.log('[UPDATE-POSTER] Form state at failure:', formState);
    
  } catch (error) {
    console.error('[UPDATE-POSTER] Could not capture debug info:', error);
  }
}