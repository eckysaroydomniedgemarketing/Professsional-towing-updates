# Case Processing Page Layout - /case-processing

## Overview
This document provides the simplified MVP/POC page layout for the Case Processing Center using shadcn/ui components. The design follows a split-screen layout with minimal controls on the left and dynamic workflow content on the right.

## Recommended shadcn/ui Components

### Core Layout Components
- **SidebarProvider** & **Sidebar** - For the left control panel structure
- **Card** - For content sections and workflow steps
- **Progress** - For workflow progress indication
- **Button** - For all interactive actions
- **Badge** - For status indicators
- **Separator** - For visual division between sections
- **Alert** - For important messages and warnings
- **Checkbox** - For confirmation steps
- **Select** - For dropdown selections
- **Label** & **Input** - For form fields

### Layout Structure (ASCII)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Header (h-16)                                                                    │
│ ┌──────────────────────────────────────────────────────────────────────────────┐│
│ │ Professional Towing - Case Processing                  [?] [User ▼] [Logout] ││
│ └──────────────────────────────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────────────────────────────┤
│ Main Content (flex h-[calc(100vh-4rem)])                                         │
│ ┌─────────────────────────────────┬──────────────────────────────────────────┐  │
│ │ LEFT PANEL (w-64)              │ RIGHT PANEL (flex-1)                      │  │
│ │ Sidebar Component               │ SidebarInset Component                   │  │
│ │                                 │                                           │  │
│ │ ┌─────────────────────────────┐│ When No Active Case:                     │  │
│ │ │ Card: Workflow Control      ││ ┌────────────────────────────────────┐  │  │
│ │ │                             ││ │ Card: Welcome State                │  │  │
│ │ │ Button (size="lg")          ││ │                                    │  │  │
│ │ │ ┌─────────────────────────┐││ │ ┌──────────────────────────────┐  │  │  │
│ │ │ │   Start Workflow        │││ │ │ CardHeader                   │  │  │  │
│ │ │ └─────────────────────────┘││ │ │ Ready to Process Cases       │  │  │  │
│ │ │                             ││ │ └──────────────────────────────┘  │  │  │
│ │ │ Badge (variant="outline")   ││ │                                    │  │  │
│ │ │ Status: Ready               ││ │ ┌──────────────────────────────┐  │  │  │
│ │ │                             ││ │ │ CardContent                  │  │  │  │
│ │ │ Current Case:               ││ │ │                              │  │  │  │
│ │ │ Text (muted)                ││ │ │ Click "Start Workflow" to    │  │  │  │
│ │ │ None                        ││ │ │ begin processing cases from  │  │  │  │
│ │ └─────────────────────────────┘│ │ │ the RDN portal.             │  │  │  │
│ │                                 │ │ │                              │  │  │  │
│ │ Separator                       │ │ └──────────────────────────────┘  │  │  │
│ │                                 │ └────────────────────────────────────┘  │  │
│ │ ┌─────────────────────────────┐│                                           │  │
│ │ │ Card: Workflow Actions      ││ When Case Active:                        │  │
│ │ │                             ││ ┌────────────────────────────────────┐  │  │
│ │ │ Button (variant="outline")  ││ │ Progress Component                 │  │  │
│ │ │ disabled when no case       ││ │ [●][●][●][○][○][○][○][○] Step 3/8 │  │  │
│ │ │ [Pause Workflow]            ││ └────────────────────────────────────┘  │  │
│ │ │                             ││                                           │  │
│ │ │ Button (variant="destructive")│ ┌────────────────────────────────────┐  │  │
│ │ │ disabled when no case       ││ │ Card: Current Step Content         │  │  │
│ │ │ [Stop & Exit]              ││ │                                    │  │  │
│ │ └─────────────────────────────┘│ │ ┌──────────────────────────────┐  │  │  │
│ │                                 │ │ │ CardHeader                   │  │  │  │
│ │ Separator                       │ │ │ Step 3: Template Selection   │  │  │  │
│ │                                 │ │ └──────────────────────────────┘  │  │  │
│ │ ┌─────────────────────────────┐│ │                                    │  │  │
│ │ │ Card: Help                  ││ │ ┌──────────────────────────────┐  │  │  │
│ │ │                             ││ │ │ CardContent                  │  │  │  │
│ │ │ Button (variant="ghost")    ││ │ │                              │  │  │  │
│ │ │ size="sm"                   ││ │ │ (Dynamic content based on    │  │  │  │
│ │ │ [View Documentation]        ││ │ │  current workflow step)      │  │  │  │
│ │ │                             ││ │ │                              │  │  │  │
│ │ │ Button (variant="ghost")    ││ │ └──────────────────────────────┘  │  │  │
│ │ │ size="sm"                   ││ │                                    │  │  │
│ │ │ [Keyboard Shortcuts]        ││ │ ┌──────────────────────────────┐  │  │  │
│ │ └─────────────────────────────┘│ │ │ CardFooter                   │  │  │  │
│ │                                 │ │ │ [← Previous] [Skip] [Next →]│  │  │  │
│ │                                 │ │ └──────────────────────────────┘  │  │  │
│ │                                 │ └────────────────────────────────────┘  │  │
│ └─────────────────────────────────┴──────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Component Specifications

