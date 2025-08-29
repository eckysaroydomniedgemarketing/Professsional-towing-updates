import { createClient } from '@supabase/supabase-js';
import { AdjusterPayment } from './adjuster-payments-extractor.service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export class AdjusterPaymentsStorageService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async storeAdjusterPayments(caseId: string, payments: AdjusterPayment[]): Promise<boolean> {
    try {
      if (payments.length === 0) {
        console.log('No payments to store');
        return true;
      }

      // Prepare data for insertion
      const dataToInsert = payments.map(payment => ({
        case_id: caseId,
        payment_id: payment.paymentId,
        adjuster_name: payment.adjusterName,
        amount: payment.amount,
        payment_type: payment.paymentType,
        payment_date: payment.paymentDate || null // Store NULL if date is empty
      }));

      // Delete existing payments for this case to avoid duplicates
      await this.deleteAdjusterPayments(caseId);

      // Insert new payment records
      const { data, error } = await this.supabase
        .from('case_adjuster_payments')
        .insert(dataToInsert);

      if (error) {
        console.error('Error storing adjuster payments:', error);
        return false;
      }

      console.log(`Stored ${payments.length} payments for case ${caseId}`);
      return true;
    } catch (error) {
      console.error('Error in storeAdjusterPayments:', error);
      return false;
    }
  }

  async getAdjusterPayments(caseId: string) {
    try {
      const { data, error } = await this.supabase
        .from('case_adjuster_payments')
        .select('*')
        .eq('case_id', caseId)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching adjuster payments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAdjusterPayments:', error);
      return [];
    }
  }

  async deleteAdjusterPayments(caseId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('case_adjuster_payments')
        .delete()
        .eq('case_id', caseId);

      if (error) {
        console.error('Error deleting adjuster payments:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteAdjusterPayments:', error);
      return false;
    }
  }

  async getTotalPayments(caseId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('case_adjuster_payments')
        .select('amount')
        .eq('case_id', caseId);

      if (error) {
        console.error('Error fetching total payments:', error);
        return 0;
      }

      if (!data || data.length === 0) {
        return 0;
      }

      const total = data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      return total;
    } catch (error) {
      console.error('Error in getTotalPayments:', error);
      return 0;
    }
  }
}