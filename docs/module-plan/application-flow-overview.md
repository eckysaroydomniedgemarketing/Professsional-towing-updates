# Professional Towing RDN Automation - Application Flow Overview

## Executive Summary
This MVP/POC automates the manual case update process for Professional Towing's RDN portal operations. The system processes repossession cases, validates eligibility, generates updates using templates, and tracks progress.

## System Architecture

### Module Overview
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│   Module 1:     │────▶│    Module 2:     │────▶│     Module 3:      │────▶│    Module 4:     │
│ Authentication  │     │ Data Extraction  │     │  Case Processing    │     │  New Updates     │
│  & Navigation   │     │                  │     │ & Update Generation │     │   Processing     │
└─────────────────┘     └──────────────────┘     └─────────────────────┘     └──────────────────┘
```

## User Journey Map

### 1. Initial Setup & Authentication
**Route**: `/` → `/sign-in` → `/dashboard`

**User Flow**:
1. User lands on homepage
2. Redirected to Clerk sign-in
3. Authenticates via Microsoft SSO or email/password
4. Lands on main dashboard

**UI Components**:
- Two-column sign-in layout
- Loading states during auth
- Success redirect to dashboard

### 2. Main Dashboard
**Route**: `/dashboard`

**Key Sections**:
```
┌─────────────────────────────────────────────────────────┐
│                    Header & Navigation                   │
├───────────────┬─────────────────────────────────────────┤
│               │                                         │
│   Sidebar     │         Main Content Area              │
│               │                                         │
│ • Dashboard   │  ┌─────────────┬──────────────┐       │
│ • RDN Portal  │  │ Quick Stats │ Active Tasks │       │
│ • Case Queue  │  ├─────────────┴──────────────┤       │
│ • Processing  │  │                             │       │
│ • Reports     │  │   Workflow Control Panel    │       │
│               │  │                             │       │
│               │  └─────────────────────────────┘       │
└───────────────┴─────────────────────────────────────────┘
```

**Widgets**:
- **Quick Stats**: Cases pending, processed today, success rate
- **Active Tasks**: Current automation status
- **Workflow Control**: Start/stop automation buttons

### 3. RDN Portal Integration
**Route**: `/rdn-portal`

**Purpose**: Browser automation control for RDN portal

**UI Flow**:
1. **Connection Setup**
   - Enter RDN credentials (stored securely)
   - Test connection button
   - Connection status indicator

2. **Automation Control**
   ```
   ┌────────────────────────────────────┐
   │     RDN Portal Automation          │
   ├────────────────────────────────────┤
   │ Status: [Connected/Disconnected]   │
   │                                    │
   │ [Start Workflow] [Stop] [Pause]    │
   │                                    │
   │ Progress: ████████░░ 80%          │
   │ Cases Processed: 45/56             │
   └────────────────────────────────────┘
   ```

3. **Live View** (Optional for MVP)
   - Iframe or screenshot of current RDN page
   - Current step indicator
   - Error messages if any

### 4. Case Processing Center (Combined Dashboard & Workflow)
**Route**: `/case-processing`

**Split-Screen Layout**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Case Processing Center                              │
├────────────────────────────────┬─────────────────────────────────────────────┤
│ CONTROLS                       │ WORKFLOW - Case #2174447548                 │
│                               │ Progress: [●][●][○][○][○][○][○][○] Step 2/8 │
│ Today: 45 cases | Rate: 94.5% ├─────────────────────────────────────────────┤
│                               │                                             │
│ ┌───────────────────────┐     │ Current Step: Property Verification        │
│ │   Get Next Case       │     │                                             │
│ │     ┌─────────┐       │     │ ┌─────────────────────────────────────┐   │
│ │     │ START │         │     │ │ Address: 1101 EUCLID AVE APT 518    │   │
│ │     └─────────┘       │     │ │ CLEVELAND, OH 44115                 │   │
│ └───────────────────────┘     │ │                                     │   │
│                               │ │ ⚠️ Please verify property:          │   │
│ Or enter case ID:            │ │                                     │   │
│ [_______________] [Go]        │ │ 1. Open Google Maps                 │   │
│                               │ │ 2. Search for address               │   │
│ ─────────────────────         │ │ 3. Verify property exists           │   │
│                               │ │                                     │   │
│ Automation: [OFF] ○───        │ │ Property Type: [Select ▼]           │   │
│                               │ │                                     │   │
│ Status: Ready                 │ │ ☐ Property verified on Google Maps  │   │
│                               │ │                                     │   │
│ [View History] [Help]         │ │ [← Previous] [Skip] [Continue →]    │   │
│                               │ └─────────────────────────────────────┘   │
└────────────────────────────────┴─────────────────────────────────────────────┘
```

