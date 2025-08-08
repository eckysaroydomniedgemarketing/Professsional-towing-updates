# Manual Steps Integration Guide

## Overview
This document outlines how manual steps are integrated into the automated workflow for property verification and stakeholder notifications.

## Manual Property Verification (Steps 12-14)

### Current Manual Process
1. Open Google Maps in new tab
2. Search for property address
3. Verify property exists
4. Note property characteristics
5. Review property images (if available)

### Frontend Implementation
```typescript
interface PropertyVerificationStep {
  caseId: string
  address: string
  status: 'pending' | 'in_progress' | 'completed'
  verificationData: {
    propertyExists: boolean | null
    propertyType: string | null
    characteristics: string[]
    verifiedBy: string | null
    verifiedAt: Date | null
    notes: string | null
  }
}
```

### UI Flow
1. **Display Instructions**
   - Clear step-by-step guide
   - Copy-to-clipboard for address
   - Direct link to open Google Maps

2. **Verification Form**
   - Property exists checkbox
   - Property type dropdown
   - Characteristics checklist
   - Notes field for observations
   - "Mark as Verified" button

3. **Validation**
   - Cannot proceed without verification
   - Timestamp and user recorded
   - Audit trail maintained

## Manual Stakeholder Notifications (Step 18)

### Current Manual Process
1. Navigate to Updates section in RDN
2. Click "Collector" button
3. Click "Client" button  
4. Click "Transferred to Client" button

### Frontend Implementation
```typescript
interface NotificationStep {
  caseId: string
  updateId: string
  notifications: {
    collectorNotified: boolean
    clientNotified: boolean
    transferredToClient: boolean
    completedBy: string | null
    completedAt: Date | null
  }
}
```

### UI Flow
1. **Post-Update Screen**
   - Success message for update submission
   - Clear instructions for notifications
   - Checklist of required actions

2. **Notification Checklist**
   - [ ] "I clicked Collector button in RDN"
   - [ ] "I clicked Client button in RDN"
   - [ ] "I clicked Transferred to Client in RDN"
   - Each checkbox enables timestamp

3. **VIN Tracking**
   - Display VIN prominently
   - Copy button for VIN
   - Checkbox: "VIN logged to progress report"

4. **Completion Confirmation**
   - All checkboxes must be checked
   - "Confirm All Complete" button
   - Records completion timestamp

## Workflow Integration

### Manual Mode Flow
```
Start → Validation → [PAUSE: Property Verification] → Template → 
Update → Submit → [PAUSE: Notifications] → Complete
```

### Semi-Automated Mode Flow
```
Batch Start → For Each Case:
  - Auto-validate
  - [PAUSE: User verifies property]
  - Auto-select template
  - Auto-generate update
  - Auto-submit
  - [PAUSE: User completes notifications]
  - Continue to next
```

## UI Components

### Property Verification Modal
```
┌─────────────────────────────────────────────────────────┐
│ Property Verification Required                           │
├─────────────────────────────────────────────────────────┤
│ Please verify this property before continuing:          │
│                                                         │
│ Address: 1101 EUCLID AVE APT 518, CLEVELAND, OH 44115  │
│ [Copy Address] [Open Google Maps]                       │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Instructions:                                   │   │
│ │ 1. Click "Open Google Maps" above              │   │
│ │ 2. Verify the property exists                  │   │
│ │ 3. Note the property type and features         │   │
│ │ 4. Return here to complete verification        │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Property Type: [Select... ▼]                           │
│                                                         │
│ ☐ Property exists and is accessible                    │
│ ☐ I have reviewed property characteristics            │
│                                                         │
│ Notes: ┌────────────────────────────────┐             │
│        │                                │             │
│        └────────────────────────────────┘             │
│                                                         │
│ [Skip Case] [Save & Continue]                          │
└─────────────────────────────────────────────────────────┘
```

### Notification Completion Modal
```
┌─────────────────────────────────────────────────────────┐
│ Complete Notifications in RDN Portal                     │
├─────────────────────────────────────────────────────────┤
│ ✓ Update successfully posted!                           │
│                                                         │
│ Now complete these steps in the RDN portal:            │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 1. Go to the Updates tab (should be open)      │   │
│ │ 2. Find your new update at the top             │   │
│ │ 3. Click these buttons in order:               │   │
│ │    • Collector                                  │   │
│ │    • Client                                     │   │
│ │    • Transferred to Client                      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ☐ I clicked "Collector" button                         │
│ ☐ I clicked "Client" button                            │
│ ☐ I clicked "Transferred to Client" button             │
│                                                         │
│ VIN: 3N1CN8DV3LL888403 [Copy]                         │
│ ☐ VIN logged to hourly progress report                 │
│                                                         │
│ [Go Back] [Confirm All Complete]                       │
└─────────────────────────────────────────────────────────┘
```

## Progress Tracking

### Manual Step Metrics
- Average time for property verification
- Average time for notifications
- Completion rate for each step
- Cases skipped due to verification issues

### Database Schema
```sql
-- Track manual verifications
CREATE TABLE property_verifications (
  id UUID PRIMARY KEY,
  case_id TEXT REFERENCES case_updates(case_id),
  verified_by TEXT NOT NULL,
  verified_at TIMESTAMP NOT NULL,
  property_exists BOOLEAN NOT NULL,
  property_type TEXT,
  characteristics TEXT[],
  notes TEXT,
  time_taken_seconds INTEGER
);

-- Track manual notifications
CREATE TABLE notification_completions (
  id UUID PRIMARY KEY,
  case_id TEXT REFERENCES case_updates(case_id),
  update_id TEXT,
  completed_by TEXT NOT NULL,
  completed_at TIMESTAMP NOT NULL,
  collector_notified BOOLEAN NOT NULL,
  client_notified BOOLEAN NOT NULL,
  transferred_to_client BOOLEAN NOT NULL,
  vin_logged BOOLEAN NOT NULL,
  time_taken_seconds INTEGER
);
```

## Best Practices

### For Users
1. Keep Google Maps open in separate tab
2. Complete verifications promptly
3. Add notes for unusual properties
4. Double-check notifications before confirming

### For System
1. Save progress frequently
2. Allow resuming interrupted workflows
3. Clear visual indicators for completed steps
4. Prevent accidental skipping of manual steps

## Error Handling

### Verification Failures
- Property doesn't exist → Skip case
- Unable to determine type → Add note, continue
- Google Maps error → Retry or skip

### Notification Failures
- RDN portal error → Retry later
- Buttons not visible → Check update status
- Session timeout → Re-authenticate

## Future Enhancements

### Phase 2 Considerations
- OCR for automatic property type detection
- API integration for notifications (if RDN provides)
- Batch property verification interface
- Mobile app for field verification