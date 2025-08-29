# Module 7: Billing QC Page Layout

## Overview
Single-case billing QC interface for comparing client approved fees and AI-extracted fees against actual invoice data. Designed for MVP/POC level implementation with focus on simplicity and efficiency. QC Decision Summary positioned at the top for quick review and action.

## Layout Type
**Non-Sidebar Layout** - Full-width interface optimized for side-by-side comparison of billing data

## Key Features
- QC Decision Summary at top for immediate visibility
- Single case ID input workflow
- Side-by-side comparison panels
- AI-powered fee extraction using OpenRouter
- Lazy loading for case updates
- Natural page scrolling (no scroll areas)
- Quick action buttons in summary section

## Database Tables Used
- `client_approved_fees` - Client-specific approved fee rates
- `invoice_data` - Actual invoice line items from system
- `case_details` - Case and client information
- `case_update_history` - All case updates

## Component Requirements (shadcn/ui)
- **Card**: Main container panels
- **Separator**: Visual section dividers
- **Alert**: Status messages and warnings
- **Badge**: Status indicators
- **Input**: Case ID entry
- **Button**: Action buttons
- **IntersectionObserver**: For lazy loading implementation

## ASCII Page Layout

```ascii
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  Module 7: Billing QC Review                                                               │
│  ═══════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                             │
│  Case ID: [Input: _______] [Load] [Clear]                          Status: Ready          │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  QC DECISION SUMMARY                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │ ✓ Most fees match between approved rates and invoice                                │   │
│  │ ⚠ Processing Fee ($15) from approved fees not found in invoice                      │   │
│  │ ⚠ Special Handling Fee ($50) found by AI but not in approved list                   │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                             │
│  Actions: [Approve] [Flag for Review] [Reject] [Request AI Re-extraction] [Next Case]     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┬──────────────────────────────────────────────────────┐
│  CLIENT APPROVED FEES & AI EXTRACTION│  ACTUAL INVOICE DATA (invoice_data table)          │
│  [Card Component]                    │  [Card Component]                                   │
│  ═══════════════════════════════════ │  ═══════════════════════════════════════════════   │
│                                       │                                                      │
│  CLIENT INFORMATION                  │  INVOICE SUMMARY                                    │
│  ─────────────────                   │  ─────────────────────────────────                  │
│  Client:         Professional Towing │  Invoice #:         INV-2025-0123                   │
│  Lien Holder:    Chase Bank          │  Total Line Items:  6 items                         │
│  Order Status:   Active              │  Date Range:        01/25/2025 - 01/28/2025        │
│                                       │                                                      │
│  [Separator]                          │  [Separator]                                         │
│                                       │                                                      │
│  CLIENT APPROVED FEES                │  INVOICE LINE ITEMS                                 │
│  (from client_approved_fees table)   │  ─────────────────────────────────                  │
│  ─────────────────────────────────   │  Service Date: 01/25/2025                           │
│  Category: Towing                    │  • Standard Towing              $350.00 ✓           │
│  • Standard Tow:        $350.00      │  • Mileage Fee                  $45.00  ✓           │
│  • Mileage per mile:    $3.00        │                                                      │
│                                       │  Service Date: 01/26/2025                           │
│  Category: Storage                   │  • Storage Day 1                $25.00  ✓           │
│  • Daily Storage:       $25.00       │                                                      │
│                                       │  Service Date: 01/27/2025                           │
│  Category: Administrative            │  • Storage Day 2                $25.00  ✓           │
│  • Admin Fee:           $25.00       │                                                      │
│  • Processing Fee:      $15.00       │  Service Date: 01/28/2025                           │
│                                       │  • Storage Day 3                $25.00  ✓           │
│  [Separator]                          │  • Administrative Fee           $25.00  ✓           │
│                                       │  ─────────────────────────────────                  │
│  AI-EXTRACTED FEES FROM TEXT         │  Invoice Total:                 $495.00             │
│  ─────────────────────────────────   │                                                      │
│  Source: Additional Info & Updates   │  [Alert Component - Success]                        │
│  • Towing Service:      $350.00  ✓   │  ✓ Invoice matches approved fees (96% match)        │
│  • Mileage (15mi):      $45.00   ✓   │                                                      │
│  • Storage (3 days):    $75.00   ✓   │  [Separator]                                         │
│  • Special Handling:    $50.00   ⚠   │                                                      │
│                                       │  VARIANCE ANALYSIS                                  │
│  AI Total:              $520.00      │  ─────────────────────────────────                  │
│  Confidence:            92%          │  Client Approved vs Invoice:                        │
│                                       │  • Missing: Processing Fee $15.00                   │
│  [Alert Component]                   │                                                      │
│  ⚠ Special handling not in approved  │  AI Extracted vs Invoice:                           │
│                                       │  • Extra: Special Handling $50.00                   │
│                                       │  • Difference: +$25.00                              │
│                                       │                                                      │
│                                       │  [Badge: Review] [Badge: Missing Fees]              │
└──────────────────────────────────────┴──────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  ALL CASE UPDATES                                                                          │
│  ─────────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                             │
│  Update #1 - 27 Jan 2025 14:32 - By: Agent Smith                                          │
│  "Vehicle released to owner after payment of $537.08 received. Storage fees applied."      │
│                                                                                             │
│  Update #2 - 26 Jan 2025 09:15 - By: System Auto                                          │
│  "Storage fees automatically calculated. Current: 2 days @ $25 per day = $50.00"           │
│                                                                                             │
│  Update #3 - 25 Jan 2025 16:45 - By: Agent Johnson                                        │
│  "Vehicle towed from 123 Main St per police authorization #PD-4567. No damage noted."      │
│                                                                                             │
│  Update #4 - 25 Jan 2025 16:30 - By: Dispatch                                             │
│  "Unit 42 dispatched to location. ETA 15 minutes. Special equipment requested."            │
│                                                                                             │
│  Update #5 - 25 Jan 2025 16:15 - By: Agent Williams                                       │
│  "Call received for tow service. Vehicle blocking driveway. Police on scene."              │
│                                                                                             │
│  Update #6 - 25 Jan 2025 14:00 - By: System Auto                                          │
│  "Case created. Assignment pending."                                                       │
│                                                                                             │
│  Update #7 - 25 Jan 2025 13:45 - By: Client Portal                                        │
│  "New service request submitted by Chase Bank for vehicle recovery."                       │
│                                                                                             │
│  Update #8 - 25 Jan 2025 13:30 - By: Agent Thompson                                       │
│  "Initial contact from lienholder regarding repossession order."                           │
│                                                                                             │
│  Update #9 - 24 Jan 2025 17:00 - By: System Auto                                          │
│  "Pre-authorization received from client. Case pending activation."                        │
│                                                                                             │
│  Update #10 - 24 Jan 2025 16:30 - By: Agent Davis                                         │
│  "Vehicle located. VIN verified. Awaiting dispatch confirmation."                          │
│                                                                                             │
│  [Load More Updates...] (Lazy loading - loads as user scrolls)                             │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Panel Descriptions

### Left Panel: Client Approved Fees & AI Extraction
Displays three key data sections:

1. **Client Information**
   - Client name from `case_details.client`
   - Lien holder from `case_details.lien_holder`
   - Order status from `case_details.status`

2. **Client Approved Fees**
   - Data from `client_approved_fees` table
   - Grouped by `fee_category` (Towing, Storage, Administrative)
   - Shows `fee_type` and `fee_amount`
   - No total calculation needed

3. **AI-Extracted Fees**
   - Fees extracted using OpenRouter service
   - Source: `my_summary_additional_info` and case updates
   - Shows confidence score
   - Visual indicators (✓/⚠) for matches/mismatches

### Right Panel: Actual Invoice Data
Displays invoice information from database:

1. **Invoice Summary**
   - Invoice number from `invoice_data.invoice_number`
   - Total line item count
   - Date range from service dates

2. **Invoice Line Items**
   - Grouped by `service_date`
   - Shows `service_name` and `cost`
   - Check marks (✓) indicate matches with approved fees
   - Invoice total calculation at bottom

3. **Variance Analysis**
   - Comparison between approved fees and invoice
   - Comparison between AI-extracted and invoice
   - Clear indication of missing or extra fees

## Case Updates Section
- Displays all updates from `case_update_history` table
- Format: Update number, date, time, author, full content
- **Lazy Loading Implementation**:
  - Initial load: 10 updates
  - Loads additional 10 updates as user scrolls
  - No ScrollArea component - uses natural page scroll
  - IntersectionObserver triggers loading

## QC Decision Flow

1. **Load Case**: User enters case ID and clicks Load
2. **Data Retrieval**:
   - Fetch client approved fees based on client name
   - Load invoice data for the case
   - Extract fees using AI (OpenRouter)
   - Load all case updates
3. **Review**: QC Decision Summary appears at top showing discrepancies
4. **Comparison**: Review side-by-side data panels for details
5. **Decision**: Click Approve, Flag, or Reject in the summary section
6. **Next Case**: Click "Next Case" to clear and load next case

## Implementation Notes

### MVP Simplifications
- Single case processing (no bulk operations)
- No export functionality needed
- No mobile responsiveness required
- Simple approve/reject workflow
- No complex filtering or sorting

### Data Fields Mapping

**From `client_approved_fees`:**
- `client_name` - Match with case client
- `fee_category` - Group fees by category
- `fee_type` - Individual fee descriptions
- `fee_amount` - Approved amounts

**From `invoice_data`:**
- `case_id` - Link to current case
- `invoice_number` - Display reference
- `service_date` - Group line items
- `service_name` - Service descriptions
- `cost` - Actual amounts charged

**From `case_details`:**
- `case_id` - Current case reference
- `client` - Client name
- `lien_holder` - Lienholder info
- `status` - Case status
- `my_summary_additional_info` - Text for AI extraction

**From `case_update_history`:**
- `update_date` - Timestamp
- `update_author` - Who made update
- `update_content` - Full update text

### AI Integration
- Uses OpenRouter service for fee extraction
- Extracts from `my_summary_additional_info` field
- Extracts from update content text
- Returns structured fee data with confidence score

### Performance Considerations
- Lazy loading prevents loading all updates at once
- Natural browser scrolling for better UX
- Load updates in batches of 10
- No nested scroll areas for cleaner interface