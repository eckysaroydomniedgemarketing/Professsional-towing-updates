# Professional Towing RDN Automation - MVP Implementation Plan

## 📋 Executive Summary

This plan outlines the frontend user flow and architecture for automating Professional Towing's manual case update process. The MVP will streamline the workflow from case selection through update submission, reducing processing time from ~10 minutes to <1 minute per case.

## 🎯 Project Goals

1. **Automate repetitive tasks** while maintaining quality control
2. **Reduce processing time** by 90%
3. **Ensure compliance** with all validation rules
4. **Track progress** and generate reports
5. **Provide intuitive UI** for operators

## 🏗️ System Architecture

### Module Structure
```
Module 1: Authentication → Module 2: Data Extraction → Module 3: Case Processing → Module 4: New Updates
```

### Tech Stack
- **Frontend**: Next.js 14 + TypeScript
- **UI Components**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Authentication**: Clerk.com (Microsoft SSO + Email)
- **Database**: Supabase (PostgreSQL)
- **Browser Automation**: Playwright (via MCP)

## 📱 Core User Flows

### 1. Case Processing Center (`/case-processing`)
**Purpose**: All-in-one interface for case processing workflow
**Layout**: Split-screen design
**Left Panel - Controls**:
- "Start Workflow" button (changes to "Get Next Case" after completing a case)
- Manual case ID entry with "Load Case" button
- Automatic Mode toggle (default: OFF)
- Current status display
- Workflow actions (Pause/Stop)

**Right Panel - Workflow Steps**:
1. **Validation** - Check eligibility criteria
2. **Manual Property Analysis** - User verifies address on Google Maps
3. **Template Selection** - Choose appropriate template
4. **Update Generation** - Create update from template
5. **Update Review** - User reviews and approves generated content (Required Gate)
6. **Update Submission** - Post approved update to RDN
7. **Manual Notifications** - User completes notifications in RDN portal
8. **Completion** - Track VIN and mark case complete

### 2. Automation Control Panel (`/rdn-portal`)
**Purpose**: Manage browser automation
**Key Features**:
- Start/Stop/Pause controls
- Progress indicators
- Error handling
- Connection status

### 3. Reports & Analytics (`/reports`)
**Purpose**: Track performance and progress
**Key Features**:
- Hourly/daily/weekly metrics
- Export capabilities
- VIN tracking integration
- Success rate analytics

## 🔗 Module Integration

When "Start Workflow" is clicked:
1. **Module 1**: Automated RDN portal login
2. **Module 2**: Extract and populate case data
3. **Module 3**: Begin case processing workflow (uses only the most recent extraction)

All modules work sequentially - Module 3 requires successful completion of Modules 1 & 2.

## 🔄 Automation Workflow

### Manual Mode
1. User clicks "Start Workflow" (triggers Module 1 & 2)
2. User clicks "Get Next Case" (or enters case ID)
3. System validates eligibility
4. **User manually verifies property on Google Maps**
5. User selects template (with rotation suggestions)
6. System generates update from template
7. **User reviews and approves update (Required)**
8. System submits approved update to RDN
9. **User manually completes notifications in RDN portal**
10. User confirms completion and logs VIN

### Semi-Automated Mode
1. User starts automation (triggers Module 1 & 2)
2. System processes cases one at a time
3. Auto-retrieves next case and validates
4. **Pauses for user to verify property manually**
5. Auto-selects templates (rotation logic)
6. Generates update from template
7. **Pauses for user review and approval (Required)**
8. Submits only approved updates
9. **Pauses for user to complete notifications**
10. Logs progress after user confirmation
11. Continues to next case

## ✅ Validation Rules

### Case Eligibility
- ✓ Order Type: "Involuntary Repo" or "Investigate Repo"
- ✓ Status: "Open"
- ✓ ZIP Code: In coverage area (Supabase lookup)
- ✓ No exclusion keywords in recent updates
- ✓ Property images available

