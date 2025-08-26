import { NextRequest, NextResponse } from 'next/server';
import { BillingDataService } from '@/modules/module-7-billing/services/billing-data.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    const billingService = new BillingDataService();
    const billingData = await billingService.getBillingData(caseId);

    if (!billingData) {
      return NextResponse.json(
        { error: 'Failed to fetch billing data' },
        { status: 404 }
      );
    }

    return NextResponse.json(billingData);

  } catch (error) {
    console.error('API billing-data error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
