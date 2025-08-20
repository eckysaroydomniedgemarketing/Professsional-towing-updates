# Module 3: Case Processing & Update Generation Plan

## Overview
**Module Name**: Case Processing & Update Generation
**Purpose**: Process extracted case data, validate eligibility, generate appropriate updates, and submit them
**Description**: This module handles all business logic for case processing including validation, template selection, update generation, and notification workflows

## Module Flow Summary
1. Retrieve case data from database (populated by Module 2) or via manual case input
2. Validate case eligibility (Order Type, Status, ZIP code coverage)
3. Check exclusion criteria (DRN, LPR, GPS, Surrender keywords)
4. In Automatic Mode: Auto-skip rejected cases after 2-second countdown
5. Analyze property and select appropriate template
6. Generate and submit update
7. Notify stakeholders
8. Track progress

## Architecture Overview

### Frontend Pages Structure

#### 1. Case Processing Center (`/case-processing`)
- **Purpose**: All-in-one interface for case processing workflow
- **Layout**: Split-screen design with dashboard controls and workflow steps
- **Left Panel - Controls**:
  - "Post Case Update" button (initial state)
  - "Post Next Update" button (after completion)
  - Manual case ID entry with "Load Case" button (triggers Module 1 to navigate to RDN portal)
  - Automatic Mode toggle (enables auto-skip for rejected cases)
  - Processing status indicator
- **Right Panel - Workflow**:
  - Dynamic content area showing current step
  - Progress indicator at top
  - Step-by-step processing:
    1. Case Validation
    2. Property Verification (Manual)
    3. Template Selection
    4. Update Generation
    5. Update Review
    6. Submission
    7. Manual Notifications
    8. Completion

#### 2. Processing History (`/case-processing/history`)
- **Purpose**: View completed and rejected cases
- **Features**:
  - Search and filter capabilities
  - Export functionality
  - Audit trail for each case
  - Performance metrics

## Processing Workflow States

### Workflow Steps
```typescript
enum WorkflowStep {
  VALIDATION = 'validation',
  PROPERTY_VERIFICATION = 'property_verification', 
  TEMPLATE_SELECTION = 'template_selection',
  UPDATE_GENERATION = 'update_generation',
  UPDATE_REVIEW = 'update_review',              // Required review gate
  UPDATE_SUBMISSION = 'update_submission',      
  MANUAL_NOTIFICATIONS = 'manual_notifications',
  COMPLETION = 'completion'
}

interface WorkflowState {
  currentStep: WorkflowStep
  canProceed: boolean
  requiresUserAction: boolean
  stepData: {
    validation?: ValidationResult
    propertyVerification?: PropertyAnalysis
    templateSelection?: Template
    generatedUpdate?: GeneratedUpdate
    updateReview?: UpdateReview
    submissionResult?: SubmissionResult
    notifications?: NotificationTracking
  }
}
```

## Detailed Component Design

### Case Validation Component
```typescript
interface CaseValidationProps {
  caseId: string
  onValidationComplete: (result: ValidationResult) => void
}

interface ValidationResult {
  isEligible: boolean
  failureReasons?: string[]
  validationDetails: {
    orderTypeValid: boolean
    statusValid: boolean
    zipCodeCovered: boolean
    hasExclusionKeywords: boolean
    propertyImagesAvailable: boolean
  }
}
```

**UI Elements**:
- Validation checklist with real-time status
- Visual indicators (✓/✗) for each criterion
- Expandable details for failed validations
- Override button with reason input (admin only)

### Property Analysis Component
```typescript
interface PropertyAnalysisProps {
  caseId: string
  addresses: CaseAddress[]
  onAnalysisComplete: (result: PropertyAnalysis) => void
}

interface PropertyAnalysis {
  primaryAddress: CaseAddress
  manualVerificationStatus: 'pending' | 'verified' | 'failed'
  propertyType?: string
  propertyCharacteristics?: string[]
  verifiedBy?: string
  verifiedAt?: Date
  notes?: string
}
```

**UI Elements**:
- Instructions for manual verification
- Checkbox: "I have verified this property on Google Maps"
- Property type dropdown (Single Family, Multi-Family, Commercial, etc.)
- Property characteristics multi-select
- Notes field for manual observations
- "Mark as Verified" button

### Template Selection Component
```typescript
interface TemplateSelectionProps {
  caseId: string
  previousUpdateType?: string
  propertyAnalysis: PropertyAnalysis
  onTemplateSelected: (template: Template) => void
}

interface Template {
  id: string
  name: string
  content: string
  propertyTypes: string[]
  rotationOrder: number
}
```

**UI Elements**:
- Template rotation indicator
- Template preview with variables
- Custom template editor
- Template history for the case

### Update Generation Component
```typescript
interface UpdateGenerationProps {
  caseId: string
  selectedTemplate: Template
  caseDetails: CaseDetails
  onUpdateGenerated: (update: GeneratedUpdate) => void
}

interface GeneratedUpdate {
  type: 'Agent-Update'
  addressUpdate: string
  content: string
  metadata: {
    templateUsed: string
    generatedAt: Date
    generatedBy: string
  }
}
```

