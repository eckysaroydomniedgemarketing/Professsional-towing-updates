# Module 6: Pending Close Implementation Plan

## Overview
Module 6 handles the "Pending Close" workflow for cases that need status change from "Pending Close" to "Close". This module automates the process of identifying and closing cases that are ready for closure in the RDN portal.

## Module Specifications
- **Module Name**: `module-6-pending-close`
- **Page Route**: `/pending-close`
- **RDN URL**: `https://app.recoverydatabase.net/v2/main/view_cases.php?status=Pending+Close`
- **Purpose**: Process cases with "Pending Close" status
- **Action**: Change status from "Pending Close" to "Close"

## Module Structure
```
src/modules/module-6-pending-close/
├── components/
│   ├── pending-close-dashboard.tsx    # Main dashboard interface
│   ├── workflow-control.tsx           # Mode toggle and action buttons
│   ├── case-display.tsx              # Current case details display
│   └── report-table.tsx              # Processed cases report
├── services/
│   ├── pending-close-workflow.service.ts  # Main workflow orchestrator
│   ├── case-closure.service.ts           # Case closure logic
│   ├── navigation.service.ts             # RDN portal navigation
│   └── supabase-log.service.ts           # Database logging
├── hooks/
│   ├── use-pending-close.ts              # Main hook for pending close logic
│   └── use-workflow-state.ts             # Workflow state management
├── types/
│   └── index.ts                          # TypeScript type definitions
└── utils/
    ├── csv-export.ts                     # CSV export functionality
    └── error-handler.ts                  # Error handling utilities
```

## Database Schema

### Table: `pending_close_log`
```sql
CREATE TABLE pending_close_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL,
  vin_number TEXT,
  previous_status TEXT DEFAULT 'Pending Close',
  new_status TEXT DEFAULT 'Close',
  action_taken TEXT DEFAULT 'status_changed',
  processing_mode TEXT CHECK (processing_mode IN ('manual', 'automatic')),
  processed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pending_close_log_case_id ON pending_close_log(case_id);
CREATE INDEX idx_pending_close_log_created_at ON pending_close_log(created_at);
```

## Workflow Process

### 1. Authentication
- Use Module 1 for RDN portal login
- Verify active session before processing

### 2. Navigation
- Navigate to: `/v2/main/view_cases.php?status=Pending+Close`
- Wait for page load completion
- Extract total case count
- Check for warning: "WARNING: YOU NEED TO ACKNOWLEDGE THE CLOSES"

### 3. Case Processing Loop
For each case in the listing:

#### 3.1 Open Case
- Click on Case ID link
- Navigate to: `/alpha_rdn/module/default/case2/?case_id=XXXXXXXX`
- Wait for case details to load

#### 3.2 Extract Information
- Case ID from URL or page
- VIN number from vehicle section
- Current status (should be "Pending Close")
- Note: Red text "Action Required: Acknowledge Pending Close"

#### 3.3 Change Status
- Locate status dropdown: `id="status_static"`
- Current selection: "Pending Close"
- Select new status: "Close"
- Click submit button
- Wait for confirmation

#### 3.4 Verify Change
- Confirm status badge shows "Close"
- Check for any error messages
- Log success or failure

#### 3.5 Database Logging
```javascript
{
  case_id: "2176268757",
  vin_number: "KNAFK4A67F5417672",
  previous_status: "Pending Close",
  new_status: "Close",
  action_taken: "status_changed",
  processing_mode: "manual",
  processed_by: "user@example.com",
  notes: "Successfully closed case"
}
```

### 4. Continue Processing
- Return to case listing
- Move to next case
- Repeat until all cases processed

### 5. Completion
- Generate summary report
- Display success/failure counts
- Provide CSV export option

## UI Components

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│                 PENDING CLOSE MANAGEMENT                     │
├─────────────────────────────────────────────────────────────┤
│  Processing Mode:  [●] Manual    [ ] Automatic              │
│                                                              │
│  [▶ START WORKFLOW]  [⏸ PAUSE]  [■ STOP]                   │
├─────────────────────────────────────────────────────────────┤
│  Current Status:                                            │
│  • Processing: Active                                       │
│  • Cases Found: 12                                          │
│  • Current: 5 of 12                                         │
│  • Case ID: 2176268757                                      │
│  • VIN: KNAFK4A67F5417672                                   │
│  • Action: Closing case...                                  │
├─────────────────────────────────────────────────────────────┤
│  Processing Log:                                            │
│  [10:23:45] Starting workflow...                            │
│  [10:23:47] Found 12 cases with Pending Close              │
│  [10:23:50] ✓ Case 2176268753 closed successfully          │
│  [10:23:53] ✓ Case 2176268754 closed successfully          │
│  [10:23:56] ⚡ Processing case 2176268757...                │
├─────────────────────────────────────────────────────────────┤
│  Report: [Filter ▼] [Export CSV] [Refresh]                  │
│  ┌──────────┬────────────┬──────────┬─────────┬──────────┐ │
│  │ Time     │ Case ID    │ VIN      │ Status  │ Mode     │ │
│  ├──────────┼────────────┼──────────┼─────────┼──────────┤ │
│  │ 10:23:50 │ 2176268753 │ KNAF...  │ Closed  │ Manual   │ │
│  │ 10:23:53 │ 2176268754 │ WBAB...  │ Closed  │ Manual   │ │
│  └──────────┴────────────┴──────────┴─────────┴──────────┘ │
│  Total: 2 | Success: 2 | Failed: 0                          │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Processing Modes
1. **Manual Mode**
   - User reviews each case
   - "Next Case" button for progression
   - Full control over process

