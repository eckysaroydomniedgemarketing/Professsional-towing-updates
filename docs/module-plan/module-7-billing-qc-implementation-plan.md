# Module 7: Billing QC Page - Implementation Plan

## Overview
This document outlines the comprehensive implementation task list for creating the Module 7 Billing QC Page UI. The implementation focuses on UI creation only, using actual database data without any business logic, tests, or documentation.

## Key Constraints
- **UI Only**: No business logic, database queries handled through hooks
- **Real Data**: Use actual data from Supabase tables
- **Component Library**: Use only shadcn/ui components (no custom components)
- **File Size**: Maximum 500 lines per file
- **MVP Level**: Focus on core functionality without over-engineering

## Database Tables Used
- `client_approved_fees` - Client-specific approved fee rates
- `invoice_data` - Actual invoice line items from system
- `case_details` - Case and client information
- `case_update_history` - All case updates

## Implementation Phases

### Phase 1: Project Setup and Structure
1. **Create page directory structure**
   - Create `/src/app/billing-qc/` directory for the new page
   - Create `/src/app/billing-qc/page.tsx` as main entry point
   - Create `/src/app/billing-qc/layout.tsx` for page layout

2. **Create module directory structure**
   - Create `/src/modules/module-7-billing-qc/` directory
   - Create subdirectories: `components/`, `hooks/`, `services/`, `types/`, `utils/`

3. **Install required shadcn/ui components** (if not already installed)
   - Verify Alert, Badge, Button, Card, Input, Separator components are installed
   - Install any missing components using `npx shadcn-ui@latest add [component]`

### Phase 2: Type Definitions and Data Models
4. **Create type definitions** (`/src/modules/module-7-billing-qc/types/index.ts`)
   - Define `ClientApprovedFee` interface matching `client_approved_fees` table
   - Define `InvoiceData` interface matching `invoice_data` table
   - Define `CaseDetails` interface matching `case_details` table
   - Define `CaseUpdateHistory` interface matching `case_update_history` table
   - Define `AIExtractedFee` interface for AI-extracted fees
   - Define `QCDecision` interface for decision summary data
   - Define `VarianceAnalysis` interface for fee comparisons

### Phase 3: Data Services and Hooks
5. **Create data fetching services** (`/src/modules/module-7-billing-qc/services/`)
   - `billing-qc-service.ts` - Main service for fetching billing data
   - Methods: `fetchCaseDetails()`, `fetchClientApprovedFees()`, `fetchInvoiceData()`, `fetchCaseUpdates()`

6. **Create custom hooks** (`/src/modules/module-7-billing-qc/hooks/`)
   - `use-case-loader.ts` - Hook for loading case by ID
   - `use-client-fees.ts` - Hook for fetching client approved fees
   - `use-invoice-data.ts` - Hook for fetching invoice data
   - `use-case-updates.ts` - Hook with lazy loading for case updates
   - `use-ai-extraction.ts` - Hook for AI fee extraction (placeholder for OpenRouter integration)
   - `use-qc-analysis.ts` - Hook for comparing fees and generating QC decisions

### Phase 4: Component Development

7. **Create Header component** (`/src/modules/module-7-billing-qc/components/header.tsx`)
   - Module title "Module 7: Billing QC Review"
   - Case ID input field with Load and Clear buttons
   - Status indicator showing ready/loading/error states

8. **Create QC Decision Summary component** (`/src/modules/module-7-billing-qc/components/qc-decision-summary.tsx`)
   - Alert container with decision results
   - Display match/mismatch indicators with icons (✓/⚠)
   - Action buttons: Approve, Flag for Review, Reject, Request AI Re-extraction, Next Case
   - Use Alert and Button components from shadcn/ui

9. **Create Client Approved Fees panel** (`/src/modules/module-7-billing-qc/components/client-approved-fees-panel.tsx`)
   - Card component container
   - Client Information section (client name, lien holder, order status)
   - Client Approved Fees section grouped by fee_category
   - AI-Extracted Fees section with confidence score
   - Use Card, Separator, Alert, and Badge components

10. **Create Invoice Data panel** (`/src/modules/module-7-billing-qc/components/invoice-data-panel.tsx`)
    - Card component container
    - Invoice Summary section (invoice number, total items, date range)
    - Invoice Line Items grouped by service_date
    - Variance Analysis section comparing fees
    - Match indicators (✓) for matching fees
    - Use Card, Separator, Alert, and Badge components

11. **Create Case Updates section** (`/src/modules/module-7-billing-qc/components/case-updates-section.tsx`)
    - Display updates from `case_update_history` table
    - Implement lazy loading with IntersectionObserver
    - Initial load of 10 updates
    - Load more button/trigger for additional updates
    - Format: Update #, date, time, author, content
    - Natural page scrolling (no ScrollArea)

12. **Create Fee Comparison utility component** (`/src/modules/module-7-billing-qc/components/fee-comparison.tsx`)
    - Visual comparison indicators
    - Match/mismatch highlighting
    - Percentage match calculation
    - Missing/extra fee indicators

