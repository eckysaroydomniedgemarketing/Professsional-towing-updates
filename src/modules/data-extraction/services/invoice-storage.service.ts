import { createClient } from '@supabase/supabase-js';
import { InvoiceData, InvoiceExtractionResult } from './invoice-extractor.service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export class InvoiceStorageService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async storeInvoiceData(caseId: string, invoices: InvoiceData[]): Promise<boolean> {
    try {
      // Prepare data for insertion
      const dataToInsert = [];
      
      for (const invoice of invoices) {
        for (const item of invoice.items) {
          // Parse date to proper format
          const serviceDateParts = item.date.split('/');
          let serviceDate = null;
          if (serviceDateParts.length === 3) {
            // Convert MM/DD/YYYY to YYYY-MM-DD
            serviceDate = `${serviceDateParts[2]}-${serviceDateParts[0].padStart(2, '0')}-${serviceDateParts[1].padStart(2, '0')}`;
          }

          // Parse cost (remove $ and commas)
          const costValue = parseFloat(item.cost.replace(/[$,]/g, '')) || 0;

          dataToInsert.push({
            case_id: caseId,
            invoice_number: invoice.invoiceNumber,
            service_date: serviceDate,
            service_name: item.serviceRendered,
            cost: costValue
          });
        }
      }

      if (dataToInsert.length === 0) {
        console.log('No invoice data to store');
        return true;
      }

      // Insert data into Supabase
      const { data, error } = await this.supabase
        .from('invoice_data')
        .insert(dataToInsert);

      if (error) {
        console.error('Error storing invoice data:', error);
        return false;
      }

      console.log(`Stored ${dataToInsert.length} invoice items for case ${caseId}`);
      return true;
    } catch (error) {
      console.error('Error in storeInvoiceData:', error);
      return false;
    }
  }

  async getInvoiceData(caseId: string) {
    try {
      const { data, error } = await this.supabase
        .from('invoice_data')
        .select('*')
        .eq('case_id', caseId)
        .order('invoice_number', { ascending: true })
        .order('service_date', { ascending: true });

      if (error) {
        console.error('Error fetching invoice data:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getInvoiceData:', error);
      return [];
    }
  }

  async deleteInvoiceData(caseId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('invoice_data')
        .delete()
        .eq('case_id', caseId);

      if (error) {
        console.error('Error deleting invoice data:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteInvoiceData:', error);
      return false;
    }
  }

  async updateCaseSubStatuses(caseId: string, subStatuses: string[]): Promise<boolean> {
    try {
      // Update the case_details table with sub-statuses
      const { error } = await this.supabase
        .from('case_details')
        .update({ sub_statuses: subStatuses })
        .eq('case_id', caseId);

      if (error) {
        console.error('Error updating case sub-statuses:', error);
        return false;
      }

      console.log(`Updated case ${caseId} with ${subStatuses.length} sub-statuses`);
      return true;
    } catch (error) {
      console.error('Error in updateCaseSubStatuses:', error);
      return false;
    }
  }

  async storeInvoiceDataWithSubStatuses(caseId: string, extractionResult: InvoiceExtractionResult): Promise<boolean> {
    try {
      // Store invoice data
      const invoiceStored = await this.storeInvoiceData(caseId, extractionResult.invoices);
      
      // Store sub-statuses
      const subStatusesStored = await this.updateCaseSubStatuses(caseId, extractionResult.subStatuses);
      
      return invoiceStored && subStatusesStored;
    } catch (error) {
      console.error('Error in storeInvoiceDataWithSubStatuses:', error);
      return false;
    }
  }
}