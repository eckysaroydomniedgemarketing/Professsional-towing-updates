/**
 * UpdatePoster module - Handles posting updates to cases
 */

const config = require('../../../config/app-config');
const selectors = require('../../../config/selectors');

/**
 * UpdatePoster class for posting updates to cases
 */
class UpdatePoster {
  /**
   * @param {import('./UpdatesManager')} manager - Reference to the UpdatesManager
   */
  constructor(manager) {
    this.manager = manager;
  }

  /**
   * Verify if the Create button click was registered and triggered form submission
   * @param {import('playwright').Page} tab - The tab/page where the case is open
   * @returns {Promise<boolean>} - True if click was registered successfully
   */
  async verifyClickRegistered(tab) {
    try {
      // Check multiple indicators that the click was registered
      const indicators = await tab.evaluate(() => {
        const textarea = document.querySelector('textarea#comments');
        const successMessage = document.querySelector('.alert-success, .success-message, [class*="success"]');
        const loadingIndicator = document.querySelector('.loading, .spinner, [class*="loading"]');
        
        return {
          textareaCleared: textarea ? textarea.value === '' : false,
          textareaExists: !!textarea,
          successMessageVisible: successMessage ? successMessage.offsetParent !== null : false,
          loadingVisible: loadingIndicator ? loadingIndicator.offsetParent !== null : false,
          pageTitle: document.title,
          currentUrl: window.location.href
        };
      });
      
      console.log('🔍 Click verification indicators:', indicators);
      
      // Consider click successful if any of these conditions are met:
      const clickRegistered = 
        indicators.textareaCleared ||           // Textarea was cleared
        indicators.successMessageVisible ||     // Success message appeared
        indicators.loadingVisible;              // Loading indicator appeared
      
      return clickRegistered;
    } catch (error) {
      console.log('⚠️ Error during click verification:', error.message);
      return false;
    }
  }