### Update History Text Analysis Rules

**Scope**: Analyze most recent 10 updates from case history using AI text analysis
**AI Service**: OpenRouter API with Gemini Free model for intelligent keyword detection

**Case NOT eligible for posting if:**
1. Latest update contains keywords (AI will detect variations):
   - DRN/DRN HIT (includes "DRN located", "DRN hit on vehicle", etc.)
   - LPR (includes "LPR scan", "LPR system", "license plate reader", etc.)
   - GPS (includes "GPS tracking", "GPS located", "tracked by GPS", etc.)
   - SURRENDER (includes "voluntary surrender", "unit surrendered", "customer surrendered", etc.)
   - Unit Spotted/Found (includes "unit spotted at", "vehicle was spotted", "found at address", etc.)
2. No Agent Update exists in case history
3. SURRENDER keyword appears anywhere in update history

**Recovery Rules:**
- **DRN/LPR/GPS in old updates**: Eligible if client posted 2-3 updates after keyword
- **SURRENDER anywhere**: No recovery - permanently ineligible
- **Unit Spotted/Found**: Only blocks if in latest update

**AI Text Analysis Approach:**
- Use OpenRouter API with Gemini Free model
- AI handles variations, misspellings, and context
- Single API call analyzes all 10 updates for keywords
- Returns structured result: keyword found (yes/no), which keyword, which update position

## 📊 Database Schema Updates

### New Tables for Module 3
1. **case_processing_status** - Track current/next case status
2. **case_validations** - Store validation results
3. **template_usage** - Track template rotation
4. **update_reviews** - Record review approvals
5. **notification_log** - Record notifications sent

## 🎨 UI/UX Highlights

### Design Principles
- Clean, professional interface
- Split-screen efficiency
- Clear visual hierarchy
- Status indicators throughout
- Accessibility compliant (WCAG AA)

### Key Components
- **Split-Screen Layout** - Controls + Workflow in one view
- **Progress Indicators** - Real-time processing feedback
- **Status Badges** - Quick status identification
- **Step-by-Step Workflow** - Guided process in right panel
- **Persistent Controls** - Always accessible on left

## 📈 Success Metrics

### KPIs to Track
- Cases processed per hour
- Average processing time (target: 2-3 minutes with manual steps)
- Validation accuracy rate
- Template rotation compliance
- Error rate (<5% target)
- Manual verification completion rate
- Notification completion tracking

## 🔧 Implementation Status

### Completed Components ✅
- ✅ Split-screen layout (sidebar + main content area)
- ✅ Module 1 & 2 integration (WorkflowControl component)
- ✅ Workflow Control card with all buttons in one section
- ✅ "Start Workflow" button (changes to "Get Next Case" after modules complete)
- ✅ Manual case ID input with "Load Case" button
- ✅ Automatic Mode toggle (default: OFF)
- ✅ Status badge displaying current workflow state
- ✅ Current case display
- ✅ Pause/Stop workflow actions
- ✅ Progress bar for 8-step workflow
- ✅ All 8 workflow step components (UI placeholders ready)

### Current Flow
1. User clicks "Start Workflow" → Executes Module 1 (RDN login) & Module 2 (data extraction)
2. During module execution → WorkflowControl shows in main area with real-time status
3. Modules complete → Main area shows "Ready to Process Cases"
4. Button automatically changes to "Get Next Case"
5. User clicks "Get Next Case" or manually enters Case ID → Starts 8-step workflow
6. Right panel displays current step with Next/Previous/Skip navigation
7. Progress bar shows completion percentage
8. User can Pause/Stop at any time

### Pending Implementation
- [ ] All business logic tasks mapped below
- [ ] Database tables creation
- [ ] Integration with RDN portal API
- [ ] Error handling and validation messages

## 📊 Implementation Tasks (SOP Mapped)

