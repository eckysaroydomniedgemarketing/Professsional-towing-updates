# Cases Need Updates Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CASES NEED UPDATES WORKFLOW                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ MODULE 1: AUTHENTICATION & NAVIGATION                                    │
│                                                                         │
│ - Automates RDN portal login process                                    │
│ - Navigates to "Case Update Needed Listing"                             │
│ - Applies filters and sorting (oldest updates first)                     │
│ - Selects case and navigates to Updates tab                             │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ MODULE 2: DATA EXTRACTION                                               │
│                                                                         │
│ - Extracts case details (Order Date, Case #, Status)                    │
│ - Extracts vehicle information (VIN, Make, Model)                       │
│ - Extracts all addresses associated with case                           │
│ - Collects complete update history with dates                           │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ MODULE 3: CASES NEED UPDATES                                            │
│                                                                         │
│ - Processes cases that require updates to be posted to the RDN portal   │
│ - Validates case eligibility for updating                               │
│ - Generates and posts appropriate updates based on case data            │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: VALIDATION                                                      │
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────┐  │
│ │ Order Type Check                                                  │  │
│ │ ✓ Must be "Involuntary Repo" or "Investigate Repo"               │  │
│ │ ✗ All other order types → NOT eligible to post                   │  │
│ └───────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│ ┌───────────────────────────────────────────────────────────────────┐  │
│ │ Status Check                                                      │  │
│ │ ✓ Must be "Open"                                                  │  │
│ │ ✗ Any other status → NOT eligible to post                         │  │
│ └───────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│ ┌───────────────────────────────────────────────────────────────────┐  │
│ │ ZIP Code Coverage                                                 │  │
│ │ ✓ At least one address must be in coverage area                   │  │
│ │ ✓ Checks property, debtor and co-debtor addresses                 │  │
│ │ ✗ No addresses in coverage → NOT eligible to post                 │  │
│ └───────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│ ┌───────────────────────────────────────────────────────────────────┐  │
│ │ Client Exclusion Check                                            │  │
│ │ ✓ Client name not in exclusion list                               │  │
│ │ ✗ NOT eligible to post if client is on exclusion list             │  │
│ └───────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│ ┌───────────────────────────────────────────────────────────────────┐  │
│ │ Agent Update Check                                                │  │
│ │ ✓ Must have at least one update with "agent" in author name       │  │
│ │   (only checks latest batch of updates)                           │  │
│ │ ✗ No agent updates → NOT eligible to post                         │  │
│ └───────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│ ┌───────────────────────────────────────────────────────────────────┐  │
│ │ User Update Check                                                 │  │
│ │ ✓ Must have at least one update with "(user)" in author name      │  │
│ │   from authorized user                                            │  │
│ │ ✗ No valid user updates → NOT eligible to post                    │  │
│ └───────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│ ┌───────────────────────────────────────────────────────────────────┐  │
│ │ Keyword Analysis                                                  │  │
│ │                                                                   │  │
│ │ Exclusion keywords (checked in updates):                          │  │
│ │ ✗ "SURRENDER" → Permanently NOT eligible to post                 │  │
│ │ ✗ "DRN" / "DRN HIT" → NOT eligible to post                       │  │
│ │ ✗ "LPR" → NOT eligible to post                                   │  │
│ │ ✗ "GPS" → NOT eligible to post                                   │  │
│ │ ✗ "UNIT SPOTTED" / "FOUND" → NOT eligible to post                │  │
│ │                                                                   │  │
│ │ DRN Exception Rule:                                              │  │
│ │ ✓ If DRN keyword found in an update AND any Agent update was     │  │
│ │   posted after the DRN mention → ALLOW                           │  │
│ └───────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│ ┌───────────────────────────────────────────────────────────────────┐  │
│ │ Auto-skip Decision                                                │  │
│ │ - If validation PASSED → Continue to Template Selection           │  │
│ │ - If NOT eligible to post and Automatic Mode ON:                  │  │
│ │   → Auto-skip after 10-second countdown                           │  │
│ │ - If NOT eligible to post and Automatic Mode OFF:                 │  │
│ │   → Wait for manual user decision                                 │  │
│ └───────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: TEMPLATE SELECTION                                              │
│                                                                         │
│ - Template Category Selection:                                          │
│   • "generic" - For cases with at least one valid address               │
│   • "all-invalid-address" - For cases with no valid addresses           │
│   • Specialized categories for specific scenarios                       │
│                                                                         │
│ - Template Selection Logic:                                             │
│   • Random selection from appropriate category                          │
│   • Templates stored in Supabase 'update_templates' table               │
│   • Only active templates considered for selection                      │
│                                                                         │
│ - Address Alternation:                                                  │
│   • System tracks last used address                                     │
│   • Selects different address than previously used (when possible)      │
│   • Validates address availability and validity                         │
│                                                                         │
│ - Variable Mapping:                                                     │
│   • {address} or {{address}} → Full address from case data              │
│   • {city} or {{city}} → City portion of address                        │
│   • {state} or {{state}} → State portion of address                     │
│   • {zip} or {{zip}} → ZIP code portion of address                      │
│   • {street} or {{street}} → Street address portion                     │
│   • {type} or {{type}} → Address type (property/debtor/etc.)            │
│                                                                         │
│ - Update Timing Restrictions:                                           │
│   • Enforces minimum 2-day interval between updates                     │
│   • Blocks premature updates with countdown to next eligible date       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: UPDATE GENERATION                                               │
│                                                                         │
│ - Update Draft Creation:                                                │
│   • Selects address from available case addresses                       │
│   • Applies address alternation (different from previous update)        │
│   • Replaces template placeholders ({address}, {city}, etc.)            │
│   • Generates professional update text                                  │
│                                                                         │
│ - AI Enhancement via OpenRouter:                                        │
│   • Triggered when agent updates are available                          │
│   • Uses Google Gemma 3 4B model with specific prompts                  │
│   • Combines template with agent observations                           │
│   • Maintains original meaning while using different wording            │
│   • Displayed as optional alternative to template-based draft           │
│                                                                         │
│ - Update Validation:                                                    │
│   • Enforces 2-day minimum between updates (excluding current day)      │
│   • Character count display shows "Characters: X/1500"                  │
│   • Checks if update form is properly filled                            │
│   • Validates that address alternation is followed                      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: UPDATE REVIEW                                                   │
│                                                                         │
│ - Review Interface:                                                     │
│   • Card layout with update preview                                     │
│   • Toggle button to switch between view and edit modes                 │
│   • Character count display showing "{content.length}/1500 characters"  │
│   • Textarea for editing with maxLength={1500} enforcement              │
│                                                                         │
│ - Required Validation:                                                  │
│   • Checkbox: "I have reviewed this update and approve it for submission"│
│   • Content must not be empty                                           │
│   • An address must be selected                                         │
│   • Date validation (prevents posting too soon after last update)       │
│                                                                         │
│ - Navigation Controls:                                                  │
│   • "Back" button to return to previous step                            │
│   • "Request Changes" button to modify the update                       │
│   • "Approve & Submit" button to proceed                                │
│                                                                         │
│ - Auto-Approval (in Automatic Mode):                                    │
│   • 10-second countdown via AutoPostCountdown component                 │
│   • Cancel button allows user to interrupt countdown                    │
│   • Automatically proceeds to submission after countdown                │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: UPDATE SUBMISSION                                               │
│                                                                         │
│ - Form Submission Process:                                              │
│   • Fills RDN form with:                                                │
│     - Agent-Update type (value '36')                                    │
│     - Selected address (with smart address matching)                    │
│     - Update content in comments field                                  │
│   • Clicks Create button to submit form                                 │
│                                                                         │
│ - Retry Mechanism:                                                      │
│   • submitFormWithRetry tries submission up to 3 times                  │
│   • Each attempt uses different strategy:                               │
│     1. Direct click                                                     │
│     2. JavaScript click                                                 │
│     3. Direct function call                                             │
│   • Increasing timeouts between attempts                                │
│                                                                         │
│ - Verification Process:                                                 │
│   • verifyUpdatePosted checks multiple indicators:                      │
│     - Textarea cleared after submission                                 │
│     - Update content found in page                                      │
│     - Success messages detected                                         │
│     - Form reset confirmation                                           │
│                                                                         │
│ - Error Handling & Logging:                                             │
│   • Try/catch blocks around critical operations                         │
│   • Detailed error logging with descriptive messages                    │
│   • Debug information captured on failure (screenshots, form state)     │
│   • All attempts (success/failure) recorded in database                 │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: MANUAL NOTIFICATIONS                                            │
│                                                                         │
│ - Manual Action Checklist:                                              │
│   [ ] "Collector" button clicked                                        │
│   [ ] "Client" button clicked                                           │
│   [ ] "Transferred to Client" button clicked                            │
│                                                                         │
│ - VIN Tracking:                                                         │
│   • Displays VIN in Badge component (hardcoded in current implementation)│
│   • "Copy" button for copying VIN to clipboard                          │
│   • [ ] "VIN logged to hourly progress report" checkbox                 │
│                                                                         │
│ - Completion:                                                           │
│   • "Confirm All Complete →" button advances to final step              │
│   • No form validation enforced in current implementation               │
│   • Simple confirmation that user performed required manual actions     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 7: COMPLETION                                                      │
│                                                                         │
│ - Success Confirmation:                                                 │
│   • Alert box confirming successful case processing                     │
│   • Status badge showing "Completed"                                    │
│                                                                         │
│ - Completion Summary:                                                   │
│   • Case ID (hardcoded as "DEMO-12345" in current implementation)       │
│   • Processing time (hardcoded as "2 minutes 15 seconds")               │
│   • Checklist of completed steps:                                       │
│     - Case validation                                                   │
│     - Manual property verification                                      │
│     - Template selection and application                                │
│     - Update generation and review                                      │
│     - Update submission to RDN                                          │
│     - Notifications sent                                                │
│     - VIN tracking                                                      │
│                                                                         │
│ - Navigation Options:                                                   │
│   • "Return to Dashboard" button - Links to dashboard page              │
│   • "Process Next Case →" button - Reloads page for new case            │
│                                                                         │
│ - Workflow Reset:                                                       │
│   • Clears current case data                                            │
│   • Resets workflow status to "ready"                                   │
│   • Resets step index to 0                                              │
│   • Sets completion flag                                                │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                           NEXT CASE
```

## Future Enhancements

```
┌─────────────────────────────────────────────────────────────────────────┐
│ FUTURE ENHANCEMENTS                                                     │
│                                                                         │
│ 1. QC REPORTING DASHBOARD                                              │
│   - Detailed analytics on rejection reasons:                            │
│     • SURRENDER keyword counts and trends                               │
│     • DRN/LPR/GPS rejection statistics                                  │
│     • ZIP code coverage gaps analysis                                   │
│     • Client-specific rejection patterns                                │
│                                                                         │
│ 2. AUTOMATED PROPERTY TYPE DETECTION                                    │
│   - AI-powered property classification using address data               │
│   - Google Maps API integration for automated verification              │
│                                                                         │
│ 3. ADVANCED TEMPLATE INTELLIGENCE                                       │
│   - Smart template selection based on case history                      │
│   - Client-specific template customization                              │
│   - Performance tracking for template effectiveness                     │
│                                                                         │
│ 4. WORKFLOW OPTIMIZATION                                                │
│   - Reduce manual checkpoints for higher automation                     │
│   - One-click multi-step completion                                     │
│   - Enhanced batch processing capabilities                              │
└─────────────────────────────────────────────────────────────────────────┘
```