# Module 3: Update History Text Analysis Implementation Plan

## Overview
Two-step validation process:
1. Agent Update Check - Ensures case has agent updates before processing
2. Exclusion Keyword Detection - AI-powered check using OpenRouter API (Google Gemma model)

Cases must pass both validations to be eligible for new updates.

## Current Status ✅

### Completed Implementation

#### 1. Agent Update Validation (NEW)
- **Service**: `agent-update-validation.service.ts`
- **Method**: `checkAgentUpdateExists(caseId)`
- **Features**:
  - Batch clustering (5-minute window) to identify latest extraction
  - Flexible pattern matching for agent update variations
  - Handles "(O)Agent-Update", "Agent Update", etc.
  - Returns count, types, and batch statistics

#### 2. Integration Points
- **Case Validation Service**: Integrated agent update check
- **Validation UI**: Shows agent update status with details
- **Test Route**: Rejects cases without agent updates immediately

#### 3. OpenRouter Service
- **File**: `openrouter.service.ts`
- API integration with Google Gemma model
- Markdown JSON extraction
- Multiple JSON handling (takes first object)
- Error fallback to safe defaults

#### 4. Field Mapping
- Database field: `update_content` (not `details`)
- Test route: Correctly extracts from Supabase
- Fallback to sample data when empty

#### 5. Prompt Engineering
- Clear keyword definitions with variations
- Negative context exclusion (not found, not spotted)
- Explicit non-keywords list (Address Appears Occupied)
- Single JSON response instruction

## Exclusion Keywords

| Keyword | Variations | Detection Status |
|---------|------------|------------------|
| **DRN** | DRN hit, DRN located, DRN system | ✅ Working |
| **LPR** | LPR scan, license plate reader | ✅ Working |
| **GPS** | GPS tracking, tracked by GPS | ✅ Working |
| **SURRENDER** | voluntary surrender, unit surrendered | ✅ Working |
| **UNIT SPOTTED** | unit spotted, vehicle found (positive only) | ✅ Working |

## API Response Handling

### What We Send
```javascript
{
  messages: [{
    role: 'user',
    content: [{
      type: 'text',
      text: '[prompt with updates]'
    }]
  }]
}
```

### What We Get (Current)
- Single or multiple JSON objects in markdown
- Extracted via regex: `/```json\s*([\s\S]*?)\s*```/`
- If multiple JSONs, takes first one
- Fallback parsing for malformed responses

### Test Results
- ✅ Cases with DRN/LPR: Correctly detected
- ✅ Cases without keywords: Returns false
- ✅ Negative contexts: Properly ignored
- ✅ Non-keywords: "Address Appears Occupied" ignored

## Validation Flow

### Step 1: Agent Update Check
- **Check**: At least one update with `update_type` containing "agent" and "update"
- **Pass**: Continue to exclusion keyword check
- **Fail**: Reject case immediately - "No agent updates found"

### Step 2: Exclusion Keyword Check  
- **Check**: OpenRouter AI analyzes updates for exclusion keywords
- **Pass**: Case eligible for processing
- **Fail**: Block case - "Exclusion keywords found"

## Integration Points

### FROM Module 2
- Case updates in `case_update_history.update_content`
- Update types in `case_update_history.update_type`
- Passed via case ID

### TO Property Verification
- Both validations must pass
- `hasAgentUpdate: false` → Block case (no agent updates)
- `hasExclusionKeyword: true` → Block case (keywords found)
- Both pass → Continue to property verification

## Testing Endpoint
```
http://localhost:3000/api/test-openrouter?caseId={caseId}
```

## Known Behaviors (MVP Acceptable)
1. AI may return multiple JSONs - parser handles it
2. Markdown wrapping expected - extraction works
3. API errors default to false - non-blocking

## Files Modified
- `/src/modules/case-processing/services/openrouter.service.ts`
- `/src/app/api/test-openrouter/route.ts`
- `/src/modules/case-processing/services/supabase-case.service.ts`

## Implementation Status
- [x] Agent Update Validation Service
- [x] Supabase integration with batch clustering
- [x] Case Validation Service integration
- [x] Validation UI showing agent updates
- [x] Test route with agent update rejection
- [x] OpenRouter exclusion keyword detection
- [x] Documentation updated
- [ ] Full workflow integration
- [ ] User confirmation checkbox