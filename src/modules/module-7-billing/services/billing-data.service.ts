import { createClient } from '@supabase/supabase-js';
import { BillingData, ClientFeeRate, InvoiceData } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export class BillingDataService {
  private supabase = createClient(supabaseUrl, supabaseKey);

  async getBillingData(caseId: string): Promise<BillingData | null> {
    try {
      // Fetch case details - use limit(1) to handle duplicates
      const { data: caseDetailsArray, error: caseError } = await this.supabase
        .from('case_details')
        .select('client, lien_holder, status')
        .eq('case_id', caseId)
        .limit(1);

      if (caseError || !caseDetailsArray || caseDetailsArray.length === 0) {
        console.error('Error fetching case details:', caseError);
        return null;
      }

      const caseDetails = caseDetailsArray[0];

      const clientName = caseDetails.client;

      // Fetch client fee rates
      const { data: feeRates, error: feeError } = await this.supabase
        .from('client_fee_rates')
        .select('*')
        .eq('client_name', clientName)
        .order('fee_category', { ascending: true });

      if (feeError) {
        console.error('Error fetching fee rates:', feeError);
      }

      // Fetch invoice data
      const { data: invoiceData, error: invoiceError } = await this.supabase
        .from('invoice_data')
        .select('*')
        .eq('case_id', caseId)
        .order('service_date', { ascending: true });

      if (invoiceError) {
        console.error('Error fetching invoice data:', invoiceError);
      }

      // Calculate summary
      const subtotal = (invoiceData || []).reduce((sum, item) => {
        return sum + (parseFloat(item.cost) || 0);
      }, 0);

      const tax = 0; // No tax for MVP
      const total = subtotal + tax;

      return {
        caseId,
        clientName,
        lienHolder: caseDetails.lien_holder,
        status: caseDetails.status,
        clientFeeRates: (feeRates || []) as ClientFeeRate[],
        invoiceData: (invoiceData || []) as InvoiceData[],
        summary: {
          subtotal,
          tax,
          total
        }
      };

    } catch (error) {
      console.error('Error in getBillingData:', error);
      return null;
    }
  }
}