**UI Elements**:
- Live preview of generated update
- Character count indicator
- Variable replacement highlighting
- "Generate Update" button

### Update Review Component (Required Gate)
```typescript
interface UpdateReviewProps {
  caseId: string
  generatedUpdate: GeneratedUpdate
  onReviewComplete: (review: UpdateReview) => void
  onEditRequest: () => void
}

interface UpdateReview {
  originalContent: string
  finalContent: string
  wasEdited: boolean
  approved: boolean
  reviewedBy: string
  reviewedAt: Date
  reviewNotes?: string
}
```

**UI Elements**:
- Read-only preview of generated content
- Edit button to modify content
- Inline editor (if editing)
- Character count with limit indicator (1500 chars)
- Approval checkbox: "I have reviewed this update and approve it for submission"
- Review notes field (optional)
- "Request Changes" button (goes back to template selection)
- "Approve & Continue" button (disabled until checkbox checked)

## Validation Rules Engine

### Case Eligibility Criteria
```typescript
const ELIGIBLE_ORDER_TYPES = ['Involuntary Repo', 'Investigate Repo']
const ELIGIBLE_STATUSES = ['Open']
const EXCLUSION_KEYWORDS = ['DRN', 'LPR', 'GPS', 'Surrender']
const EXCLUSION_PHRASES = ['Unit Spotted', 'found at address']

interface ValidationRules {
  checkOrderType: (orderType: string) => boolean
  checkStatus: (status: string) => boolean
  checkZipCodeCoverage: (zipCode: string) => Promise<boolean>
  checkExclusionKeywords: (updates: CaseUpdate[]) => ExclusionResult
  checkRecentUpdates: (updates: CaseUpdate[]) => boolean
}
```

### Exception Handling
- If exclusion keywords found in OLD updates AND client sent 2-3 updates after → Allow processing
- First update with no property details → Flag for property analysis
- No "Agent's Update" after case acceptance → Skip case

## Template Management System

### Template Rotation Logic
```typescript
interface TemplateRotation {
  getNextTemplate: (lastUsedTemplate: string) => string
  getTemplateSequence: () => string[]
  preventDuplicates: (caseId: string, templateId: string) => boolean
}

// Template sequence: A → B → C → D → A...
const TEMPLATE_SEQUENCE = ['template_a', 'template_b', 'template_c', 'template_d']
```

### Template Variables
- `{{property_type}}` - Extracted from property analysis
- `{{address}}` - Primary address from case
- `{{date}}` - Current date
- `{{agent_name}}` - From authenticated user

## Notification System

### Manual Stakeholder Notifications
```typescript
interface NotificationTracking {
  recordManualNotification: (notification: ManualNotification) => Promise<void>
  getNotificationHistory: (caseId: string) => NotificationRecord[]
}

interface ManualNotification {
  caseId: string
  type: 'collector' | 'client' | 'transferred'
  performedBy: string
  performedAt: Date
  notes?: string
}
```

**UI Components**:
- Notification checklist with instructions
- Checkboxes for each notification type:
  - [ ] "I have notified the Collector"
  - [ ] "I have notified the Client"  
  - [ ] "I have marked as Transferred to Client"
- Timestamp recording when checked
- Optional notes field
- "Confirm Notifications Complete" button

## Progress Tracking

### VIN Tracking Integration
```typescript
interface ProgressTracking {
  extractVIN: (caseId: string) => string
  logToHourlyReport: (vin: string, timestamp: Date) => Promise<void>
  generateProgressReport: (dateRange: DateRange) => Report
}
```

**UI Elements**:
- VIN extraction display
- Progress report viewer
- Export to Google Sheets functionality

## Automation Controls

### Workflow Automation
```typescript
interface AutomationConfig {
  automaticMode: boolean // Toggle for automatic processing
  autoSkipRejected: boolean // Auto-skip rejected cases after delay
  autoSkipDelay: number // Delay before auto-skip (default: 2000ms)
  delayBetweenCases: number // Milliseconds between cases
  maxRetries: number
  pauseOnError: boolean
  notificationSettings: {
    onComplete: boolean
    onError: boolean
    onPause: boolean
  }
}
```

**UI Controls**:
- Automatic Mode toggle switch (enables automatic case processing)
- Start/Stop/Pause buttons
- Speed control (delay between cases)
- Error handling preferences
- Real-time progress indicator
- Current case display
- Auto-skip countdown display (shows 2-second countdown when case is rejected in automatic mode)

## Database Schema Updates

### New Tables for Module 3

#### Table: case_processing_status
```sql
- id (UUID)
- case_id (text, FK to case_updates)
- status (enum: 'pending', 'processing', 'completed', 'failed', 'skipped')
- started_at (timestamp)
- completed_at (timestamp)
- processed_by (text)
- failure_reason (text)
- next_case_id (text) -- Link to next case in sequence
```

