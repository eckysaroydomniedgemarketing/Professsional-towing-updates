# Case Processing Page Layout - /case-processing

## Layout Structure (ASCII)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ AppLayout (Header h-16)                                                                                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ CaseProcessingLayout (flex h-[calc(100vh-4rem)])                                                                           │
│ ┌─────────────────────────────────┬──────────────────────────────────────────┬─────────────────────────────────────────┐  │
│ │ WorkflowSidebar (w-64)         │ SidebarInset (flex-1)                    │ NEW Right Sidebar (flex-2)              │  │
│ │                                 │                                           │ (Shows ONLY when User Update exists)   │  │
│ │ ┌─────────────────────────────┐│ STATE 1: No Active Case                  │                                         │  │
│ │ │ Card: Workflow Control      ││ ┌────────────────────────────────────┐  │ ┌─────────────────────────────────────┐│  │
│ │ │ • Button: Post Case Update/ ││ │ Card: Welcome State                │  │ │ Update Assistant                    ││  │
│ │ │   Post Next Update          ││ │ • CardHeader                       │  │ │                                     ││  │
│ │ │ • Separator: --- OR ---     ││ │ • CardContent                      │  │ │ • Address Details List:             ││  │
│ │ │ • Input: Enter Case ID      ││ └────────────────────────────────────┘  │ │   - Address 1                       ││  │
│ │ │ • Button: Load Case         ││                                           │ │   - Address 2                       ││  │
│ │ │   (Navigates to RDN portal) ││ STATE 2: Modules Running                 │ │   - Address 3                       ││  │
│ │ │ • Separator                 ││ ┌────────────────────────────────────┐  │ │                                     ││  │
│ │ │ • Switch: Automatic Mode 🔄  ││ │ WorkflowControl                    │  │ │ • Last Update Details:              ││  │
│ │ │   (Auto-skip rejected: ON)  ││ │ (Module 1 & 2 automation)          │  │ │   - Address: [full address]         ││  │
│ │ └─────────────────────────────┘│ └────────────────────────────────────┘  │ │   - Address Type: [type]            ││  │
│ │                                 │                                           │ │   - Template: [template name]       ││  │
│ │ ┌─────────────────────────────┐│                                           │ │     (from Supabase templates table) ││  │
│ │ │ Card: Current Status        ││ STATE 3: Case Active                     │ │                                     ││  │
│ │ │ • Status Badge              ││ ┌────────────────────────────────────┐  │ │ • Draft Section:                    ││  │
│ │ │ • Case #                    ││ │ ValidationStep Component           │  │ │   - Selected Address: [dropdown]    ││  │
│ │ │ • Step (1 of 8)             ││ │ • Progress indicator               │  │ │   - Selected Template: [dropdown]   ││  │
│ │ │ • Mode: [Manual/Automatic]  ││ │ • Case data display                │  │ │   - Draft Preview: [text area]      ││  │
│ │ │ • Progress 12%              ││ │ • Validation checks                │  │ │                                     ││  │
│ │ └─────────────────────────────┘│ │ • ⏱ Auto-skip in: 2s (when rejected)│  │ │ • Action Buttons:                   ││  │
│ │                                 │ │ • Update History Analysis Table:   │  │ │   [Skip]  [Post Update]             ││  │
│ │ ┌─────────────────────────────┐│ │   ┌──────────────────────────────┐ │  │ └─────────────────────────────────────┘│  │
│ │ │ Card: Controls              ││ │   │ Update# | Author | Type |... │ │  │                                         │  │
│ │ │ • Button: ⏸ Pause          ││ │   │ #12 | Agent | Agent-Update... │ │  │                                         │  │
│ │ │ • Button: ⏹ Stop           ││ │   │ #11 | System | Client Note... │ │  │                                         │  │
│ │ └─────────────────────────────┘│ │   └──────────────────────────────┘ │  │                                         │  │
│ │                                 │ │ • User Update Check (NEW):         │  │                                         │  │
│ │                                 │ │   ┌──────────────────────────────┐ │  │                                         │  │
│ │                                 │ │   │ ✓ or ✗ Status Message       │ │  │                                         │  │
│ │                                 │ │   │ Found X user updates from:  │ │  │                                         │  │
│ │                                 │ │   │ - Author Name (User)         │ │  │                                         │  │
│ │                                 │ │   └──────────────────────────────┘ │  │                                         │  │
│ │                                 │ │ • Navigation buttons               │  │                                         │  │
│ │                                 │ └────────────────────────────────────┘  │                                         │  │
│ │                                 │                                           │                                         │  │
│ │                                 │ Note: Component changes dynamically   │                                         │  │
│ │                                 │ based on current step (1-8)           │                                         │  │
│ │                                 │                                           │                                         │  │
│ └─────────────────────────────────┴──────────────────────────────────────────┴─────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Additional States

### STATE 1.5: Loading Manual Case (NEW)
```
│ STATE 1.5: Loading Manual Case                 │
│ ┌────────────────────────────────────┐        │
│ │ WorkflowControl                    │        │
│ │ • Loading case ID: XXXXXXXXX       │        │
│ │ • Navigating to RDN portal...      │        │
│ │ • Status: Logging in...            │        │
│ └────────────────────────────────────┘        │
```

### STATE 3b: Case Rejected with Auto-Skip (NEW)
```
│ STATE 3b: Case Rejected (Automatic Mode ON)    │
│ ┌────────────────────────────────────┐        │
│ │ ValidationStep Component           │        │
│ │ • ❌ Case Rejected                 │        │
│ │ • Reasons:                         │        │
│ │   - Invalid Order Type             │        │
│ │   - ZIP code not covered           │        │
│ │ ┌──────────────────────────────┐  │        │
│ │ │ ⏱ Auto-skipping in: 2...     │  │        │
│ │ │ Loading next case...          │  │        │
│ │ └──────────────────────────────┘  │        │
│ │ • Navigation buttons disabled      │        │
│ └────────────────────────────────────┘        │
```

## Component File Structure Updates

### Sidebar Components (Split into 5 files)
```
/src/components/ui/sidebar/
├── index.tsx                  # Main export (maintains backward compatibility)
├── sidebar-container.tsx      # Container component
├── sidebar-content.tsx        # Content wrapper
├── sidebar-footer.tsx         # Footer section
└── sidebar-header.tsx         # Header section
```

### Validation Step Components (Split)
```
/src/modules/case-processing/components/workflow-steps/
├── validation-step.tsx                    # Main validation orchestrator (542 lines)
├── validation-step/
│   ├── case-data-display.tsx             # Case information display
│   ├── validation-checks.tsx             # Validation criteria checks
│   ├── update-history-analysis.tsx       # Update history table
│   ├── user-update-check.tsx             # User update detection
│   └── auto-skip-countdown.tsx           # Countdown timer component
```

## Key UI Behavior Changes

### 1. Automatic Mode Toggle
- Located in WorkflowSidebar under manual case input
- When ON: Rejected cases auto-skip after 2 seconds
- When OFF: Manual review required for all cases
- Visual indicator shows current mode in Status Card

### 2. Manual Case Input
- "Load Case" button triggers Module 1 navigation
- Does NOT fetch from database first
- Shows loading state while navigating to RDN portal
- Direct navigation to: `/alpha_rdn/module/default/case2/?tab=6&case_id={caseId}`

### 3. Address Display Order (Update Assistant)
- Address shown first
- Address Type shown below address
- Template name displayed last

### 4. Auto-Skip Countdown
- Only visible when Automatic Mode is ON AND case is rejected
- Shows 2-second countdown with visual timer
- Navigation buttons disabled during countdown
- Automatically loads next case after countdown