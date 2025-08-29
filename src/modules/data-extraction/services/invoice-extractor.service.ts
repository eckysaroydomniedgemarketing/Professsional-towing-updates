import { Page } from 'playwright';

export interface InvoiceItem {
  date: string;
  serviceRendered: string;
  cost: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  items: InvoiceItem[];
}

export interface InvoiceExtractionResult {
  invoices: InvoiceData[];
  subStatuses: string[];
}

export class InvoiceExtractorService {
  constructor(private page: Page) {}

  async navigateToInvoicesTab(): Promise<boolean> {
    try {
      // Click on Invoices tab
      const invoicesTab = await this.page.locator('#tab_85 a').first();
      if (!invoicesTab) {
        console.log('Invoices tab not found');
        return false;
      }

      await invoicesTab.click();
      
      // Wait for content to load
      await this.page.waitForTimeout(3000);
      
      return true;
    } catch (error) {
      console.error('Error navigating to Invoices tab:', error);
      return false;
    }
  }

  async extractSubStatuses(): Promise<string[]> {
    try {
      // Find all h5 elements with sub-status badges in the module_10110 section
      const badgeElements = await this.page.locator('#module_10110 h5.d-inline span.badge').all();
      
      if (badgeElements.length < 3) {
        console.log('No sub-statuses to extract (less than 3 badges total)');
        return [];
      }

      const subStatuses: string[] = [];
      
      // Skip first 2 badges, start from index 2
      for (let i = 2; i < badgeElements.length; i++) {
        const badgeText = await badgeElements[i].textContent();
        if (badgeText) {
          // Clean the text (remove any extra whitespace or icons)
          const cleanText = badgeText.trim().replace(/\s+/g, ' ');
          // Remove any trailing icon text if present
          const statusName = cleanText.split('\n')[0].trim();
          if (statusName) {
            subStatuses.push(statusName);
          }
        }
      }

      console.log(`Extracted ${subStatuses.length} sub-statuses`);
      return subStatuses;
    } catch (error) {
      console.error('Error extracting sub-statuses:', error);
      return [];
    }
  }

  async extractInvoiceData(): Promise<InvoiceData[]> {
    try {
      const invoices: InvoiceData[] = [];
      
      // Find all invoice sections
      const invoiceSections = await this.page.locator('[id^="viewmode_invoice_"]').all();
      
      if (invoiceSections.length === 0) {
        console.log('No invoices found');
        return invoices;
      }

      for (const section of invoiceSections) {
        // Extract invoice number
        const invoiceNumberElement = await section.locator('.sectiontitle').nth(2);
        const invoiceNumber = await invoiceNumberElement.textContent() || '';

        // Find the table with invoice items
        const table = await section.locator('table.table').first();
        
        if (!table) {
          console.log(`No table found for invoice ${invoiceNumber}`);
          continue;
        }

        // Extract items from table rows
        const items: InvoiceItem[] = [];
        const rows = await table.locator('tbody tr').all();
        
        for (const row of rows) {
          // Check if row has enough columns (data row)
          const cells = await row.locator('td').all();
          
          if (cells.length >= 7) {
            // Extract date from first cell
            const dateText = await cells[0].textContent();
            
            // Extract service from second cell
            const serviceText = await cells[1].textContent();
            
            // Extract cost from fourth cell (index 3)
            const costText = await cells[3].textContent();
            
            // Skip if this is a note row or summary row
            if (dateText && !dateText.includes('Note:') && serviceText && costText) {
              items.push({
                date: dateText.trim(),
                serviceRendered: serviceText.trim(),
                cost: costText.trim()
              });
            }
          }
        }

        if (invoiceNumber) {
          invoices.push({
            invoiceNumber: invoiceNumber.trim(),
            items
          });
        }
      }

      return invoices;
    } catch (error) {
      console.error('Error extracting invoice data:', error);
      return [];
    }
  }

  async processInvoices(caseId: string): Promise<InvoiceExtractionResult> {
    // Navigate to Invoices tab
    const navigationSuccess = await this.navigateToInvoicesTab();
    
    if (!navigationSuccess) {
      console.error('Failed to navigate to Invoices tab');
      return { invoices: [], subStatuses: [] };
    }

    // Extract invoice data
    const invoiceData = await this.extractInvoiceData();
    
    // Extract sub-statuses from the same page
    const subStatuses = await this.extractSubStatuses();
    
    console.log(`Extracted ${invoiceData.length} invoices and ${subStatuses.length} sub-statuses for case ${caseId}`);
    
    return { invoices: invoiceData, subStatuses };
  }
}