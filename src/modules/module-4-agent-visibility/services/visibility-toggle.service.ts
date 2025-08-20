import { Page, ElementHandle } from 'playwright';

export class VisibilityToggleService {
  /**
   * Toggle visibility for a single update
   */
  async toggleUpdateVisibility(casePage: Page, updateId: string): Promise<boolean> {
    try {
      console.log(`Toggling visibility for update ${updateId}`);
      
      // Find the Not Visible button
      const notVisibleButton = await this.findNotVisibleButton(casePage, updateId);
      
      if (!notVisibleButton) {
        console.error(`Not Visible button not found for update ${updateId} after trying all strategies`);
        return false;
      }
      
      // Click the button
      await notVisibleButton.click();
      console.log(`Clicked Not Visible button for update ${updateId}`);
      
      // Wait for modal to appear
      const modalAppeared = await this.waitForModal(casePage);
      if (!modalAppeared) {
        return false;
      }
      
      // Find and click Continue button
      const continueClicked = await this.clickContinueButton(casePage, updateId);
      if (!continueClicked) {
        return false;
      }
      
      // Wait for modal to close
      await this.waitForModalClose(casePage);
      
      // Verify visibility change
      return await this.verifyVisibilityChange(casePage, updateId);
    } catch (error) {
      console.error(`Error toggling visibility for update ${updateId}:`, error);
      return false;
    }
  }

  /**
   * Find the Not Visible button using multiple strategies
   */
  private async findNotVisibleButton(casePage: Page, updateId: string): Promise<ElementHandle | null> {
    let notVisibleButton = null;
    
    // Strategy 1: Direct button with onclick containing the updateId
    notVisibleButton = await casePage.$(`button[onclick*="toggleVisibleUpdate(${updateId})"]`);
    
    // Strategy 2: Find by span ID and get parent button
    if (!notVisibleButton) {
      const spanSelector = `span#visiblestate_${updateId}:has-text("Not Visible")`;
      const spanElement = await casePage.$(spanSelector);
      if (spanElement) {
        // Get parent button
        notVisibleButton = await casePage.evaluateHandle(
          (span) => span.closest('button'),
          spanElement
        );
      }
    }
    
    // Strategy 3: Find button containing the specific span
    if (!notVisibleButton) {
      notVisibleButton = await casePage.$(`button:has(span#visiblestate_${updateId}:has-text("Not Visible"))`);
    }
    
    // Strategy 4: Find within update container if it exists
    if (!notVisibleButton) {
      const container = await casePage.$(`div#updatearea_${updateId}`);
      if (container) {
        notVisibleButton = await container.$('button.js-visible:has-text("Not Visible")');
      }
    }
    
    return notVisibleButton;
  }

  /**
   * Wait for modal to appear
   */
  private async waitForModal(casePage: Page): Promise<boolean> {
    try {
      await casePage.waitForSelector('#formModal', { 
        state: 'visible',
        timeout: 20000 
      });
      await casePage.waitForLoadState('networkidle');
      console.log('Modal appeared and network idle');
      
      // Small delay to ensure modal is fully rendered
      await casePage.waitForTimeout(1000);
      return true;
    } catch (error) {
      console.error('Failed to wait for modal:', error);
      return false;
    }
  }

  /**
   * Find and click the Continue button in modal
   */
  private async clickContinueButton(casePage: Page, updateId: string): Promise<boolean> {
    // Find Continue button with retry logic
    let continueButton = null;
    let retries = 3;
    
    while (!continueButton && retries > 0) {
      // Try multiple selectors
      const selectors = [
        `button[onclick*="togglePostVisibleUpdate(${updateId})"]`,
        'button.btn-warning:has-text("Continue")',
        '#formModal button:has-text("Continue")',
        '.modal-footer button:has-text("Continue")',
        'button:has-text("Continue")'
      ];
      
      for (const selector of selectors) {
        try {
          continueButton = await casePage.$(selector);
          if (continueButton) {
            const isVisible = await continueButton.isVisible();
            const isEnabled = await continueButton.isEnabled();
            if (isVisible && isEnabled) {
              console.log(`Found Continue button with selector: ${selector}`);
              break;
            }
            continueButton = null;
          }
        } catch (e) {
          // Selector failed, try next
        }
      }
      
      if (!continueButton) {
        console.log(`Retry ${4 - retries}/3: Continue button not found, waiting...`);
        await casePage.waitForTimeout(1500);
        retries--;
      }
    }
    
    if (!continueButton) {
      console.error(`Continue button not found in modal for update ${updateId}`);
      // Try to close modal if it's open
      await this.tryCloseModal(casePage);
      return false;
    }
    
    // Click with retry mechanism
    return await this.clickButtonWithRetry(casePage, continueButton, updateId);
  }

