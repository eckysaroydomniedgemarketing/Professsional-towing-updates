# Module 4: Agent Update Visibility Manager - Page Layout

## Page: `/agent-updates-visibility`

## Component Selection
Based on shadcn/ui components, the following are recommended for optimal UX:

### Primary Components:
- **Card** - Main container for each section
- **Button** - Start/Stop workflow, Next Case, Export actions
- **Switch** - Manual/Automatic mode toggle
- **Badge** - Status indicators (Running, Idle, Error)
- **Alert** - Important notifications and errors
- **Table** - Report display
- **Progress** - Processing progress indicator

### Supporting Components:
- **Skeleton** - Loading states
- **Tooltip** - Help text for controls
- **Separator** - Visual section dividers

## Page Layout (ASCII)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                          Agent Update Visibility Manager                       │
│                                                                                │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │  [Card: Workflow Control]                                                │ │
│  │                                                                           │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐ │
│  │  │ [Button: Primary]    │  │ [Switch + Label]    │  │ [Badge: Status]  │ │
│  │  │ ▶ Start Processing   │  │ ○ Manual ● Automatic│  │ ● Idle           │ │
│  │  └─────────────────────┘  └─────────────────────┘  └──────────────────┘ │
│  │                                                                           │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │  [Card: Current Processing]                                              │ │
│  │                                                                           │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │ │
│  │  │ [Alert: Info]                                                      │  │ │
│  │  │ Currently Processing: Case #2174402343                             │  │ │
│  │  │ Updates Found: 3 | Updates Processed: 1                           │  │ │
│  │  └────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                           │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                       │ │
│  │  │ [Button: Default]    │  │ [Progress Bar]      │                       │ │
│  │  │ Next Case →          │  │ ████████░░░░░░░░░░░ │ 40%                  │ │
│  │  └─────────────────────┘  └─────────────────────┘                       │ │
│  │                                                                           │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │  [Card: Today's Statistics]                                              │ │
│  │                                                                           │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │ [Badge]  │  │ [Badge]  │  │ [Badge]  │  │ [Badge]  │  │ [Badge]  │  │ │
│  │  │ Cases: 15│  │ Updates: │  │ Manual: 8│  │ Auto: 7  │  │ Skipped: │  │ │
│  │  │          │  │    45    │  │          │  │          │  │    2     │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  │                                                                           │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │  [Card: Processing Report]                                               │ │
│  │                                                                           │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │ │
│  │  │                        [Table Header]                               │  │ │
│  │  │ ┌──────────────┬──────────┬──────────────┬──────────────────┐   │  │ │
│  │  │ │ Date (IST)   │ Case ID  │   Updates    │     Status       │   │  │ │
│  │  │ ├──────────────┼──────────┼──────────────┼──────────────────┤   │  │ │
│  │  │ │ 2024-01-15   │ 21744023 │      3       │    Processed     │   │  │ │
│  │  │ ├──────────────┼──────────┼──────────────┼──────────────────┤   │  │ │
│  │  │ │ 2024-01-15   │ 21744024 │      0       │     Skipped      │   │  │ │
│  │  │ ├──────────────┼──────────┼──────────────┼──────────────────┤   │  │ │
│  │  │ │ 2024-01-15   │ 21744025 │      5       │    Processed     │   │  │ │
│  │  │ └──────────────┴──────────┴──────────────┴──────────────────┘   │  │ │
│  │  └────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                           │ │
│  │  ┌─────────────────────┐                                                 │ │
│  │  │ [Button: Secondary]  │                                                 │ │
│  │  │ 📥 Export to CSV     │                                                 │ │
│  │  └─────────────────────┘                                                 │ │
│  │                                                                           │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Layout Sections Breakdown

### 1. Header
- Simple title: "Agent Update Visibility Manager"
- Clean, professional appearance

### 2. Workflow Control Card
- **Start/Stop Button**: Primary button, changes based on state
  - "Start Processing" when idle
  - "Stop Processing" when running (becomes destructive variant)
- **Mode Toggle**: Switch component with labels
  - Manual (default) / Automatic
  - Disabled while workflow is running
- **Status Badge**: Shows current state
  - Colors: Green (Idle), Blue (Processing), Red (Error), Gray (Completed)

### 3. Current Processing Card
- **Alert Component**: Info variant showing current case details
- **Next Case Button**: Only visible in manual mode
- **Progress Bar**: Shows overall progress or current case progress

### 4. Statistics Card
- **Badge Components**: Display key metrics
- Horizontal layout for quick scanning
- Real-time updates when using subscriptions

### 5. Report Card
- **Table Component**: Responsive data table
- **Export Button**: Secondary variant with icon
- Scrollable if many entries

## Responsive Design Considerations

### Mobile (< 768px)
- Stack all cards vertically
- Statistics badges wrap to 2x3 grid
- Table becomes horizontally scrollable
- Buttons full width

### Tablet (768px - 1024px)
- Maintain single column layout
- Statistics remain horizontal
- Table responsive

### Desktop (> 1024px)
- As shown in ASCII diagram
- Optimal spacing and readability

## Component States

### Loading States
- Use Skeleton components while fetching data
- Disable buttons during operations
- Show spinner in processing button

### Error States
- Alert component with destructive variant
- Clear error messages
- Retry options where applicable

### Empty States
- Friendly message when no data
- Clear call-to-action to start processing

## Theme Application
Following `/docs/theme-guide.md`:
- Primary buttons: `bg-primary` (Professional blue)
- Cards: `bg-card` with `border` 
- Status badges: Semantic colors
- Table: Alternating row colors with `bg-muted`
- Dark mode: Automatic theme switching support

## Accessibility
- Proper ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators on all buttons and switches
- Screen reader friendly table structure

## Implementation Priority (MVP)
1. **Essential**: Workflow Control, Current Processing
2. **Important**: Report Table, Export
3. **Nice-to-have**: Statistics, Progress indicators

This layout provides a clean, functional interface that follows shadcn/ui best practices while maintaining simplicity for MVP/POC requirements.