**Features**:
- Integrated dashboard and workflow in single view
- Persistent controls on left
- Dynamic workflow content on right
- Progress indicator shows current step
- No page navigation needed

#### Workflow Steps (Right Panel Content):

##### Step 1: Validation
```
┌─────────────────────────────────────────────────────────┐
│ Case Validation - Case #2174447548                      │
├─────────────────────────────────────────────────────────┤
│ ✓ Order Type: Involuntary Repo (Valid)                 │
│ ✓ Status: Open (Valid)                                 │
│ ✓ ZIP Code: 44115 (Covered)                           │
│ ✗ Exclusion Keywords: Found "DRN" in update            │
│ ⚠ Exception: Client sent 3 updates after DRN mention   │
├─────────────────────────────────────────────────────────┤
│ Result: ELIGIBLE WITH EXCEPTION                         │
└─────────────────────────────────────────────────────────┘
[← Back] [Continue →] [Skip Case]
```

##### Step 2: Manual Property Analysis
```
┌─────────────────────────────────────────────────────────┐
│ Property Analysis - Manual Verification Required         │
├─────────────────────────────────────────────────────────┤
│ Address: 1101 EUCLID AVE APT 518, CLEVELAND, OH 44115  │
│                                                         │
│ ⚠️ Please complete the following steps:                │
│                                                         │
│ 1. Open Google Maps in a new tab                       │
│ 2. Search for the address above                        │
│ 3. Verify the property exists                          │
│ 4. Note property characteristics                       │
│                                                         │
│ Property Type: [Select One ▼]                          │
│ • Single Family                                        │
│ • Multi-Family                                         │
│ • Commercial                                           │
│ • Apartment Complex                                    │
│                                                         │
│ ☐ I have verified this property on Google Maps         │
│                                                         │
│ Notes: ┌──────────────────────────────────┐           │
│        │                                  │           │
│        └──────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
[← Back] [Mark as Verified →]
```

##### Step 3: Template Selection
```
┌─────────────────────────────────────────────────────────┐
│ Template Selection                                       │
├─────────────────────────────────────────────────────────┤
│ Previous Update Used: Template A                        │
│ Recommended: Template B (rotation rule)                 │
│                                                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│ │ Template A  │ │ Template B  │ │ Template C  │       │
│ │    Used     │ │ Recommended │ │ Available   │       │
│ └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                         │
│ Preview:                                                │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Agent conducted surveillance at the listed      │   │
│ │ address. Property is a two-story multi-family   │   │
│ │ residence with open parking...                  │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
[← Back] [Use This Template] [Custom Template]
```

##### Step 4: Update Generation
```
┌─────────────────────────────────────────────────────────┐
│ Generate Update                                          │
├─────────────────────────────────────────────────────────┤
│ Type: Agent-Update                                      │
│ Address: 1101 EUCLID AVE APT 518, CLEVELAND, OH 44115  │
│                                                         │
│ Generated Content:                                      │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Agent conducted surveillance at the listed      │   │
│ │ address on 01/04/2025. Property is a two-story │   │
│ │ multi-family residence with open parking area.  │   │
│ │ No subject vehicle observed at location.        │   │
│ │ Will continue monitoring.                       │   │
│ └─────────────────────────────────────────────────┘   │
│ Characters: 245/1500                                    │
│                                                         │
│ Template Used: Template B - Multi-Family                │
└─────────────────────────────────────────────────────────┘
[← Back] [Review Update →]
```

