/**
 * Billing QC Service - UI state management service
 * MVP implementation for data fetching (UI mockup only)
 */

import { 
  CaseDetails, 
  ClientApprovedFee, 
  InvoiceData, 
  CaseUpdateHistory,
  AIExtractedFee,
  AIExtractionResult,
  VarianceAnalysis,
  QCDecision,
  GroupedInvoiceData,
  GroupedApprovedFees
} from '../types';

/**
 * Service class for billing QC data operations
 */
export class BillingQCService {
  /**
   * Fetch case details by case ID
   */
  static async fetchCaseDetails(caseId: string): Promise<CaseDetails | null> {
    // UI mockup - returns sample data structure
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!caseId) return null;
    
    return {
      id: 'uuid-1',
      case_id: caseId,
      order_date: '2025-01-25',
      ref_number: 'REF-2025-001',
      order_type: 'Towing',
      status: 'Active',
      client: 'Professional Towing',
      collector: 'Collection Agency',
      lien_holder: 'Chase Bank',
      client_account_number: 'ACC-12345',
      my_summary_additional_info: 'Towing service completed with special handling required.',
      created_at: '2025-01-25T10:00:00Z'
    };
  }

  /**
   * Fetch client approved fees
   */
  static async fetchClientApprovedFees(clientName: string): Promise<ClientApprovedFee[]> {
    // UI mockup - returns sample data structure
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!clientName) return [];
    
    return [
      {
        id: 1,
        client_name: clientName,
        fee_category: 'Towing',
        fee_type: 'Standard Tow',
        fee_amount: 350.00,
        has_condition: false
      },
      {
        id: 2,
        client_name: clientName,
        fee_category: 'Towing',
        fee_type: 'Mileage per mile',
        fee_amount: 3.00,
        has_condition: false
      },
      {
        id: 3,
        client_name: clientName,
        fee_category: 'Storage',
        fee_type: 'Daily Storage',
        fee_amount: 25.00,
        has_condition: false
      },
      {
        id: 4,
        client_name: clientName,
        fee_category: 'Administrative',
        fee_type: 'Admin Fee',
        fee_amount: 25.00,
        has_condition: false
      },
      {
        id: 5,
        client_name: clientName,
        fee_category: 'Administrative',
        fee_type: 'Processing Fee',
        fee_amount: 15.00,
        has_condition: false
      }
    ];
  }

  /**
   * Fetch invoice data for a case
   */
  static async fetchInvoiceData(caseId: string): Promise<InvoiceData[]> {
    // UI mockup - returns sample data structure
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (!caseId) return [];
    
    return [
      {
        id: 1,
        case_id: caseId,
        invoice_number: 'INV-2025-0123',
        service_date: '2025-01-25',
        service_name: 'Standard Towing',
        cost: 350.00
      },
      {
        id: 2,
        case_id: caseId,
        invoice_number: 'INV-2025-0123',
        service_date: '2025-01-25',
        service_name: 'Mileage Fee',
        cost: 45.00
      },
      {
        id: 3,
        case_id: caseId,
        invoice_number: 'INV-2025-0123',
        service_date: '2025-01-26',
        service_name: 'Storage Day 1',
        cost: 25.00
      },
      {
        id: 4,
        case_id: caseId,
        invoice_number: 'INV-2025-0123',
        service_date: '2025-01-27',
        service_name: 'Storage Day 2',
        cost: 25.00
      },
      {
        id: 5,
        case_id: caseId,
        invoice_number: 'INV-2025-0123',
        service_date: '2025-01-28',
        service_name: 'Storage Day 3',
        cost: 25.00
      },
      {
        id: 6,
        case_id: caseId,
        invoice_number: 'INV-2025-0123',
        service_date: '2025-01-28',
        service_name: 'Administrative Fee',
        cost: 25.00
      }
    ];
  }

  /**
   * Fetch case updates with pagination
   */
  static async fetchCaseUpdates(
    caseId: string, 
    page: number = 1, 
    pageSize: number = 10
  ): Promise<{ updates: CaseUpdateHistory[], hasMore: boolean, total: number }> {
    // UI mockup - returns sample data structure
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!caseId) return { updates: [], hasMore: false, total: 0 };
    
    const totalUpdates = 25;
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    
    const updates: CaseUpdateHistory[] = [];
    
    for (let i = startIdx; i < Math.min(endIdx, totalUpdates); i++) {
      updates.push({
        id: `update-${i + 1}`,
        case_id: caseId,
        update_date: `2025-01-${28 - i}T14:32:00Z`,
        update_type: 'Status Update',
        update_author: `Agent ${['Smith', 'Johnson', 'Williams', 'Davis', 'Thompson'][i % 5]}`,
        update_content: [
          'Vehicle released to owner after payment received.',
          'Storage fees automatically calculated.',
          'Vehicle towed from location per police authorization.',
          'Unit dispatched to location. Special equipment requested.',
          'Call received for tow service. Vehicle blocking driveway.'
        ][i % 5],
        is_visible: true
      });
    }
    
    return {
      updates,
      hasMore: endIdx < totalUpdates,
      total: totalUpdates
    };
  }

  /**
   * Extract fees using AI (placeholder)
   */
  static async extractFeesWithAI(text: string): Promise<AIExtractionResult> {
    // UI mockup - returns sample AI extraction
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      fees: [
        {
          fee_type: 'Towing Service',
          amount: 350.00,
          confidence: 0.95,
          matched: true,
          source: 'additional_info'
        },
        {
          fee_type: 'Mileage (15mi)',
          amount: 45.00,
          confidence: 0.92,
          matched: true,
          source: 'additional_info'
        },
        {
          fee_type: 'Storage (3 days)',
          amount: 75.00,
          confidence: 0.88,
          matched: true,
          source: 'updates'
        },
        {
          fee_type: 'Special Handling',
          amount: 50.00,
          confidence: 0.75,
          matched: false,
          source: 'additional_info'
        }
      ],
      total_amount: 520.00,
      confidence_score: 0.92,
      extraction_date: new Date().toISOString()
    };
  }

  /**
   * Analyze variance between different fee sources
   */
  static async analyzeVariance(
    approvedFees: ClientApprovedFee[],
    invoiceData: InvoiceData[],
    aiExtractedFees: AIExtractedFee[]
  ): Promise<VarianceAnalysis> {
    // UI mockup - returns sample variance analysis
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      comparison_type: 'approved_vs_invoice',
      missing_fees: [
        {
          fee_type: 'Processing Fee',
          amount: 15.00,
          source: 'approved'
        }
      ],
      extra_fees: [
        {
          fee_type: 'Special Handling',
          amount: 50.00,
          source: 'ai'
        }
      ],
      matching_fees: [
        {
          fee_type: 'Standard Towing',
          amount: 350.00,
          sources: ['approved', 'invoice', 'ai']
        },
        {
          fee_type: 'Storage Fees',
          amount: 75.00,
          sources: ['approved', 'invoice', 'ai']
        }
      ],
      total_difference: 25.00,
      match_percentage: 96
    };
  }

  /**
   * Generate QC decisions based on analysis
   */
  static async generateQCDecisions(variance: VarianceAnalysis): Promise<QCDecision[]> {
    // UI mockup - returns sample QC decisions
    const decisions: QCDecision[] = [];
    
    if (variance.match_percentage > 90) {
      decisions.push({
        decision_type: 'match',
        message: 'Most fees match between approved rates and invoice',
        severity: 'info'
      });
    }
    
    variance.missing_fees.forEach(fee => {
      decisions.push({
        decision_type: 'warning',
        message: `${fee.fee_type} ($${fee.amount}) from approved fees not found in invoice`,
        severity: 'warning',
        fee_type: fee.fee_type,
        amount: fee.amount
      });
    });
    
    variance.extra_fees.forEach(fee => {
      decisions.push({
        decision_type: 'warning',
        message: `${fee.fee_type} ($${fee.amount}) found by AI but not in approved list`,
        severity: 'warning',
        fee_type: fee.fee_type,
        amount: fee.amount
      });
    });
    
    return decisions;
  }

  /**
   * Group invoice data by service date
   */
  static groupInvoiceByDate(invoiceData: InvoiceData[]): GroupedInvoiceData[] {
    const grouped = new Map<string, InvoiceData[]>();
    
    invoiceData.forEach(item => {
      const date = item.service_date || 'Unknown';
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)?.push(item);
    });
    
    return Array.from(grouped.entries()).map(([date, items]) => ({
      service_date: date,
      items,
      total: items.reduce((sum, item) => sum + (item.cost || 0), 0)
    }));
  }

  /**
   * Group approved fees by category
   */
  static groupFeesByCategory(fees: ClientApprovedFee[]): GroupedApprovedFees[] {
    const grouped = new Map<string, ClientApprovedFee[]>();
    
    fees.forEach(fee => {
      if (!grouped.has(fee.fee_category)) {
        grouped.set(fee.fee_category, []);
      }
      grouped.get(fee.fee_category)?.push(fee);
    });
    
    return Array.from(grouped.entries()).map(([category, fees]) => ({
      category,
      fees,
      total: fees.reduce((sum, fee) => sum + fee.fee_amount, 0)
    }));
  }
}