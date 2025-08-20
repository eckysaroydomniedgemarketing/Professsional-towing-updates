import { Page } from 'playwright';
import type { ButtonClickResult } from '../types';

export class ProtocolButtonsService {
  /**
   * Click protocol buttons after making update visible
   */
  async clickProtocolButtons(casePage: Page, updateId: string): Promise<ButtonClickResult> {
    const result: ButtonClickResult = {
      transfer_to_client_clicked: false,
      client_button_clicked: false,
      collector_button_clicked: false,
      buttons_available: {}
    };

    try {
      // Find the update container
      const updateContainer = await casePage.$(`div#updatearea_${updateId}`);
      if (!updateContainer) {
        console.log(`Update container not found for update ${updateId}`);
        return result;
      }

      // Check and click Transfer to Client button
      await this.clickTransferToClientButton(updateContainer, result, updateId);

      // Check and click Client button
      await this.clickClientButton(updateContainer, result, updateId);

      // Check and click Collector button
      await this.clickCollectorButton(updateContainer, result, updateId);

      console.log(`Button click results for update ${updateId}:`, result);
      return result;
    } catch (error) {
      console.error(`Error clicking protocol buttons for update ${updateId}:`, error);
      return result;
    }
  }

  /**
   * Click Transfer to Client button
   */
  private async clickTransferToClientButton(
    updateContainer: any,
    result: ButtonClickResult,
    updateId: string
  ): Promise<void> {
    const transferButton = await updateContainer.$('button.js-transfer2client');
    if (transferButton) {
      result.buttons_available.transfer_to_client = true;
      try {
        await transferButton.click();
        await updateContainer.page().waitForTimeout(500);
        result.transfer_to_client_clicked = true;
        console.log(`Clicked Transfer to Client button for update ${updateId}`);
      } catch (error) {
        console.log(`Failed to click Transfer to Client button: ${error}`);
      }
    }
  }

  /**
   * Click Client button
   */
  private async clickClientButton(
    updateContainer: any,
    result: ButtonClickResult,
    updateId: string
  ): Promise<void> {
    const clientButton = await updateContainer.$('button.btn-link:has-text("Client")');
    if (clientButton) {
      result.buttons_available.client = true;
      try {
        await clientButton.click();
        await updateContainer.page().waitForTimeout(500);
        result.client_button_clicked = true;
        console.log(`Clicked Client button for update ${updateId}`);
      } catch (error) {
        console.log(`Failed to click Client button: ${error}`);
      }
    }
  }

  /**
   * Click Collector button
   */
  private async clickCollectorButton(
    updateContainer: any,
    result: ButtonClickResult,
    updateId: string
  ): Promise<void> {
    const collectorButton = await updateContainer.$('button[onclick*="emailSlider(\'collector\'"]');
    if (!collectorButton) {
      // Alternative selector
      const altCollectorButton = await updateContainer.$('button.btn-link:has-text("Collector")');
      if (altCollectorButton) {
        result.buttons_available.collector = true;
        try {
          await altCollectorButton.click();
          await updateContainer.page().waitForTimeout(500);
          result.collector_button_clicked = true;
          console.log(`Clicked Collector button for update ${updateId}`);
        } catch (error) {
          console.log(`Failed to click Collector button: ${error}`);
        }
      }
    } else {
      result.buttons_available.collector = true;
      try {
        await collectorButton.click();
        await updateContainer.page().waitForTimeout(500);
        result.collector_button_clicked = true;
        console.log(`Clicked Collector button for update ${updateId}`);
      } catch (error) {
        console.log(`Failed to click Collector button: ${error}`);
      }
    }
  }
}