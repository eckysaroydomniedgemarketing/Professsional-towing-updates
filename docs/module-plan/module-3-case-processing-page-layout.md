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
│ │ │ • Separator                 ││ STATE 2: Modules Running                 │ │   - Address 3                       ││  │
│ │ │ • Switch: Automatic Mode    ││ ┌────────────────────────────────────┐  │ │                                     ││  │
│ │ └─────────────────────────────┘│ │ WorkflowControl                    │  │ │ • Last Update Details:              ││  │
│ │                                 │ │ (Module 1 & 2 automation)          │  │ │   - Used Address: [address]         ││  │
│ │ ┌─────────────────────────────┐│ └────────────────────────────────────┘  │ │   - Used Template: [template name]  ││  │
│ │ │ Card: Current Status        ││                                           │ │     (from Supabase templates table) ││  │
│ │ │ • Status Badge              ││ STATE 3: Case Active                     │ │                                     ││  │
│ │ │ • Case #                    ││ ┌────────────────────────────────────┐  │ │ • Draft Section:                    ││  │
│ │ │ • Step (1 of 8)             ││ │ ValidationStep Component           │  │ │   - Selected Address: [dropdown]    ││  │
│ │ │ • Progress 12%              ││ │ • Progress indicator               │  │ │   - Selected Template: [dropdown]   ││  │
│ │ └─────────────────────────────┘│ │ • Case data display                │  │ │   - Draft Preview: [text area]      ││  │
│ │                                 │ │ • Validation checks                │  │ │                                     ││  │
│ │ ┌─────────────────────────────┐│ │ • Update History Analysis Table:   │  │ │ • Action Buttons:                   ││  │
│ │ │ Card: Controls              ││ │   ┌──────────────────────────────┐ │  │ │   [Skip]  [Post Update]             ││  │
│ │ │ • Button: ⏸ Pause          ││ │   │ Update# | Author | Type |... │ │  │ └─────────────────────────────────────┘│  │
│ │ │ • Button: ⏹ Stop           ││ │   │ #12 | Agent | Agent-Update... │ │  │                                         │  │
│ │ └─────────────────────────────┘│ │   │ #11 | System | Client Note... │ │  │                                         │  │
│ │                                 │ │   └──────────────────────────────┘ │  │                                         │  │
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