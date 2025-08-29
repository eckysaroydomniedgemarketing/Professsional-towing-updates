import { Page } from 'playwright';
import { InvoiceExtractorService } from './invoice-extractor.service';
import { InvoiceStorageService } from './invoice-storage.service';
import { VehiclePhotosExtractorService } from './vehicle-photos-extractor.service';
import { VehiclePhotosStorageService } from './vehicle-photos-storage.service';
import { AdjusterPaymentsExtractorService } from './adjuster-payments-extractor.service';
import { AdjusterPaymentsStorageService } from './adjuster-payments-storage.service';

export class InvoiceProcessorService {
  private extractorService: InvoiceExtractorService;
  private storageService: InvoiceStorageService;
  private photosExtractorService: VehiclePhotosExtractorService;
  private photosStorageService: VehiclePhotosStorageService;
  private paymentsExtractorService: AdjusterPaymentsExtractorService;
  private paymentsStorageService: AdjusterPaymentsStorageService;

  constructor(private page: Page) {
    this.extractorService = new InvoiceExtractorService(page);
    this.storageService = new InvoiceStorageService();
    this.photosExtractorService = new VehiclePhotosExtractorService(page);
    this.photosStorageService = new VehiclePhotosStorageService(page); // Pass page for downloader
    this.paymentsExtractorService = new AdjusterPaymentsExtractorService(page);
    this.paymentsStorageService = new AdjusterPaymentsStorageService();
  }

  async processInvoicesForCase(caseId: string): Promise<{
    success: boolean;
    message: string;
    invoiceCount: number;
    itemCount: number;
    subStatusCount: number;
    photoCount?: number;
    paymentCount?: number;
  }> {
    try {
      console.log(`Starting invoice processing for case ${caseId}`);

      // Extract invoice data and sub-statuses from the page
      const extractionResult = await this.extractorService.processInvoices(caseId);

      if (extractionResult.invoices.length === 0 && extractionResult.subStatuses.length === 0) {
        console.log('No invoices or sub-statuses found to process');
        return {
          success: true,
          message: 'No invoices or sub-statuses found for this case',
          invoiceCount: 0,
          itemCount: 0,
          subStatusCount: 0
        };
      }

      // Count total items
      const totalItems = extractionResult.invoices.reduce((sum, invoice) => sum + invoice.items.length, 0);

      // Clear existing invoice data for this case (to avoid duplicates)
      await this.storageService.deleteInvoiceData(caseId);

      // Store the extracted data (invoices and sub-statuses)
      const storeSuccess = await this.storageService.storeInvoiceDataWithSubStatuses(caseId, extractionResult);

      if (!storeSuccess) {
        return {
          success: false,
          message: 'Failed to store invoice data or sub-statuses',
          invoiceCount: extractionResult.invoices.length,
          itemCount: totalItems,
          subStatusCount: extractionResult.subStatuses.length,
          photoCount: 0,
          paymentCount: 0
        };
      }

      // Process vehicle photos - TEMPORARILY COMMENTED OUT
      let photoCount = 0;
      console.log('Vehicle photos processing temporarily disabled');
      
      /*
      console.log('Processing vehicle photos...');
      const photosResult = await this.photosExtractorService.processVehiclePhotos(caseId);
      
      if (photosResult.success && photosResult.photos.length > 0) {
        console.log(`Found ${photosResult.photos.length} photos to process`);
        const photoStoreSuccess = await this.photosStorageService.storeVehiclePhotos(caseId, photosResult.photos);
        if (photoStoreSuccess) {
          photoCount = photosResult.photos.length;
          console.log(`Successfully processed and stored ${photoCount} vehicle photos`);
        } else {
          console.log('Failed to store some or all vehicle photos');
        }
      } else if (!photosResult.tabFound) {
        console.log('Photos/Docs tab not found for this case');
      } else {
        console.log('No photos found in Photos/Docs tab');
      }
      */

      // Process adjuster payments - TEMPORARILY COMMENTED OUT
      let paymentCount = 0;
      console.log('Adjuster payments processing temporarily disabled');
      
      /*
      const paymentsResult = await this.paymentsExtractorService.processAdjusterPayments(caseId);
      if (paymentsResult.success && paymentsResult.tabFound && paymentsResult.payments.length > 0) {
        const paymentStoreSuccess = await this.paymentsStorageService.storeAdjusterPayments(caseId, paymentsResult.payments);
        if (paymentStoreSuccess) {
          paymentCount = paymentsResult.payments.length;
          console.log(`Stored ${paymentCount} adjuster payments`);
        }
      } else if (!paymentsResult.tabFound) {
        console.log('Pay Adjuster tab not available for this case');
      }
      */

      return {
        success: true,
        message: `Successfully processed ${extractionResult.invoices.length} invoice(s) with ${totalItems} item(s), ${extractionResult.subStatuses.length} sub-status(es), ${photoCount} photo(s), and ${paymentCount} payment(s)`,
        invoiceCount: extractionResult.invoices.length,
        itemCount: totalItems,
        subStatusCount: extractionResult.subStatuses.length,
        photoCount,
        paymentCount
      };
    } catch (error) {
      console.error('Error in processInvoicesForCase:', error);
      return {
        success: false,
        message: `Error processing invoices: ${error}`,
        invoiceCount: 0,
        itemCount: 0,
        subStatusCount: 0,
        photoCount: 0,
        paymentCount: 0
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

  async getStoredVehiclePhotos(caseId: string) {
    return await this.photosStorageService.getVehiclePhotos(caseId);
  }

  async getStoredAdjusterPayments(caseId: string) {
    return await this.paymentsStorageService.getAdjusterPayments(caseId);
  }
}