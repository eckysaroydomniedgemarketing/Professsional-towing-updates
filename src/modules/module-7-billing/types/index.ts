export interface BillingWorkflowState {
  caseId: string;
  status: 'idle' | 'login' | 'navigate' | 'extract' | 'store' | 'complete' | 'error';
  progress: {
    login: boolean;
    navigation: boolean;
    extraction: boolean;
    storage: boolean;
  };
  error?: string;
}

export interface ClientFeeRate {
  id: number;
  client_name: string;
  fee_category: string;
  fee_type: string;
  fee_amount: number;
  has_condition: boolean;
  condition_details?: string;
}

export interface InvoiceData {
  case_id: string;
  invoice_number: string;
  service_date: string;
  service_name: string;
  cost: string;
}

export interface BillingData {
  caseId: string;
  clientName: string;
  lienHolder?: string;
  status?: string;
  clientFeeRates: ClientFeeRate[];
  invoiceData: InvoiceData[];
  summary: {
    subtotal: number;
    tax: number;
    total: number;
  };
}