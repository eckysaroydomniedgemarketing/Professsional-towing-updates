import { Page } from 'playwright';
import type { ProcessCaseResult } from '../types';
import { CaseNavigationService } from './case-navigation.service';
import { UpdateDiscoveryService } from './update-discovery.service';
import { VisibilityToggleService } from './visibility-toggle.service';
// import { ProtocolButtonsService } from './protocol-buttons.service'; // Disconnected - keeping for future use

class RDNVisibilityService {
  private page: Page | null = null;
  
  // Sub-services
  private caseNavigation: CaseNavigationService;
  private updateDiscovery: UpdateDiscoveryService;
  private visibilityToggle: VisibilityToggleService;
  // private protocolButtons: ProtocolButtonsService; // Disconnected - keeping for future use

  constructor() {
    this.caseNavigation = new CaseNavigationService();
    this.updateDiscovery = new UpdateDiscoveryService();
    this.visibilityToggle = new VisibilityToggleService();
    // this.protocolButtons = new ProtocolButtonsService(); // Disconnected - keeping for future use
  }

  /**
   * Set the Playwright page instance
   */
  setPage(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to new updates page
   */
  async navigateToNewUpdates(): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');
    return this.caseNavigation.navigateToNewUpdates(this.page);
  }

  /**
   * Get the first case from new updates list
   */
  async getFirstCase(): Promise<string | null> {
    if (!this.page) throw new Error('Page not initialized');
    return this.caseNavigation.getFirstCase(this.page);
  }

  /**
   * Open case in new tab and switch to it
   */
  async openCaseInNewTab(caseId: string): Promise<Page | null> {
    if (!this.page) throw new Error('Page not initialized');
    return this.caseNavigation.openCaseInNewTab(this.page, caseId);
  }

  /**
   * Load all updates by clicking "ALL" in pagination
   */
  async loadAllUpdates(casePage: Page): Promise<boolean> {
    return this.caseNavigation.loadAllUpdates(casePage);
  }

  /**
   * Find all agent updates that are not visible
   */
  async findInvisibleAgentUpdates(casePage: Page) {
    return this.updateDiscovery.findInvisibleAgentUpdates(casePage);
  }

  /**
   * Toggle visibility for a single update
   */
  async toggleUpdateVisibility(casePage: Page, updateId: string): Promise<boolean> {
    return this.visibilityToggle.toggleUpdateVisibility(casePage, updateId);
  }

  /**
   * Click protocol buttons after making update visible
   * DISCONNECTED - Keeping for future use
   */
  // async clickProtocolButtons(casePage: Page, updateId: string): Promise<ButtonClickResult> {
  //   return this.protocolButtons.clickProtocolButtons(casePage, updateId);
  // }

  /**
   * Process all invisible agent updates in a case
   */
  async processCase(casePage: Page, caseId: string): Promise<ProcessCaseResult> {
    try {
      // Load all updates
      const allLoaded = await this.loadAllUpdates(casePage);
      
      if (!allLoaded) {
        return {
          caseId,
          updatesProcessed: 0,
          success: false,
          error: 'Failed to load all updates'
        };
      }
      
      // Find invisible agent updates
      const invisibleUpdates = await this.findInvisibleAgentUpdates(casePage);
      
      if (invisibleUpdates.length === 0) {
        console.log(`No invisible agent updates found for case ${caseId}`);
        return {
          caseId,
          updatesProcessed: 0,
          success: true
        };
      }
      
      console.log(`Found ${invisibleUpdates.length} invisible agent updates from Professional Towing for case ${caseId}`);
      
      // Toggle visibility for each update
      let processedCount = 0;
      let companyName: string | undefined;
      let combinedUpdateText = '';
      
      // DISCONNECTED - Button click functionality commented out for future use
      // Aggregate button click results
      // const aggregatedButtonClicks: ButtonClickResult = {
      //   transfer_to_client_clicked: false,
      //   client_button_clicked: false,
      //   collector_button_clicked: false,
      //   buttons_available: {}
      // };
      
      for (const update of invisibleUpdates) {
        const toggled = await this.toggleUpdateVisibility(casePage, update.updateId);
        
        if (toggled) {
          processedCount++;
          console.log(`Toggled visibility for update ${update.updateId} from company: ${update.company}`);
          
          // DISCONNECTED - Protocol button clicking commented out for future use
          // Click protocol buttons after making update visible
          // const buttonResults = await this.clickProtocolButtons(casePage, update.updateId);
          
          // Aggregate button results (if any button was clicked/available across all updates)
          // if (buttonResults.transfer_to_client_clicked) {
          //   aggregatedButtonClicks.transfer_to_client_clicked = true;
          // }
          // if (buttonResults.client_button_clicked) {
          //   aggregatedButtonClicks.client_button_clicked = true;
          // }
          // if (buttonResults.collector_button_clicked) {
          //   aggregatedButtonClicks.collector_button_clicked = true;
          // }
          // if (buttonResults.buttons_available.transfer_to_client) {
          //   aggregatedButtonClicks.buttons_available.transfer_to_client = true;
          // }
          // if (buttonResults.buttons_available.client) {
          //   aggregatedButtonClicks.buttons_available.client = true;
          // }
          // if (buttonResults.buttons_available.collector) {
          //   aggregatedButtonClicks.buttons_available.collector = true;
          // }
          
          // Store company name from first processed update
          if (!companyName && update.company) {
            companyName = update.company;
          }
          
          // Combine update texts (with separator if multiple)
          if (update.updateText) {
            if (combinedUpdateText) {
              combinedUpdateText += ' | '; // Separator between multiple updates
            }
            combinedUpdateText += update.updateText;
          }
        } else {
          console.error(`Failed to toggle visibility for update ${update.updateId} from company: ${update.company}`);
        }
        
        // Small delay between updates to avoid overwhelming the server
        await casePage.waitForTimeout(1000);
      }
      
      // Truncate combined update text if too long (database field limit)
      if (combinedUpdateText.length > 5000) {
        combinedUpdateText = combinedUpdateText.substring(0, 4997) + '...';
      }
      
      return {
        caseId,
        updatesProcessed: processedCount,
        company: companyName,
        updateText: combinedUpdateText || undefined,
        success: processedCount === invisibleUpdates.length
        // buttonClicks: aggregatedButtonClicks // DISCONNECTED - commented out for future use
      };
    } catch (error) {
      console.error(`Error processing case ${caseId}:`, error);
      return {
        caseId,
        updatesProcessed: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Close case tab and return to new updates page
   */
  async closeCaseTab(casePage: Page): Promise<void> {
    return this.caseNavigation.closeCaseTab(casePage);
  }
}

export default new RDNVisibilityService();