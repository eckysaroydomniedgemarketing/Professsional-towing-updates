import { Page } from 'playwright';
import { InvoiceExtractorService } from './invoice-extractor.service';
import { InvoiceStorageService } from './invoice-storage.service';

export class InvoiceProcessorService {
  private extractorService: InvoiceExtractorService;
  private storageService: InvoiceStorageService;

  constructor(private page: Page) {
    this.extractorService = new InvoiceExtractorService(page);
    this.storageService = new InvoiceStorageService();
  }

  async processInvoicesForCase(caseId: string): Promise<{
    success: boolean;
    message: string;
    invoiceCount: number;
    itemCount: number;
  }> {
    try {
      console.log(`Starting invoice processing for case ${caseId}`);

      // Extract invoice data from the page
      const invoices = await this.extractorService.processInvoices(caseId);

      if (invoices.length === 0) {
        console.log('No invoices found to process');
        return {
          success: true,
          message: 'No invoices found for this case',
          invoiceCount: 0,
          itemCount: 0
        };
      }

      // Count total items
      const totalItems = invoices.reduce((sum, invoice) => sum + invoice.items.length, 0);

      // Clear existing data for this case (to avoid duplicates)
      await this.storageService.deleteInvoiceData(caseId);

      // Store the extracted data
      const storeSuccess = await this.storageService.storeInvoiceData(caseId, invoices);

      if (!storeSuccess) {
        return {
          success: false,
          message: 'Failed to store invoice data',
          invoiceCount: invoices.length,
          itemCount: totalItems
        };
      }

      return {
        success: true,
        message: `Successfully processed ${invoices.length} invoice(s) with ${totalItems} item(s)`,
        invoiceCount: invoices.length,
        itemCount: totalItems
      };
    } catch (error) {
      console.error('Error in processInvoicesForCase:', error);
      return {
        success: false,
        message: `Error processing invoices: ${error}`,
        invoiceCount: 0,
        itemCount: 0
      };
    }
  }

  async navigateToUpdatesTab(): Promise<boolean> {
    try {
      // Click on Updates tab (tab_6)
      const updatesTab = await this.page.locator('#tab_6 a').first();
      if (!updatesTab) {
        console.log('Updates tab not found');
        return false;
      }

      await updatesTab.click();
      
      // Wait for content to load
      await this.page.waitForTimeout(3000);
      
      console.log('Successfully navigated to Updates tab');
      return true;
    } catch (error) {
      console.error('Error navigating to Updates tab:', error);
      return false;
    }
  }

  async getStoredInvoiceData(caseId: string) {
    return await this.storageService.getInvoiceData(caseId);
  }
}