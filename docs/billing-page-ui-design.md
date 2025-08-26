# Billing Page UI Design

## Overview
This document outlines the UI design for the billing management page using ASCII art representation. The page consists of a header, left navigation section, and a main frame with three horizontally arranged sections.

## UI Layout Structure

### Complete Page Layout

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     Professional Towing Updates                                 │
│                                         Billing Management                                      │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  ┌──────────────────────┐  ┌─────────────────────────────────────────────────────────────────┐ │
│  │   LEFT SECTION       │  │                         MAIN FRAME                              │ │
│  │                      │  │                                                                  │ │
│  │  ┌────────────────┐  │  │ ┌───────────────────┬────────────────────┬───────────────────┐ │ │
│  │  │                │  │  │ │ Client Fee Rates  │ Case Update Fees   │  Fee Summary      │ │ │
│  │  │ Start Workflow │  │  │ ├───────────────────┼────────────────────┼───────────────────┤ │ │
│  │  │                │  │  │ │                   │                    │                   │ │ │
│  │  └────────────────┘  │  │ │ Client: LOANMAX   │ Invoice #46368     │ ┌───────────────┐ │ │ │
│  │                      │  │ │ SOUTH HILL        │                    │ │Item      Amount│ │ │
│  │  ┌────────────────┐  │  │ │                   │ ┌────────────────┐ │ ├───────────────┤ │ │
│  │  │  Manual Case   │  │  │ │┌─────────┬───────┐│ │Date  │Serv│Cost│ │ │Service $225.00│ │ │
│  │  │     Input      │  │  │ ││Type     │Rate   ││ ├──────┼────┼────┤ │ │Storage   $0.00│ │ │
│  │  │ ┌────────────┐ │  │  │ │├─────────┼───────┤│ │01/28 │Vol │$225│ │ │Dolly     $0.00│ │ │
│  │  │ │2036410535  │ │  │  │ ││Voluntary│$225   ││ └────────────────┘ │ │Key       $0.00│ │ │
│  │  │ └────────────┘ │  │  │ ││Invol    │$350   ││                    │ ├───────────────┤ │ │
│  │  └────────────────┘  │  │ ││Storage  │$25/day││ Total: $225.00     │ │Subtotal$225.00│ │ │
│  │                      │  │ ││Dolly    │$75    ││                    │ │Tax       $0.00│ │ │
│  │  ┌────────────────┐  │  │ ││Key      │$125   ││ Additional Fees:   │ ├───────────────┤ │ │
│  │  │    Status:     │  │  │ │└─────────┴───────┘│ (None found)       │ │TOTAL   $225.00│ │ │
│  │  │                │  │  │ │                   │                    │ └───────────────┘ │ │
│  │  │  ✓ Completed   │  │  │ │ Free Days: 0      │                    │                   │ │
│  │  │                │  │  │ │ Storage Cap: $500 │                    │ [Generate Invoice]│ │
│  │  └────────────────┘  │  │ │                   │                    │                   │ │
│  │                      │  │ └───────────────────┴────────────────────┴───────────────────┘ │ │
│  └──────────────────────┘  └─────────────────────────────────────────────────────────────────┘ │
│                                                                                                  │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Header Section
- **Title**: "Professional Towing Updates"
- **Subtitle**: "Billing Management"
- Maintains consistency with existing application header

### 2. Left Navigation Section
Contains three main components:

#### Start Workflow Button
```
┌────────────────┐
│                │
│ Start Workflow │
│                │
└────────────────┘
```
- Triggers the billing workflow process
- Green background when active

#### Manual Case Input
```
┌────────────────┐
│  Manual Case   │
│     Input      │
│ ┌────────────┐ │
│ │2036410535  │ │
│ └────────────┘ │
└────────────────┘
```
- Allows manual entry of case ID
- Auto-loads case data when entered

#### Status Display
```
┌────────────────┐
│    Status:     │
│                │
│  ✓ Completed   │
│                │
└────────────────┘
```
- Shows current workflow status
- Visual indicators: ✓ (completed), ⏳ (processing), ✗ (error)

### 3. Main Frame - Three Horizontal Sections

