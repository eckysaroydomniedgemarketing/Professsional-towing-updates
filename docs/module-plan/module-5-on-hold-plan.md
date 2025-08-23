# Module 5: On-Hold Implementation Plan

## Overview
Module 5 handles the "On Hold" workflow for cases that need status change from "Pending On Hold" to "Hold". This module automates the process of identifying and updating cases with pending hold status in the RDN portal.

## Module Specifications
- **Module Name**: `module-5-on-hold`
- **Page Route**: `/on-hold`
- **RDN URL**: `https://app.recoverydatabase.net/v2/main/view_cases.php?status=Pending+On+Hold`
- **Purpose**: Process cases with "Pending On Hold" status
- **Action**: Change status from "Pending On Hold" to "Hold"

## Module Structure
```
src/modules/module-5-on-hold/
├── components/
│   ├── on-hold-dashboard.tsx          # Main dashboard interface
│   ├── workflow-control.tsx           # Mode toggle and action buttons
│   ├── case-display.tsx              # Current case details display
│   └── report-table.tsx              # Processed cases report
├── services/
│   ├── on-hold-workflow.service.ts   # Main workflow orchestrator
│   ├── case-status.service.ts        # Status change logic
│   ├── navigation.service.ts         # RDN portal navigation
│   └── supabase-log.service.ts       # Database logging
├── hooks/
│   ├── use-on-hold.ts                # Main hook for on-hold logic
│   └── use-workflow-state.ts         # Workflow state management
├── types/
│   └── index.ts                      # TypeScript type definitions
└── utils/
    ├── csv-export.ts                 # CSV export functionality
    └── error-handler.ts              # Error handling utilities
```

## Database Schema

### Table: `on_hold_log`
```sql
CREATE TABLE on_hold_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL,
  vin_number TEXT,
  previous_status TEXT DEFAULT 'Pending On Hold',
  new_status TEXT DEFAULT 'Hold',
  action_taken TEXT DEFAULT 'status_changed',
  processing_mode TEXT CHECK (processing_mode IN ('manual', 'automatic')),
  processed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_on_hold_log_case_id ON on_hold_log(case_id);
CREATE INDEX idx_on_hold_log_created_at ON on_hold_log(created_at);
```

## Workflow Process

### 1. Authentication
- Use Module 1 for RDN portal login
- Verify active session before processing

### 2. Navigation
- Navigate to: `/v2/main/view_cases.php?status=Pending+On+Hold`
- Wait for page load completion
- Extract total case count

### 3. Case Processing Loop
For each case in the listing:

#### 3.1 Open Case
- Click on Case ID link
- Navigate to: `/alpha_rdn/module/default/case2/?case_id=XXXXXXXX`
- Wait for case details to load

#### 3.2 Extract Information
- Case ID from URL or page
- VIN number from vehicle section
- Current status (should be "Pending On Hold")

#### 3.3 Change Status
- Locate status dropdown: `id="status_static"`
- Current selection: "Pending On Hold"
- Select new status: "Hold"
- Click submit button
- Wait for confirmation

#### 3.4 Verify Change
- Confirm status badge shows "Hold"
- Check for any error messages
- Log success or failure

#### 3.5 Database Logging
```javascript
{
  case_id: "2176268757",
  vin_number: "KNAFK4A67F5417672",
  previous_status: "Pending On Hold",
  new_status: "Hold",
  action_taken: "status_changed",
  processing_mode: "manual",
  processed_by: "user@example.com",
  notes: "Successfully changed status"
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
│                    ON-HOLD MANAGEMENT                        │
├─────────────────────────────────────────────────────────────┤
│  Processing Mode:  [●] Manual    [ ] Automatic              │
│                                                              │
│  [▶ START WORKFLOW]  [⏸ PAUSE]  [■ STOP]                   │
├─────────────────────────────────────────────────────────────┤
│  Current Status:                                            │
│  • Processing: Active                                       │
│  • Cases Found: 8                                           │
│  • Current: 3 of 8                                          │
│  • Case ID: 2176268757                                      │
│  • VIN: KNAFK4A67F5417672                                   │
│  • Action: Changing to Hold...                              │
├─────────────────────────────────────────────────────────────┤
│  Processing Log:                                            │
│  [10:23:45] Starting workflow...                            │
│  [10:23:47] Found 8 cases with Pending On Hold             │
│  [10:23:50] ✓ Case 2176268755 changed to Hold              │
│  [10:23:53] ✓ Case 2176268756 changed to Hold              │
│  [10:23:56] ⚡ Processing case 2176268757...                │
├─────────────────────────────────────────────────────────────┤
│  Report: [Filter ▼] [Export CSV] [Refresh]                  │
│  ┌──────────┬────────────┬──────────┬─────────┬──────────┐ │
│  │ Time     │ Case ID    │ VIN      │ Status  │ Mode     │ │
│  ├──────────┼────────────┼──────────┼─────────┼──────────┤ │
│  │ 10:23:50 │ 2176268755 │ KNAF...  │ Hold    │ Manual   │ │
│  │ 10:23:53 │ 2176268756 │ WBAB...  │ Hold    │ Manual   │ │
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

## API Endpoints (Internal)

### Start Workflow
```typescript
POST /api/on-hold/start
Body: { mode: 'manual' | 'automatic' }
```

### Get Status
```typescript
GET /api/on-hold/status
Response: { 
  active: boolean,
  current_case: string,
  processed: number,
  total: number
}
```

### Export Report
```typescript
GET /api/on-hold/export
Response: CSV file download
```

## TypeScript Types

```typescript
interface OnHoldCase {
  id: string;
  caseId: string;
  vinNumber: string;
  previousStatus: 'Pending On Hold';
  newStatus: 'Hold';
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

## Testing Requirements

### Unit Tests
- Status change service
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

## Performance Considerations

- Batch database inserts (10 records at a time)
- Implement request throttling (1 request per second)
- Memory cleanup after processing 50 cases
- Lazy load report data (pagination)

## Security Considerations

- Validate all case IDs before processing
- Sanitize database inputs
- Secure CSV export (authenticated only)
- Audit trail for all actions

## Success Metrics

- Cases processed per hour
- Success rate (target: >95%)
- Average processing time per case
- Error rate by type
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