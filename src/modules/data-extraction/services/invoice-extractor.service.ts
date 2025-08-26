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

  async processInvoices(caseId: string): Promise<InvoiceData[]> {
    // Navigate to Invoices tab
    const navigationSuccess = await this.navigateToInvoicesTab();
    
    if (!navigationSuccess) {
      console.error('Failed to navigate to Invoices tab');
      return [];
    }

    // Extract invoice data
    const invoiceData = await this.extractInvoiceData();
    
    console.log(`Extracted ${invoiceData.length} invoices for case ${caseId}`);
    
    return invoiceData;
  }
}