#### Section 1: Client Fee Rates (Left)
```
┌───────────────────┐
│ Client Fee Rates  │
├───────────────────┤
│                   │
│ Client: LOANMAX   │
│ SOUTH HILL        │
│                   │
│┌─────────┬───────┐│
││Type     │Rate   ││
│├─────────┼───────┤│
││Voluntary│$225   ││
││Invol    │$350   ││
││Storage  │$25/day││
││Dolly    │$75    ││
││Key      │$125   ││
│└─────────┴───────┘│
│                   │
│ Free Days: 0      │
│ Storage Cap: $500 │
└───────────────────┘
```

**Contains:**
- Client name and details
- Fee structure table
- Rate configuration
- Business rules (free days, caps)

#### Section 2: Case Update Fees (Middle)
```
┌────────────────────┐
│ Case Update Fees   │
├────────────────────┤
│                    │
│ Invoice #46368     │
│                    │
│ ┌────────────────┐ │
│ │Date  │Serv│Cost│ │
│ ├──────┼────┼────┤ │
│ │01/28 │Vol │$225│ │
│ └────────────────┘ │
│                    │
│ Total: $225.00     │
│                    │
│ Additional Fees:   │
│ (None found)       │
└────────────────────┘
```

**Contains:**
- Invoice number reference
- Extracted fee details table
- Date, Service type, Cost columns
- Running total
- Additional fees section

#### Section 3: Fee Summary (Right)
```
┌───────────────────┐
│  Fee Summary      │
├───────────────────┤
│                   │
│ ┌───────────────┐ │
│ │Item      Amount│ │
│ ├───────────────┤ │
│ │Service $225.00│ │
│ │Storage   $0.00│ │
│ │Dolly     $0.00│ │
│ │Key       $0.00│ │
│ ├───────────────┤ │
│ │Subtotal$225.00│ │
│ │Tax       $0.00│ │
│ ├───────────────┤ │
│ │TOTAL   $225.00│ │
│ └───────────────┘ │
│                   │
│ [Generate Invoice]│
└───────────────────┘
```

**Contains:**
- Itemized fee breakdown
- Calculated totals
- Tax information
- Grand total
- Generate Invoice action button

## Data Flow

1. **Case Input** → Loads case data from database
2. **Client Details** → Fetches client-specific fee rates
3. **Update Fees** → Extracts fees from case updates/invoices
4. **Summary** → Calculates and displays final totals
5. **Generate** → Creates final invoice

## Visual Design Notes

### Color Scheme (for implementation)
- **Headers**: Blue background (#1e40af)
- **Buttons**: Green (#10b981) for primary actions
- **Status**: Green for success, Yellow for pending, Red for errors
- **Money Values**: Green for positive, Red for charges
- **Borders**: Gray (#6b7280)
- **Background**: White with light gray sections

### Typography
- **Headers**: Bold, larger font
- **Data Labels**: Regular weight
- **Money Values**: Monospace font for alignment
- **Status Text**: Bold with color coding

### Responsive Considerations
- Left section collapses to icons on mobile
- Main sections stack vertically on smaller screens
- Tables become scrollable on mobile devices

## Sample Data Used

### Invoice Data (from invoice_data table)
```json
{
  "case_id": "2036410535",
  "invoice_number": "46368",
  "service_date": "2015-01-28",
  "service_name": "Voluntary",
  "cost": 225.00
}
```

### Client Fee Structure
```json
{
  "client": "LOANMAX SOUTH HILL",
  "rates": {
    "voluntary": 225,
    "involuntary": 350,
    "storage_daily": 25,
    "dolly": 75,
    "key": 125
  },
  "free_days": 0,
  "storage_cap": 500
}
```

## Implementation Notes

1. **Data Source**: Uses `invoice_data` table from Supabase
2. **Real-time Updates**: Refreshes when case ID changes
3. **Validation**: Ensures all fees are captured before invoice generation
4. **Error Handling**: Displays clear messages for missing data
5. **Audit Trail**: Logs all fee calculations for review

## Future Enhancements

- [ ] Add fee override capabilities with approval workflow
- [ ] Include historical fee comparisons
- [ ] Export functionality (PDF, Excel)
- [ ] Bulk processing for multiple cases
- [ ] Integration with payment processing
- [ ] Automated fee dispute resolution

---

*Document Version: 1.0*  
*Last Updated: 2025-08-25*  
*Status: Design Phase*