2. **Automatic Mode**
   - Auto-proceeds after 2-second delay
   - Shows countdown timer
   - Can be paused anytime

### Special Considerations
- Handle "Action Required: Acknowledge Pending Close" warning
- Process repossessed cases that need final closure
- Track completion for reporting compliance

### Error Handling
- Session timeout recovery
- Network error retry (3 attempts)
- Missing element graceful failure
- Detailed error logging

### Reporting
- Real-time processing log
- Comprehensive report table
- CSV export with all fields
- Success/failure statistics
- Compliance tracking

## API Endpoints (Internal)

### Start Workflow
```typescript
POST /api/pending-close/start
Body: { mode: 'manual' | 'automatic' }
```

### Get Status
```typescript
GET /api/pending-close/status
Response: { 
  active: boolean,
  current_case: string,
  processed: number,
  total: number
}
```

### Export Report
```typescript
GET /api/pending-close/export
Response: CSV file download
```

## TypeScript Types

```typescript
interface PendingCloseCase {
  id: string;
  caseId: string;
  vinNumber: string;
  previousStatus: 'Pending Close';
  newStatus: 'Close';
  processingMode: 'manual' | 'automatic';
  timestamp: Date;
}

interface WorkflowState {
  status: 'idle' | 'processing' | 'paused' | 'completed';
  mode: 'manual' | 'automatic';
  currentCase: string | null;
  processedCount: number;
  totalCount: number;
  errors: string[];
}

interface CaseDetails {
  caseId: string;
  vin: string;
  debtor: string;
  vehicle: string;
  orderType: string;
  orderDate: string;
  status: string;
  requiresAcknowledgment: boolean;
}
```

## Integration Points

### Module 1 (RDN Portal Auth)
- Reuse authentication service
- Session management
- Cookie handling

### Module 4 (Agent Visibility)
- Similar UI patterns
- Shared navigation logic
- Common error handling

### Module 5 (On-Hold)
- Shared workflow architecture
- Similar status change logic
- Common reporting structure

## Testing Requirements

### Unit Tests
- Case closure service
- CSV export utility
- Error handler functions

### Integration Tests
- Full workflow execution
- Database logging
- Report generation

### E2E Tests
- Manual mode workflow
- Automatic mode workflow
- Error recovery scenarios
- Acknowledgment handling

## Performance Considerations

- Batch database inserts (10 records at a time)
- Implement request throttling (1 request per second)
- Memory cleanup after processing 50 cases
- Lazy load report data (pagination)

## Security Considerations

- Validate all case IDs before processing
- Sanitize database inputs
- Secure CSV export (authenticated only)
- Audit trail for all closures
- Compliance tracking for closed cases

## Business Rules

1. **Case Eligibility**
   - Must have "Pending Close" status
   - Must not be already closed
   - Must have valid VIN

2. **Closure Requirements**
   - Status must change to "Close"
   - VIN must be recorded
   - Timestamp must be logged
   - User must be identified

3. **Reporting Requirements**
   - Daily closure reports
   - Weekly summary statistics
   - Monthly compliance reports

## Success Metrics

- Cases closed per hour
- Success rate (target: >95%)
- Average processing time per case
- Error rate by type
- Compliance rate
- User engagement with manual vs automatic mode

## Deployment Checklist

- [ ] Database table created
- [ ] Environment variables configured
- [ ] Module routing added
- [ ] UI components tested
- [ ] Services integrated
- [ ] Error handling verified
- [ ] Performance optimized
- [ ] Documentation complete
- [ ] User training provided
- [ ] Compliance verification

## Notes

### From SOP Documentation
- Cases show "Action Required: Acknowledge Pending Close" in red
- After status change, verify closure is complete
- VIN tracking is mandatory for reporting
- Cases may come from repossession workflow

### Important Warnings
- Always verify status change was saved
- Handle session timeouts gracefully
- Maintain audit trail for compliance
- Never skip VIN extraction