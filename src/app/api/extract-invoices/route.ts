import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { InvoiceProcessorService } from '@/modules/data-extraction/services/invoice-processor.service';

export async function POST(request: NextRequest) {
  try {
    const { caseId } = await request.json();

    if (!caseId) {
      return NextResponse.json(
        { success: false, message: 'Case ID is required' },
        { status: 400 }
      );
    }

    // Get the current browser session from context
    // This assumes the browser is already logged in to RDN portal
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages()[0];

    // Process invoices
    const processor = new InvoiceProcessorService(page);
    const result = await processor.processInvoicesForCase(caseId);

    // Navigate to Updates tab after processing
    if (result.success && result.invoiceCount > 0) {
      await processor.navigateToUpdatesTab();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in extract-invoices API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error}`,
        invoiceCount: 0,
        itemCount: 0
      },
      { status: 500 }
    );
  }
}