import { Page } from 'playwright';

export interface AdjusterPayment {
  paymentId: string;
  adjusterName: string;
  amount: number;
  paymentType: string;
  paymentDate: string;
}

export interface AdjusterPaymentsResult {
  success: boolean;
  tabFound: boolean;
  payments: AdjusterPayment[];
  message: string;
}

export class AdjusterPaymentsExtractorService {
  constructor(private page: Page) {}

  async checkPayAdjusterTabExists(): Promise<boolean> {
    try {
      // Check if Pay Adjuster tab exists in the DOM
      const tabCount = await this.page.locator('#tab_8').count();
      if (tabCount > 0) {
        return true;
      }

      // Also check for the text in navigation
      const navCount = await this.page.locator('text="Pay Adjuster"').count();
      return navCount > 0;
    } catch (error) {
      console.error('Error checking Pay Adjuster tab:', error);
      return false;
    }
  }

  async navigateToPayAdjusterTab(): Promise<boolean> {
    try {
      // Click on Pay Adjuster tab
      const payAdjusterTab = await this.page.locator('#tab_8 a').first();
      if (!payAdjusterTab) {
        console.log('Pay Adjuster tab element not found');
        return false;
      }

      await payAdjusterTab.click();
      
      // Wait for content to load
      await this.page.waitForTimeout(3000);
      
      return true;
    } catch (error) {
      console.error('Error navigating to Pay Adjuster tab:', error);
      return false;
    }
  }

  async extractPaymentData(): Promise<AdjusterPayment[]> {
    try {
      const payments: AdjusterPayment[] = [];
      
      // Find the payment history table
      const paymentsTable = await this.page.locator('#the_payments');
      const tableExists = await paymentsTable.count() > 0;
      
      if (!tableExists) {
        console.log('Payment history table not found');
        return payments;
      }

      // Get all payment rows (skip header)
      const rows = await this.page.locator('#the_payments tbody tr').all();
      
      for (const row of rows) {
        const cells = await row.locator('td').all();
        
        if (cells.length >= 6) {
          // Based on actual HTML structure:
          // Cell 0: Date (08/27/2025)
          // Cell 1: Adjuster Name
          // Cell 2: Payment Type (if exists)
          // Cell 3: Date Paid Status ("unpaid" or date)
          // Cell 4: Check Number
          // Cell 5: Amount
          
          // Extract date from first cell
          const dateText = await cells[0].textContent();
          const paymentDate = this.parseDate(dateText || '');
          
          // Extract adjuster name from second cell
          const adjusterName = await cells[1].textContent();
          
          // Extract payment type (if column exists)
          let paymentType = '';
          if (cells.length > 2) {
            const typeText = await cells[2].textContent();
            paymentType = typeText?.trim() || '';
          }
          
          // Extract amount from the 5th or 6th cell (depending on table structure)
          let amount = 0;
          if (cells.length === 6) {
            const amountText = await cells[5].textContent();
            amount = this.parseAmount(amountText || '0');
          } else if (cells.length === 7) {
            // Some tables might have an extra column
            const amountText = await cells[5].textContent();
            amount = this.parseAmount(amountText || '0');
          }
          
          // Extract payment ID from the row ID attribute if available
          const rowId = await row.getAttribute('id');
          const paymentId = rowId ? rowId.replace('ret_', '') : `payment_${Date.now()}`;
          
          if (adjusterName && paymentDate) {
            payments.push({
              paymentId: paymentId,
              adjusterName: adjusterName?.trim() || '',
              amount: amount,
              paymentType: paymentType,
              paymentDate: paymentDate
            });
          }
        }
      }

      return payments;
    } catch (error) {
      console.error('Error extracting payment data:', error);
      return [];
    }
  }

  private parseAmount(amountText: string): number {
    // Remove $, commas, and any other non-numeric characters except decimal point
    const cleanAmount = amountText.replace(/[^0-9.-]/g, '');
    return parseFloat(cleanAmount) || 0;
  }

  private parseDate(dateText: string): string {
    try {
      // Handle empty or invalid date strings
      if (!dateText || dateText.trim() === '' || dateText.toLowerCase() === 'unpaid') {
        return ''; // Return empty string which will be stored as NULL in database
      }
      
      // Expected format: MM/DD/YYYY
      const trimmedDate = dateText.trim();
      const parts = trimmedDate.split('/');
      
      if (parts.length === 3) {
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        
        // Basic validation
        const monthNum = parseInt(month);
        const dayNum = parseInt(day);
        const yearNum = parseInt(year);
        
        if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31 && yearNum > 1900) {
          return `${year}-${month}-${day}`;
        }
      }
      
      // If date doesn't match expected format, return empty string
      return '';
    } catch {
      return '';
    }
  }

  async processAdjusterPayments(caseId: string): Promise<AdjusterPaymentsResult> {
    try {
      // First check if tab exists
      const tabExists = await this.checkPayAdjusterTabExists();
      
      if (!tabExists) {
        console.log(`Pay Adjuster tab not found for case ${caseId}`);
        return {
          success: true,
          tabFound: false,
          payments: [],
          message: 'Pay Adjuster tab not available for this case'
        };
      }

      // Navigate to Pay Adjuster tab
      const navigationSuccess = await this.navigateToPayAdjusterTab();
      
      if (!navigationSuccess) {
        return {
          success: false,
          tabFound: true,
          payments: [],
          message: 'Failed to navigate to Pay Adjuster tab'
        };
      }

      // Extract payment data
      const payments = await this.extractPaymentData();
      
      console.log(`Extracted ${payments.length} payments for case ${caseId}`);
      
      return {
        success: true,
        tabFound: true,
        payments,
        message: `Successfully extracted ${payments.length} payment records`
      };
    } catch (error) {
      console.error('Error processing adjuster payments:', error);
      return {
        success: false,
        tabFound: false,
        payments: [],
        message: `Error: ${error}`
      };
    }
  }
}