### Header
```typescript
// Uses existing app header component
<header className="h-16 border-b bg-background">
  <div className="flex h-full items-center justify-between px-4">
    <h1 className="text-lg font-semibold">Professional Towing - Case Processing Center</h1>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon">?</Button>
      <UserMenu />
    </div>
  </div>
</header>
```

### Left Panel - Control Sidebar
```typescript
<SidebarProvider defaultOpen={true}>
  <Sidebar className="w-64 border-r">
    {/* Workflow Control Card */}
    <Card className="m-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Workflow Control</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          size="lg" 
          className="w-full"
          onClick={handleStartWorkflow}
        >
          Start Workflow
        </Button>
        
        <div className="space-y-1">
          <Badge variant="outline" className="w-full justify-center">
            Status: {workflowStatus}
          </Badge>
          <div className="text-sm text-muted-foreground">
            Current Case: {currentCase || 'None'}
          </div>
        </div>
      </CardContent>
    </Card>

    <Separator className="mx-4" />

    {/* Workflow Actions Card */}
    <Card className="m-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          variant="outline" 
          className="w-full"
          disabled={!currentCase}
        >
          Pause Workflow
        </Button>
        <Button 
          variant="destructive" 
          className="w-full"
          disabled={!currentCase}
        >
          Stop & Exit
        </Button>
      </CardContent>
    </Card>

    <Separator className="mx-4" />

    {/* Help Card */}
    <Card className="m-4">
      <CardContent className="pt-6 space-y-2">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          View Documentation
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          Keyboard Shortcuts
        </Button>
      </CardContent>
    </Card>
  </Sidebar>
</SidebarProvider>
```

### Right Panel - Workflow Area
```typescript
<SidebarInset className="flex flex-col">
  {currentCase ? (
    <>
      {/* Progress Indicator - Only shown when case is active */}
      <div className="p-4 border-b">
        <Progress value={(currentStep / 8) * 100} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">
          Step {currentStep} of 8
        </p>
      </div>

      {/* Dynamic Step Content */}
      <div className="flex-1 p-6">
        {renderCurrentStep()} {/* Renders appropriate step component */}
      </div>
    </>
  ) : (
    /* Welcome State - No active case */
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Ready to Process Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Click "Start Workflow" to begin processing cases from the RDN portal.
          </p>
        </CardContent>
      </Card>
    </div>
  )}
</SidebarInset>
```

### Example Step Content (Template Selection)
```typescript
function TemplateSelectionStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Template Selection</CardTitle>
        <CardDescription>
          Choose the appropriate template for this case
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Previous template used: Template A
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <Label>Select Template</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Choose template..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="b">Template B - Multi-Family</SelectItem>
              <SelectItem value="c">Template C - Commercial</SelectItem>
              <SelectItem value="d">Template D - Apartment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="review" />
          <Label htmlFor="review">
            I have reviewed the selected template
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">← Previous</Button>
        <Button variant="ghost">Skip</Button>
        <Button>Continue →</Button>
      </CardFooter>
    </Card>
  );
}
```

## Theme Application

Following `/docs/theme-guide.md`:
- Primary buttons use `bg-primary` (blue theme)
- Secondary elements use `bg-secondary`
- Muted text uses `text-muted-foreground`
- Cards use default background with borders
- Destructive actions use `bg-destructive`

## Responsive Considerations (Future Enhancement)

For MVP, focus on desktop (1280px+). The layout uses:
- Fixed sidebar width (w-80 = 320px)
- Flexible right panel (flex-1)
- Minimum viewport width: 1024px

## State Management

```typescript
interface CaseProcessingState {
  // Workflow State
  workflowStatus: 'ready' | 'running' | 'paused' | 'stopped'
  currentCase: string | null
  currentStep: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8  // 0 = no active case
  
  // Step Data
  stepData: {
    validation?: ValidationResult
    propertyVerification?: PropertyData
    templateSelection?: string
    generatedUpdate?: string
    reviewApproval?: boolean
    submissionResult?: boolean
    notificationComplete?: boolean
  }
}
```

## Workflow Integration

When "Start Workflow" is clicked:
1. Calls Module 1 API to start RDN portal automation
2. Module 1 navigates to case listing and gets first case
3. Module 2 extracts case data
4. Control returns to this page with case data
5. Workflow steps begin in right panel

## Benefits of This Simplified Layout

1. **Minimal MVP approach** - No statistics or complex features
2. **Single workflow focus** - One case at a time
3. **Clear integration point** - Start Workflow connects to Module 1
4. **All shadcn/ui components** - No custom components needed
5. **Simple state management** - Just workflow status and current step
6. **Quick to build** - Can be implemented rapidly with copy/paste components

## Key Simplifications for MVP

- Removed all statistics tracking
- No case queue or batch processing
- Single "Start Workflow" button to initiate
- Minimal controls (Start, Pause, Stop)
- Focus on core workflow steps only
- Clean welcome state when no case active