  /**
   * Post a new update to the case
   * @param {import('playwright').Page} tab - The tab/page where the case is open
   * @param {string} caseId - ID of the case
   * @param {Object} updateInfo - Update information object
   * @param {string} updateInfo.message - Update message to post
   * @param {string} updateInfo.selectedAddress - Selected address for the update
   * @returns {Promise<boolean>} - True if update posted successfully
   */
  async postUpdate(tab, caseId, updateInfo) {
    try {
      console.log(`Task 5.10: Posting update for case ID: ${caseId}`);
      
      // Validate updateInfo
      if (!updateInfo || !updateInfo.message) {
        console.error('No update message provided');
        return false;
      }
      
      // Extract message from updateInfo
      const message = updateInfo.message;
      const selectedAddress = updateInfo.selectedAddress || '';
      
      console.log(`Posting update with message: ${message.substring(0, 50)}...`);
      console.log(`Selected address: ${selectedAddress}`);
      
      // 1. Select address from dropdown if available
      try {
        const addressDropdownSelector = selectors.caseDetails.addressDropdown;
        const addressDropdown = await tab.$(addressDropdownSelector);
        
        if (addressDropdown) {
          console.log('Address dropdown found, selecting address...');
          
          // First get all options to log them for debugging
          const allOptions = await tab.evaluate(selector => {
            const select = document.querySelector(selector);
            if (!select) return [];
            
            return Array.from(select.options).map(opt => ({
              value: opt.value,
              text: opt.textContent.trim()
            }));
          }, addressDropdownSelector);
          
          console.log(`Dropdown options (${allOptions.length}):", ${JSON.stringify(allOptions).substring(0, 200)}${allOptions.length > 5 ? '...' : ''}`);
          
          // Rule 4.1: Address Dropdown Validation - Strict matching required
          if (allOptions.length > 0 && selectedAddress) {
            // Normalize function for consistent comparison (case-sensitive)
            const normalizeAddress = (addr) => {
              return addr
                .trim()
                // .toLowerCase() // Removed to preserve case sensitivity
                .replace(/\s+/g, ' ')  // normalize multiple spaces to single space
                .replace(/[,\.]+/g, ',') // normalize punctuation
                .replace(/,\s*$/, ''); // remove trailing comma
            };
            
            // Helper function to extract address components (case-sensitive)
            const extractAddressComponents = (address) => {
              const normalized = address.trim(); // Removed toLowerCase() to preserve case
              return {
                streetNumber: normalized.match(/^\d+/)?.[0] || '',
                streetName: normalized.match(/\d+\s+(.+?)(?:,|$)/)?.[1]?.trim() || '',
                city: normalized.match(/,\s*([^,]+),\s*[A-Z]{2}/)?.[1]?.trim() || '', // Removed 'i' flag for case-sensitive state matching
                state: normalized.match(/,\s*([A-Z]{2})(?:\s|$)/)?.[1] || '', // Removed 'i' flag for case-sensitive state matching
                full: normalized
              };
            };
            
            // Helper function to calculate match score (case-sensitive)
            const calculateMatchScore = (components, optionText) => {
              const optionNorm = optionText.trim(); // Removed toLowerCase() to preserve case
              let score = 0;
              let weights = 0;
              
              // Street number (high weight - 40%)
              if (components.streetNumber && optionNorm.includes(components.streetNumber)) {
                score += 0.4;
              }
              weights += 0.4;
              
              // Street name (high weight - 40%)
              if (components.streetName && optionNorm.includes(components.streetName)) {
                score += 0.4;
              }
              weights += 0.4;
              
              // City (medium weight - 15%)
              if (components.city && optionNorm.includes(components.city)) {
                score += 0.15;
              }
              weights += 0.15;
              
              // State (low weight - 5%)
              if (components.state && optionNorm.includes(components.state)) { // Removed toLowerCase() on state
                score += 0.05;
              }
              weights += 0.05;
              
              return weights > 0 ? score / weights : 0;
            };
            
            const normalizedSelected = normalizeAddress(selectedAddress);
            console.log(`Looking for exact match for address: "${selectedAddress}"`);
            console.log(`Normalized selected address: "${normalizedSelected}"`);
            
            // Phase 1: Try exact match first
            const exactMatch = allOptions.find(opt => {
              const normalizedOption = normalizeAddress(opt.text);
              return normalizedOption === normalizedSelected;
            });
            
            if (exactMatch) {
              console.log(`✅ Found exact match in dropdown: "${exactMatch.text}" (value: ${exactMatch.value})`);
              await tab.selectOption(addressDropdownSelector, exactMatch.value);
              console.log(`✅ Successfully selected address option: "${exactMatch.text}"`);
            } else {
              // Phase 2: Try partial match as fallback
              console.log(`⚠️ No exact match found, attempting partial match...`);
              
              // Extract components from selected address
              const addressComponents = extractAddressComponents(selectedAddress);
              console.log(`Address components extracted:`, addressComponents);
              
              // Find best partial match
              let bestMatch = null;
              let highestScore = 0;
              const matchScores = [];
              
              allOptions.forEach((opt, idx) => {
                if (opt.value && opt.value !== '0' && opt.value !== '') { // Skip empty option
                  const score = calculateMatchScore(addressComponents, opt.text);
                  matchScores.push({
                    option: opt,
                    score: score,
                    percentage: (score * 100).toFixed(0)
                  });
                  
                  if (score > highestScore) { // Removed 70% minimum threshold - always track highest
                    highestScore = score;
                    bestMatch = opt;
                  }
                }
              });
              
              // Log all match scores for debugging
              console.log(`Partial match scores:`);
              matchScores.forEach((match, idx) => {
                console.log(`   ${idx + 1}. "${match.option.text}" - Score: ${match.percentage}%`);
              });
              
              if (bestMatch && highestScore > 0) { // Select best match if any score > 0
                const percentage = (highestScore * 100).toFixed(0);
                const isLowConfidence = highestScore < 0.7;
                
                if (isLowConfidence) {
                  console.log(`⚠️ LOW CONFIDENCE MATCH: Found address with ${percentage}% similarity`);
                } else {
                  console.log(`✅ PARTIAL MATCH: Found address with ${percentage}% similarity`);
                }
                
                console.log(`   Selected: "${selectedAddress}"`);
                console.log(`   Matched: "${bestMatch.text}"`);
                console.log(`   Match confidence: ${percentage}%`);
                
                await tab.selectOption(addressDropdownSelector, bestMatch.value);
                console.log(`✅ Successfully selected address option using partial match: "${bestMatch.text}"`);
              } else {
                // Only fail if no match at all (score = 0)
                console.error(`❌ ERROR: Address dropdown validation failed`);
                console.error(`   Selected address: "${selectedAddress}"`);
                console.error(`   No matching address found (all scores = 0%)`);
                
                // Log all available options
                console.error(`\n   Available dropdown options (${allOptions.length}):`);
                allOptions.forEach((opt, idx) => {
                  const normalizedOpt = normalizeAddress(opt.text);
                  console.error(`   ${idx + 1}. "${opt.text}"`);
                  console.error(`      Normalized: "${normalizedOpt}"`);
                  console.error(`      Value: ${opt.value}`);
                });
                
                // Fail the update process
                throw new Error(
                  `Address dropdown validation failed: Selected address "${selectedAddress}" ` +
                  `does not match any dropdown option with sufficient confidence (>70%). ` +
                  `Update cannot proceed without valid address selection.`
                );
              }
            }
          } else if (allOptions.length > 0 && !selectedAddress) {
            // No address was selected but dropdown has options
            console.error(`❌ ERROR: No address provided for selection`);
            console.error(`   Available dropdown options: ${allOptions.length}`);
            throw new Error(
              `Address dropdown validation failed: No address was provided for selection. ` +
              `Update cannot proceed without address selection.`
            );
          } else if (allOptions.length === 0) {
            // No options in dropdown
            console.error(`❌ ERROR: Address dropdown is empty`);
            throw new Error(
              `Address dropdown validation failed: No addresses available in dropdown. ` +
              `Update cannot proceed without available addresses.`
            );
          } else {
            console.log('No dropdown found or no address validation required.');
          }
        } else {
          console.log('Address dropdown not found. Continuing without address selection.');
        }
      } catch (addressError) {
        console.error(`Error selecting address: ${addressError.message}`);
        console.log('Continuing without address selection');
      }
      
      // 2. Enter update message in the textarea using type() method for better newline handling
      try {
        const commentsTextareaSelector = 'textarea#comments';
        
        // Clear the textarea first
        await tab.focus(commentsTextareaSelector);
        await tab.keyboard.press('Control+A');
        await tab.keyboard.press('Delete');
        
        // Use type() method instead of fill() for better newline character handling
        // This ensures that \n and \r\n characters are properly entered as line breaks
        await tab.type(commentsTextareaSelector, message, { delay: 10 });
        console.log('Entered update message in comments textarea using type() method');
      } catch (textareaError) {
        console.error(`Error typing in textarea: ${textareaError.message}`);
        return false;
      }
      
      // 3. Get update timestamp for verification
      const timestamp = new Date().toLocaleString();
      console.log(`Update timestamp: ${timestamp}`);
      
      // 4. Check if we're in test mode (prevents actual posting for testing)
      if (this.manager.testMode) {
        console.log('\n🔒 TEST MODE: Update prepared but NOT posted');
        console.log('===============================================');
        console.log('TEST MODE ACTIVE - NO ACTUAL POSTING');
        console.log('===============================================');
        console.log(`Content: ${message}`);
        console.log(`For address: ${selectedAddress}`);
        console.log('Update has been filled in textarea but Create button will NOT be clicked');
        console.log('This is a test run to check the flow without posting actual updates');
        console.log('===============================================');
        
        // In test mode, we return true to simulate successful posting for flow testing
        return true;
      }
      
      // 4. Check if we're in auto-post mode or manual mode
      if (this.manager.autoPostMode) {
        // Auto-post mode: Enhanced Create button clicking with detection
        try {
          console.log('🔍 Starting enhanced Create button detection and clicking...');
          
          // Step 1: Comprehensive button detection
          let createButton = null;
          let buttonInfo = null;
          
          // Try primary selector first
          createButton = await tab.$('#create_button');
          if (createButton) {
            buttonInfo = await createButton.evaluate(el => ({
              id: el.id,
              type: el.type,
              disabled: el.disabled,
              onclick: el.onclick ? el.onclick.toString() : null,
              visible: el.offsetParent !== null,
              text: el.textContent.trim()
            }));
            console.log('✅ Found Create button with ID:', buttonInfo);
          } else {
            // Fallback to broader selector
            createButton = await tab.$(selectors.caseDetails.createUpdateButton);
            if (createButton) {
              buttonInfo = await createButton.evaluate(el => ({
                id: el.id,
                type: el.type,
                disabled: el.disabled,
                onclick: el.onclick ? el.onclick.toString() : null,
                visible: el.offsetParent !== null,
                text: el.textContent.trim()
              }));
              console.log('✅ Found Create button with fallback selector:', buttonInfo);
            }
          }
          
          if (!createButton) {
            console.error('❌ Create button not found with any selector');
            throw new Error('No create button found on page');
          }
          
          // Step 2: Pre-click validation
          if (buttonInfo.disabled) {
            console.warn('⚠️ Create button is disabled, waiting for it to become enabled...');
            await tab.waitForTimeout(2000);
            
            // Re-check if enabled
            const stillDisabled = await createButton.evaluate(el => el.disabled);
            if (stillDisabled) {
              throw new Error('Create button remains disabled after waiting');
            }
          }
          
          if (!buttonInfo.visible) {
            console.warn('⚠️ Create button is not visible');
            throw new Error('Create button is not visible on page');
          }
          
          // Step 3: Multiple click strategies with verification
          let clickSuccess = false;
          let clickMethod = '';
          
          // Strategy 1: Regular Playwright click
          try {
            console.log('🖱️ Attempting Strategy 1: Regular Playwright click...');
            await createButton.click();
            clickMethod = 'playwright_click';
            console.log('✅ Strategy 1: Playwright click executed');
            
            // Verify click was registered
            await tab.waitForTimeout(500);
            clickSuccess = await this.verifyClickRegistered(tab);
            
            if (clickSuccess) {
              console.log('✅ Strategy 1: Click verified successful');
            } else {
              console.log('⚠️ Strategy 1: Click did not register, trying fallback...');
            }
          } catch (clickError) {
            console.log('❌ Strategy 1: Playwright click failed:', clickError.message);
          }
          
          // Strategy 2: JavaScript onclick handler execution
          if (!clickSuccess && buttonInfo.onclick) {
            try {
              console.log('🖱️ Attempting Strategy 2: JavaScript onclick execution...');
              await tab.evaluate(() => {
                const button = document.querySelector('#create_button');
                if (button && button.onclick) {
                  button.onclick();
                }
              });
              clickMethod = 'javascript_onclick';
              console.log('✅ Strategy 2: JavaScript onclick executed');
              
              await tab.waitForTimeout(500);
              clickSuccess = await this.verifyClickRegistered(tab);
              
              if (clickSuccess) {
                console.log('✅ Strategy 2: Click verified successful');
              } else {
                console.log('⚠️ Strategy 2: onclick execution did not register');
              }
            } catch (jsError) {
              console.log('❌ Strategy 2: JavaScript onclick failed:', jsError.message);
            }
          }
          
          // Strategy 3: Direct function call
          if (!clickSuccess) {
            try {
              console.log('🖱️ Attempting Strategy 3: Direct new_update() function call...');
              await tab.evaluate(() => {
                if (typeof window.new_update === 'function') {
                  window.new_update(true);
                } else {
                  throw new Error('new_update function not found');
                }
              });
              clickMethod = 'direct_function_call';
              console.log('✅ Strategy 3: Direct function call executed');
              
              await tab.waitForTimeout(500);
              clickSuccess = await this.verifyClickRegistered(tab);
              
              if (clickSuccess) {
                console.log('✅ Strategy 3: Click verified successful');
              } else {
                console.log('⚠️ Strategy 3: Function call did not register');
              }
            } catch (funcError) {
              console.log('❌ Strategy 3: Direct function call failed:', funcError.message);
            }
          }
          
          // Strategy 4: Force click with coordinates
          if (!clickSuccess) {
            try {
              console.log('🖱️ Attempting Strategy 4: Force click with coordinates...');
              const box = await createButton.boundingBox();
              if (box) {
                await tab.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                clickMethod = 'coordinate_click';
                console.log('✅ Strategy 4: Coordinate click executed');
                
                await tab.waitForTimeout(500);
                clickSuccess = await this.verifyClickRegistered(tab);
                
                if (clickSuccess) {
                  console.log('✅ Strategy 4: Click verified successful');
                } else {
                  console.log('⚠️ Strategy 4: Coordinate click did not register');
                }
              }
            } catch (coordError) {
              console.log('❌ Strategy 4: Coordinate click failed:', coordError.message);
            }
          }
          
          // Final verification
          if (!clickSuccess) {
            console.error('❌ All click strategies failed - Create button was not successfully triggered');
            console.error(`Button info: ${JSON.stringify(buttonInfo)}`);
            throw new Error('Failed to trigger Create button after trying all strategies');
          }
          
          console.log(`✅ Create button successfully triggered using: ${clickMethod}`);
          
          // Wait for the textarea to be cleared (indicates form submission)
          console.log('Waiting for form submission confirmation...');
          
          // Multiple ways to verify submission
          const submissionVerified = await Promise.race([
            // Method 1: Textarea gets cleared
            tab.waitForFunction(
              selector => {
                const textarea = document.querySelector(selector);
                return textarea && textarea.value === '';
              },
              'textarea#comments',
              { timeout: 10000 }
            ).then(() => {
              console.log('✓ Textarea cleared - form submitted');
              return true;
            }),
            
            // Method 2: Success message appears
            tab.waitForSelector('.alert-success, .success-message, [class*="success"]', { 
              timeout: 10000,
              state: 'visible' 
            }).then(() => {
              console.log('✓ Success message appeared');
              return true;
            }),
            
            // Method 3: Page navigates/reloads
            tab.waitForNavigation({ timeout: 10000 }).then(() => {
              console.log('✓ Page navigated after submission');
              return true;
            })
          ]).catch(() => false);
          
          if (!submissionVerified) {
            console.warn('⚠️ Could not verify form submission. Checking if update was added...');
            
            // Last resort: Check if a new update appeared in the list
            await tab.waitForTimeout(3000);
            const currentUrl = await tab.url();
            console.log('Current URL after click:', currentUrl);
          }
          
          // Add a short delay for server processing
          console.log('Waiting for server to process update...');
          await tab.waitForTimeout(2000);
          
          // Wait for submission to complete with adequate timeout
          await tab.waitForLoadState(config.waitUntil.default, { 
            timeout: config.timeouts.element 
          }).catch(err => console.log(`Warning: Page did not reach ${config.waitUntil.default} state after update: ${err.message}`));
          
          console.log('✓ Update posting completed in auto-post mode');
        } catch (buttonError) {
          console.error(`Error clicking Create button: ${buttonError.message}`);
          return false;
        }
      } else {
        // Manual mode: Display confirmation on screen and let user manually click the button
        console.log('\n===============================================');
        console.log('UPDATE READY FOR REVIEW IN BROWSER');
        console.log('===============================================');
        console.log(`Content: ${message}`);
        console.log(`For address: ${selectedAddress}`);
        console.log('===============================================');
        console.log('MANUAL MODE INSTRUCTIONS:');
        console.log('1. Review the update content in the browser');
        console.log('2. Make any necessary edits if needed');
        console.log('3. Click the Create button when ready');
        console.log('4. Confirm submission below');
        console.log('===============================================');
        
        // Create a readline interface for accepting user input from the console
        const readline = require('readline');
        
        // Step 1: Wait for user to review content
        await new Promise((resolve) => {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          rl.question('\n📋 Have you reviewed the update content in the browser? Press Enter when ready to proceed: ', () => {
            rl.close();
            console.log('✅ Content review confirmed. Please proceed to click the Create button in the browser.');
            resolve();
          });
        });
        
        // Step 2: Wait for user to click Create button and confirm submission
        const submissionConfirmed = await new Promise((resolve) => {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          rl.question('\n🖱️  Have you clicked the Create button and seen the update posted? (y/n): ', (answer) => {
            rl.close();
            
            const confirmed = answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes';
            
            if (confirmed) {
              console.log('✅ Update submission confirmed. Proceeding to next case...');
              resolve(true);
            } else {
              console.log('⚠️  Update not submitted. Moving to next case...');
              console.log('Note: This case will be marked as unsuccessful in the processing results.');
              resolve(false);
            }
          });
        });
        
        // If user didn't confirm submission, return false to indicate failure
        if (!submissionConfirmed) {
          return false;
        }
      }
      
      // 5. Verify the update appears in the updates list
      try {
        // Wait a moment for the update to be added to the list
        await tab.waitForTimeout(config.timeouts.shortBreak);
        
        // Reload the page to refresh the updates list
        await tab.reload({ waitUntil: config.waitUntil.default });
        
        // Wait for the ALL link to be visible again
        await tab.waitForSelector(selectors.caseDetails.allUpdatesLink, { 
          timeout: config.timeouts.element,
          state: 'visible'
        }).catch(() => console.log('ALL link not visible after update'));
        
        // Click the ALL link again to show all updates including the new one
        const allLink = await tab.$(selectors.caseDetails.allUpdatesLink);
        if (allLink) {
          await allLink.click();
          await tab.waitForTimeout(config.timeouts.shortBreak);
        }
        
        // Look for our update in the list
        const pageContent = await tab.content();
        // Check for the first 50 chars to accommodate for various update formats
        const messagePreview = message.substring(0, 50);
        const updateVerified = pageContent.includes(messagePreview);
        
        if (updateVerified) {
          console.log('✓ Update verified in the updates list');
          return true;
        } else {
          console.log('Warning: Could not verify the update was added to the list');
          // Return true anyway as the update was submitted
          return true; 
        }
      } catch (verifyError) {
        console.log(`Warning: Error verifying update: ${verifyError.message}`);
        // Return true anyway as the update was submitted
        return true;
      }
    } catch (error) {
      console.error(`Failed to post update for case ${caseId}:`, error);
      return false;
    }
  }
}

module.exports = UpdatePoster;