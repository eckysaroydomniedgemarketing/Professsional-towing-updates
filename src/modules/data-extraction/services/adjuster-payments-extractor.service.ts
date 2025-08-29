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
        
        if (cells.length >= 5) {
          // Extract payment ID from first cell
          const paymentIdText = await cells[0].textContent();
          const paymentId = paymentIdText?.replace('#', '').trim() || '';
          
          // Extract adjuster name from second cell (has id like ret_adjuster_21249634)
          const adjusterName = await cells[1].textContent();
          
          // Extract amount from third cell
          const amountText = await cells[2].textContent();
          const amount = this.parseAmount(amountText || '0');
          
          // Extract type from fourth cell
          const paymentType = await cells[3].textContent();
          
          // Extract date from fifth cell
          const dateText = await cells[4].textContent();
          const paymentDate = this.parseDate(dateText || '');
          
          if (paymentId && adjusterName) {
            payments.push({
              paymentId: paymentId,
              adjusterName: adjusterName?.trim() || '',
              amount: amount,
              paymentType: paymentType?.trim() || '',
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
      // Expected format: MM/DD/YYYY
      const parts = dateText.trim().split('/');
      if (parts.length === 3) {
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
      return dateText.trim();
    } catch {
      return dateText.trim();
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