  /**
   * Click button with retry mechanism
   */
  private async clickButtonWithRetry(casePage: Page, button: ElementHandle, updateId: string): Promise<boolean> {
    let clickSuccess = false;
    
    for (let i = 0; i < 3; i++) {
      try {
        // Scroll button into view first
        await button.scrollIntoViewIfNeeded();
        await casePage.waitForTimeout(200);
        
        // Try regular click
        await button.click({ timeout: 5000 });
        clickSuccess = true;
        console.log('Successfully clicked Continue button');
        break;
      } catch (clickError: any) {
        console.log(`Click attempt ${i + 1} failed: ${clickError.message}`);
        
        if (i < 2) {
          await casePage.waitForTimeout(1000);
        } else {
          // Last attempt - try force click
          try {
            await button.click({ force: true });
            clickSuccess = true;
            console.log('Force clicked Continue button');
          } catch (forceError) {
            // Try JavaScript click as final fallback
            try {
              await casePage.evaluate((el: any) => el.click(), button);
              clickSuccess = true;
              console.log('JavaScript clicked Continue button');
            } catch (jsError) {
              console.error('All click methods failed');
            }
          }
        }
      }
    }
    
    if (!clickSuccess) {
      console.error(`Failed to click Continue button for update ${updateId}`);
    }
    
    return clickSuccess;
  }

  /**
   * Try to close modal if it's open
   */
  private async tryCloseModal(casePage: Page): Promise<void> {
    try {
      const closeButton = await casePage.$('button[data-dismiss="modal"], .modal-header .close, .modal-header button.close');
      if (closeButton) {
        await closeButton.click();
        await casePage.waitForTimeout(500);
      }
    } catch (error) {
      // Ignore errors when trying to close modal
    }
  }

  /**
   * Wait for modal to close
   */
  private async waitForModalClose(casePage: Page): Promise<void> {
    try {
      await casePage.waitForSelector('#formModal', { 
        state: 'hidden',
        timeout: 20000 
      });
    } catch (error) {
      console.log('Modal close timeout, checking if already closed...');
      const modalVisible = await casePage.isVisible('#formModal');
      if (modalVisible) {
        console.error('Modal still visible after timeout');
        // Try to force close
        await casePage.evaluate(() => {
          const modal = document.querySelector('#formModal') as HTMLElement;
          if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
          }
        });
        await casePage.waitForTimeout(500);
      }
    }
  }

  /**
   * Verify visibility change
   */
  private async verifyVisibilityChange(casePage: Page, updateId: string): Promise<boolean> {
    try {
      await casePage.waitForFunction(
        (updateId) => {
          const span = document.querySelector(`#visiblestate_${updateId}`);
          return span && span.textContent?.trim() === 'Visible';
        },
        updateId,
        { timeout: 5000 }
      );
      
      // Double-check the status
      const visibilitySpan = await casePage.$(`#visiblestate_${updateId}`);
      const newStatus = await visibilitySpan?.textContent();
      const success = newStatus?.trim() === 'Visible';
      
      if (success) {
        console.log(`Successfully toggled visibility for update ${updateId}`);
      } else {
        console.error(`Failed to verify visibility change for update ${updateId}. Current status: ${newStatus}`);
      }
      
      return success;
    } catch (timeoutError) {
      console.error(`Timeout waiting for visibility change for update ${updateId}`);
      // Check final status anyway
      const visibilitySpan = await casePage.$(`#visiblestate_${updateId}`);
      const finalStatus = await visibilitySpan?.textContent();
      const isVisible = finalStatus?.trim() === 'Visible';
      
      if (isVisible) {
        console.log(`Update ${updateId} is now visible despite timeout`);
        return true;
      }
      
      return false;
    }
  }
}