#### Table: case_validations
```sql
- id (UUID)
- case_id (text, FK to case_updates)
- validation_type (text)
- is_valid (boolean)
- validation_details (jsonb)
- validated_at (timestamp)
- override_reason (text)
- override_by (text)
```

#### Table: template_usage
```sql
- id (UUID)
- case_id (text, FK to case_updates)
- template_id (text)
- used_at (timestamp)
- variables_used (jsonb)
```

#### Table: update_reviews
```sql
- id (UUID)
- case_id (text, FK to case_updates)
- original_content (text)
- final_content (text)
- was_edited (boolean)
- approved (boolean)
- reviewed_by (text)
- reviewed_at (timestamp)
- review_notes (text)
- time_spent_seconds (integer)
```

#### Table: notification_log
```sql
- id (UUID)
- case_id (text, FK to case_updates)
- notification_type (enum: 'collector', 'client', 'transferred')
- sent_at (timestamp)
- sent_by (text)
- status (text)
```

## API Endpoints

### Case Processing APIs
- `GET /api/case-processing/next` - Get next case to process
- `POST /api/case-processing/validate/:caseId` - Validate a case
- `POST /api/case-processing/analyze-property/:caseId` - Analyze property
- `GET /api/case-processing/templates` - Get available templates
- `POST /api/case-processing/generate-update` - Generate update
- `POST /api/case-processing/submit-update` - Submit update to RDN
- `POST /api/case-processing/notify` - Send notifications

### Progress Tracking APIs
- `GET /api/progress/hourly-report` - Get hourly progress
- `POST /api/progress/log-vin` - Log VIN to report
- `GET /api/progress/metrics` - Get processing metrics

## User Experience Flow

### Manual Processing Flow
1. User clicks "Post Case Update" from sidebar
2. System retrieves next eligible case
3. Reviews validation results
4. Manually verifies property via Google Maps
5. Selects appropriate template
6. System generates update from template
7. **User reviews generated update (Required)**
8. User approves or edits update
9. System submits approved update
10. User manually sends notifications in RDN
11. User confirms completion
12. Case marked as complete

### Manual Case Input Flow
1. User enters specific case ID in the input field
2. User clicks "Load Case" button
3. **System triggers Module 1 to navigate directly to RDN portal for that case**
4. Module 1 logs into RDN portal (if not already logged in)
5. Module 1 navigates to specific case URL: `https://app.recoverydatabase.net/alpha_rdn/module/default/case2/?tab=6&case_id={caseId}`
6. Module 2 extracts case data from the loaded case
7. Module 3 proceeds with normal validation and processing workflow
8. Case processing continues as per standard flow

### Semi-Automated Processing Flow
1. User enables "Automatic Mode" and clicks "Post Case Update"
2. System processes cases one at a time:
3. For each case:
   - Validates each case
   - **If case is rejected and Automatic Mode is ON:**
     - Shows 2-second countdown timer
     - Auto-skips to next case after countdown
     - No user intervention required for rejected cases
   - If case passes validation:
     - Pauses for manual property verification
     - Auto-selects templates based on rotation
     - Generates update content
     - **Pauses for user review and approval**
     - Submits approved updates only
     - Pauses for manual notifications
     - Logs progress after confirmation
4. User actively participates at pause points (except for rejected cases)
5. System continues after each user action or auto-skip

## Security & Permissions

### Role-Based Access
- **Admin**: Full access, can override validations
- **Operator**: Can process cases, cannot override
- **Viewer**: Read-only access to reports

### Audit Trail
- All actions logged with timestamp and user
- Validation overrides require reason
- Update modifications tracked

## Performance Considerations

### Optimization Strategies
- Batch processing for database queries
- Caching for ZIP code lookups
- Template preloading
- Progressive loading for case lists
- Background processing for notifications

### Monitoring
- Processing speed metrics
- Error rate tracking
- Template usage analytics
- User activity logs

## Integration Points

### External Services
- Google Maps API for address verification
- Google Sheets API for progress reports
- RDN Portal API (via browser automation)
- Notification service (email/SMS)

### Internal Modules
- Module 1: RDN Portal automation (auto-starts when "Post Case Update" clicked)
- Module 2: Data extraction (runs automatically after Module 1)
- Module 3: Case processing workflow (8 steps ending with posting update)

## Implementation Priority

### Phase 1: Core Processing (MVP)
1. Case validation logic
2. Basic template selection
3. Update generation
4. Manual submission flow

### Phase 2: Automation
1. Queue management
2. Batch processing
3. Automated template rotation
4. Progress tracking

### Phase 3: Enhancements
1. Property analysis with Google Maps
2. Advanced template management
3. Notification system
4. Comprehensive reporting

## Success Metrics
- Cases processed per hour
- Validation accuracy rate
- Template rotation compliance
- Error rate < 5%
- Processing time per case < 30 seconds