### 0. USE LATEST EXTRACTION ONLY
- [ ] Module 3 queries must use ORDER BY created_at DESC LIMIT 1 pattern
- [ ] Or filter by MAX(created_at) for the case_id

### 1. CASE VALIDATION LOGIC
**SOP Steps 6-7 (Order Type & Status Check)**
- [x] Check order_type IN ('Involuntary Repo', 'Investigate Repo') ✅ Implemented in case-validation.service.ts
- [x] Check status = 'Open' ✅ Implemented in case-validation.service.ts
- [x] Skip cases with wrong order type or status ✅ Validation step shows Pass/Fail

**SOP Step 8 (ZIP Code Coverage)**
- [ ] Query Supabase zip_codes table
- [ ] Check ALL addresses for the case
- [ ] Validate if ANY address ZIP code exists with is_active = true
- [ ] Skip cases only if ALL addresses are outside coverage

**SOP Steps 10, 86-90 (Exclusion Keywords)**
- [ ] Search all updates for: 'DRN', 'LPR', 'GPS', 'Surrender'
- [ ] Check for 'Unit Spotted' or 'found at address'
- [ ] Implement exception: Allow if 2-3 client updates after keyword

### 2. PROPERTY VERIFICATION 
**SOP Steps 12-14, 99-114 (Google Maps & Property Check)**
- [ ] Display case address with Google Maps link
- [ ] Show property images from case data
- [ ] Add property type selection dropdown
- [ ] Add parking availability options
- [ ] Require confirmation before proceeding

### 3. TEMPLATE SELECTION
**SOP Steps 9, 15, 131-136 (Template Rotation)**
- [ ] Parse previous updates to find last template used
- [ ] Implement rotation logic: A→B→C→D→A
- [ ] Load templates from database/config
- [ ] Prevent duplicate template usage
- [ ] Show selected template preview

### 4. UPDATE GENERATION
**SOP Step 16, 144-150 (Create Update)**
- [ ] Set Type = 'Agent Update'
- [ ] Set Address = case address (from dropdown)
- [ ] Set Details = selected template content
- [ ] Allow editing before submission

### 5. UPDATE SUBMISSION
**SOP Step 16 (Create Button)**
- [ ] Submit update to RDN portal
- [ ] Handle success/failure response
- [ ] Show confirmation message

### 6. NOTIFICATIONS
**SOP Step 18, 159-161 (Client Notifications)**
- [ ] Display 3 checkboxes:
  - [ ] Collector
  - [ ] Client
  - [ ] Transferred to Client
- [ ] Require all checked to proceed
- [ ] Log notification completion

### 7. VIN TRACKING
**SOP Steps 19-20, 163-173 (Track Completion)**
- [ ] Extract VIN from case data
- [ ] Display VIN for user to copy
- [ ] Log to case_completions table
- [ ] Update hourly metrics

### 8. DATABASE SCHEMA
```sql
-- Track validation results
CREATE TABLE case_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id VARCHAR NOT NULL,
  order_type VARCHAR,
  status VARCHAR,
  zip_code VARCHAR,
  has_exclusions BOOLEAN,
  validation_passed BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Track template usage
CREATE TABLE template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id VARCHAR NOT NULL,
  template_id VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Track completions
CREATE TABLE case_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id VARCHAR NOT NULL,
  vin VARCHAR,
  completed_by VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ZIP coverage areas
CREATE TABLE coverage_areas (
  zip_code VARCHAR PRIMARY KEY,
  is_active BOOLEAN DEFAULT true
);
```

## 🚀 Implementation Priority
1. **Latest Extraction Filter** - Fix duplicate data issue (Task 0)
2. **Core Validation** - Prevent invalid cases (Tasks 1.1-1.3)
3. **Template System** - Enable update generation (Task 3)
4. **Update Submission** - Main functionality (Tasks 4-5)
5. **Tracking** - Completion proof (Task 7)
6. **UI Polish** - Property verification, notifications (Tasks 2, 6)