##### Step 5: Update Review (Required)
```
┌─────────────────────────────────────────────────────────┐
│ Review Update Before Submission                          │
├─────────────────────────────────────────────────────────┤
│ ⚠️ Please review this update carefully before submitting │
│                                                         │
│ Update Content:                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Agent conducted surveillance at the listed      │   │
│ │ address on 01/04/2025. Property is a two-story │   │
│ │ multi-family residence with open parking area.  │   │
│ │ No subject vehicle observed at location.        │   │
│ │ Will continue monitoring.                       │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ [Edit Content]                                          │
│                                                         │
│ ☐ I have reviewed this update and approve it for       │
│   submission to RDN portal                              │
│                                                         │
│ Review Notes (optional):                                │
│ ┌─────────────────────────────────────────────────┐   │
│ │                                                 │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
[← Back to Template] [Request Changes] [Approve & Submit]
```

##### Step 6: Manual Notifications
```
┌─────────────────────────────────────────────────────────┐
│ Complete Manual Notifications                            │
├─────────────────────────────────────────────────────────┤
│ ✓ Update posted to RDN portal                          │
│                                                         │
│ ⚠️ Please complete the following notifications:        │
│                                                         │
│ In the RDN Portal Updates tab:                         │
│ ☐ Click "Collector" button                             │
│ ☐ Click "Client" button                                │
│ ☐ Click "Transferred to Client" button                 │
│                                                         │
│ Progress Tracking:                                      │
│ ☐ Copy VIN: 3N1CN8DV3LL888403                         │
│ ☐ Log VIN to hourly progress report                    │
│                                                         │
│ Notes: ┌──────────────────────────────────┐           │
│        │                                  │           │
│        └──────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
[← Back] [Confirm All Complete →]
```

##### Step 7: Case Completion
```
┌─────────────────────────────────────────────────────────┐
│ Case Processing Complete                                 │
├─────────────────────────────────────────────────────────┤
│ ✓ Update posted                                        │
│ ✓ Property verified manually                           │
│ ✓ Notifications sent manually                          │
│ ✓ VIN tracked                                          │
│                                                         │
│ Case #2174447548 completed                             │
│ Processing time: 2 minutes 15 seconds                  │
└─────────────────────────────────────────────────────────┘
[Process Next Case] [View Queue] [View Report]
```

### 5. Progress & Reports
**Route**: `/reports`

**Dashboard View**:
```
┌─────────────────────────────────────────────────────────┐
│                    Reports Dashboard                     │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│ │ Today: 156   │ │ This Week:   │ │ Success Rate │    │
│ │ Cases        │ │ 892 Cases    │ │    94.5%     │    │
│ └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                         │
│ Hourly Progress Chart:                                  │
│ ┌─────────────────────────────────────────────────┐   │
│ │  25 ┤ ██                                        │   │
│ │  20 ┤ ██ ██                                     │   │
│ │  15 ┤ ██ ██ ██ ██                              │   │
│ │  10 ┤ ██ ██ ██ ██ ██                           │   │
│ │   5 ┤ ██ ██ ██ ██ ██ ██                        │   │
│ │   0 └─┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──    │   │
│ │      8  9 10 11 12  1  2  3  4  5  6  7  8     │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ [Export to Sheets] [Download CSV] [Email Report]        │
└─────────────────────────────────────────────────────────┘
```

### 6. New Updates Processing
**Route**: `/new-updates`