### Phase 5: Integration and Assembly

13. **Create main Billing QC component** (`/src/modules/module-7-billing-qc/index.tsx`)
    - Integrate all sub-components
    - Manage component state
    - Handle data flow between components
    - Implement loading and error states

14. **Create page component** (`/src/app/billing-qc/page.tsx`)
    - Import and render main Billing QC component
    - Set up page metadata
    - Apply non-sidebar layout (full-width)

15. **Implement data flow**
    - Connect to Supabase using existing configuration
    - Fetch data from tables: `client_approved_fees`, `invoice_data`, `case_details`, `case_update_history`
    - Pass real data to components (no dummy data)

### Phase 6: UI Polish and Refinement

16. **Apply theme styling**
    - Use existing theme colors from `components.json`
    - Apply Tailwind classes following theme guide
    - Ensure consistent spacing and alignment
    - Match the ASCII layout design

17. **Add loading states**
    - Skeleton loaders for data sections
    - Loading indicators for case loading
    - Progress indicators for AI extraction

18. **Add empty states**
    - Handle cases with no invoice data
    - Handle cases with no approved fees
    - Handle cases with no updates

### Phase 7: Functionality Implementation (UI Only)

19. **Implement case loading workflow**
    - Case ID input validation
    - Load button click handler
    - Clear button to reset state
    - Display loaded case data

20. **Implement lazy loading for updates**
    - Set up IntersectionObserver
    - Load updates in batches of 10
    - Show loading indicator while fetching
    - Append new updates to existing list

21. **Implement action buttons (UI handlers only)**
    - Click handlers for Approve/Reject/Flag buttons
    - Visual feedback on button clicks
    - Disable buttons during processing
    - Next Case button to clear and prepare for new case

## Component Structure

```
/src/app/billing-qc/
├── page.tsx                    # Main page entry
└── layout.tsx                   # Page layout

/src/modules/module-7-billing-qc/
├── index.tsx                    # Main module component
├── components/
│   ├── header.tsx              # Page header with case input
│   ├── qc-decision-summary.tsx # QC decision and actions
│   ├── client-approved-fees-panel.tsx # Left panel
│   ├── invoice-data-panel.tsx  # Right panel
│   ├── case-updates-section.tsx # Updates with lazy loading
│   └── fee-comparison.tsx      # Comparison utilities
├── hooks/
│   ├── use-case-loader.ts      # Load case by ID
│   ├── use-client-fees.ts      # Fetch approved fees
│   ├── use-invoice-data.ts     # Fetch invoice data
│   ├── use-case-updates.ts     # Fetch updates with lazy load
│   ├── use-ai-extraction.ts    # AI fee extraction
│   └── use-qc-analysis.ts      # Fee comparison logic
├── services/
│   └── billing-qc-service.ts   # Data fetching service
├── types/
│   └── index.ts                # Type definitions
└── utils/
    └── index.ts                # Utility functions
```

## Data Flow

1. User enters Case ID and clicks Load
2. System fetches:
   - Case details from `case_details` table
   - Client approved fees from `client_approved_fees` table
   - Invoice data from `invoice_data` table
   - Case updates from `case_update_history` table
3. AI extracts fees from `my_summary_additional_info` field (OpenRouter)
4. System compares fees and generates QC decision
5. UI displays all data in side-by-side panels
6. User reviews and takes action (Approve/Reject/Flag)

## UI Layout Reference

```
┌─────────────────────────────────────────────────┐
│  Module 7: Billing QC Review                   │
│  Case ID: [______] [Load] [Clear]  Status: ... │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  QC DECISION SUMMARY                           │
│  ✓ Most fees match...                          │
│  ⚠ Processing Fee ($15) not found...           │
│  [Approve] [Flag] [Reject] [Re-extract] [Next] │
└─────────────────────────────────────────────────┘

┌────────────────────┬────────────────────────────┐
│ CLIENT APPROVED    │ ACTUAL INVOICE DATA        │
│ FEES & AI          │                            │
│                    │                            │
│ Client Info        │ Invoice Summary            │
│ Approved Fees      │ Line Items                 │
│ AI Extracted       │ Variance Analysis          │
└────────────────────┴────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ALL CASE UPDATES                              │
│  Update #1 - Date - Author                     │
│  "Update content..."                           │
│  [Load More...]                                │
└─────────────────────────────────────────────────┘
```

## Success Criteria

- [ ] All components render without errors
- [ ] Real data loads from Supabase tables
- [ ] Case ID input and loading works
- [ ] Side-by-side panels display correctly
- [ ] QC Decision Summary shows at top
- [ ] Lazy loading works for case updates
- [ ] All shadcn/ui components used properly
- [ ] Theme consistency maintained
- [ ] File sizes under 500 lines
- [ ] No custom components created
- [ ] No business logic in UI components
- [ ] No dummy data used

## Notes

- Focus on MVP implementation
- Keep components simple and focused
- Use existing patterns from other modules
- Ensure responsive layout for desktop only
- No mobile optimization required
- No export functionality needed
- Single case processing only