**Purpose**: Review updates from field agents

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│                    New Updates                           │
├─────────────────────────────────────────────────────────┤
│ Filters: [Show All ▼] [All Time ▼] [High Priority ▼]   │
├─────────────────────────────────────────────────────────┤
│ Case ID      Update Type    Author         Date         │
│ ─────────────────────────────────────────────────────── │
│ 2174447551   Field Update   Agent Smith    Today 2:15pm │
│ 2174447552   Client Note    ALS Corp       Today 1:30pm │
│ 2174447553   Field Update   Agent Jones    Today 11:45am│
└─────────────────────────────────────────────────────────┘
[Select All] [Remove Selected] [Process Updates]
```

## Automation Flow States

### State Machine
```
     ┌──────┐
     │ IDLE │
     └───┬──┘
         │ Start
         ▼
   ┌───────────┐
   │CONNECTING │
   └─────┬─────┘
         │ Connected
         ▼
   ┌───────────┐     Error    ┌─────────┐
   │PROCESSING │──────────────▶│  ERROR  │
   └─────┬─────┘               └────┬────┘
         │                          │ Retry
         │ Complete                 ▼
         ▼                    ┌───────────┐
   ┌───────────┐              │  PAUSED   │
   │ COMPLETE  │              └───────────┘
   └───────────┘
```

## Key User Interactions

### 1. Quick Actions Menu
- Floating action button with common tasks
- Keyboard shortcuts for power users
- Context-sensitive options

### 2. Notification System
- Toast notifications for real-time updates
- Notification center for history
- Email/SMS alerts for critical events

### 3. Help & Onboarding
- Interactive tutorials for new users
- Contextual help tooltips
- Video guides for complex processes

## Mobile Considerations (Future Enhancement)

### Responsive Design
- Stack navigation on mobile
- Touch-optimized controls
- Simplified workflow for small screens

### Progressive Web App
- Offline capability for viewing reports
- Push notifications
- Home screen installation

## Performance Optimizations

### Loading States
```
┌─────────────────────────────────────┐
│         Loading Case Data...         │
│                                     │
│         ████████░░░░ 60%           │
│                                     │
│    Validating eligibility...        │
└─────────────────────────────────────┘
```

### Caching Strategy
- Case data cached for 5 minutes
- Template cache refreshed daily
- ZIP code lookup cached indefinitely

### Background Processing
- Queue processing continues in background
- Real-time updates via WebSocket
- Automatic retry on failures

## Error Handling

### User-Friendly Error Messages
```
┌─────────────────────────────────────┐
│ ⚠️  Unable to Process Case          │
├─────────────────────────────────────┤
│ The RDN portal is not responding.   │
│ This case has been moved back to    │
│ the queue and will retry in 5 mins. │
│                                     │
│ [View Details] [Skip Case] [Retry]  │
└─────────────────────────────────────┘
```

### Recovery Options
- Automatic retry with exponential backoff
- Manual intervention options
- Skip and continue functionality

## Success Metrics Dashboard

### Real-Time Metrics
- Cases per hour
- Average processing time
- Success/failure ratio
- Template usage distribution

### Analytics Views
- Daily/weekly/monthly trends
- User performance metrics
- System health indicators
- Cost savings calculations

## Implementation Phases

### Phase 1: MVP Core (Weeks 1-2)
- Basic authentication (Module 1)
- Manual case processing workflow
- Simple template selection
- Basic reporting

### Phase 2: Automation (Weeks 3-4)
- Browser automation integration
- Batch processing
- Automated template rotation
- Progress tracking

### Phase 3: Enhancement (Week 5+)
- Advanced analytics
- Performance optimizations
- Mobile responsiveness
- API integrations

## Technical Stack Summary
- **Frontend**: Next.js + TypeScript
- **UI**: Shadcn/ui + Tailwind CSS
- **Auth**: Clerk.com
- **Database**: Supabase
- **Automation**: Playwright (via MCP)
- **State**: React Context + Hooks
- **Deployment**: Vercel/Railway