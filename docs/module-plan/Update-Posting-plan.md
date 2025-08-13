# Update Posting Implementation Plan

## Current Workflow Context

**FROM Module 2 (Data Extraction):**
- RDN portal is already open on case page
- Browser automation is active (using Puppeteer/Playwright)
- Case data has been extracted

**Current Position (Module 3 - Update Assistant):**
- User has selected an address
- Template is auto-selected  
- Draft is generated
- Ready to post via browser automation

## Task List for Implementation

### Task 1: Create Browser Automation Service
**File:** `src/modules/case-processing/services/update-poster.service.ts`
- Implement postUpdate function using Puppeteer/Playwright
- Select Type dropdown: "(O) Agent-Update" 
- Select Address dropdown: matching address
- Fill Details textarea: draft content
- Click Create button
- Verify submission

### Task 2: Update Browser Manager Integration
**File:** `src/modules/module-1-rdn-portal/services/browser-manager.service.ts`
- Add method to get current page instance
- Ensure page is accessible for update posting

### Task 3: Modify UpdateAssistant Component
**File:** `src/modules/case-processing/components/update-assistant/index.tsx`
- Call update-poster service from handlePostUpdate
- Show alert with result
- Handle success/error states

## Detailed Implementation Flow

```
1. User clicks "Post Update"
   ↓
2. Get browser page instance from Module 1
   ↓
3. Select Type Dropdown:
   - Find #updates_type
   - Select value "36" for "(O) Agent-Update"
   ↓
4. Select Address Dropdown:
   - Find #is_address_update_select
   - Match selected address with dropdown options
   - Select matching option
   ↓
5. Fill Details Textarea:
   - Clear #comments textarea
   - Type draft content
   ↓
6. Click Create Button:
   - Find #create_button
   - Click to submit
   ↓
7. Verify Submission:
   - Check if textarea cleared
   - Wait for success indicators
   ↓
8. Show Alert:
   - Success: "✓ Update posted successfully!"
   - Error: "✗ Failed to post update"
```

## Key Form Fields (from RDN HTML)

```typescript
// Form element IDs and values:
1. Type: #updates_type → value="36" // (O) Agent-Update
2. Address: #is_address_update_select → match address value
3. Details: #comments → draft content
4. Submit: #create_button → click to post
```

## Implementation Details

### 1. New File: `src/modules/case-processing/services/update-poster.service.ts`

```typescript
export async function postUpdateToRDN(
  page: any, // Puppeteer/Playwright page
  caseId: string,
  updateInfo: {
    message: string,
    selectedAddress: string
  }
): Promise<boolean> {
  // 1. Select Type dropdown - "(O) Agent-Update"
  await page.selectOption('#updates_type', '36')
  
  // 2. Select Address dropdown
  await selectAddressDropdown(page, updateInfo.selectedAddress)
  
  // 3. Fill Details textarea
  await fillDetailsTextarea(page, updateInfo.message)
  
  // 4. Click Create button
  await clickCreateButton(page)
  
  // 5. Verify submission
  return await verifySubmission(page)
}
```

### 2. Address Matching Logic

```typescript
async function selectAddressDropdown(page: any, selectedAddress: string) {
  // Get all dropdown options
  const options = await page.evaluate(() => {
    const select = document.querySelector('#is_address_update_select')
    return Array.from(select.options).map(opt => ({
      value: opt.value,
      text: opt.textContent.trim()
    }))
  })
  
  // Find matching address (exact or partial)
  const match = findMatchingAddress(options, selectedAddress)
  
  // Select the matching option
  if (match) {
    await page.selectOption('#is_address_update_select', match.value)
  }
}
```

### 3. Update Component Handler

```typescript
const handlePostUpdate = async () => {
  setIsPosting(true)
  setAlertMessage(null)
  
  try {
    // Get page from browser manager
    const page = await getBrowserPage()
    
    // Post update via automation
    const success = await postUpdateToRDN(page, caseData.id, {
      message: draftContent,
      selectedAddress: selectedAddress.full_address
    })
    
    // Show result
    if (success) {
      setAlertMessage({ 
        type: 'success', 
        message: '✓ Update posted successfully to RDN portal!' 
      })
    } else {
      throw new Error('Failed to post update')
    }
  } catch (error) {
    setAlertMessage({ 
      type: 'error', 
      message: '✗ Failed to post update. Please try manually.' 
    })
  } finally {
    setIsPosting(false)
  }
}
```

## Complete Form Filling Sequence

1. **Type Dropdown** (#updates_type)
   - Value: "36" 
   - Text: "(O) Agent-Update"

2. **Priority** (optional - use default)
   - Keep as "Default"

3. **Address Dropdown** (#is_address_update_select)
   - Match with selected address from our app
   - Select corresponding value

4. **Details Textarea** (#comments)
   - Clear existing content
   - Type draft content

5. **Create Button** (#create_button)
   - Click to submit

## MVP Simplifications

1. **Always use "(O) Agent-Update"** type - no other options
2. **Skip priority** - use default value
3. **Simple address matching** - partial match is OK
4. **No retry logic** - single attempt
5. **Basic verification** - just check textarea cleared

## Success Criteria

1. Type dropdown set to "(O) Agent-Update"
2. Address dropdown correctly selected
3. Draft content filled in Details
4. Create button clicked successfully
5. Update posted to RDN portal
6. User sees clear feedback

## Transition Points

**Entry:**
- Browser on RDN case page (from Module 2)
- Draft ready with selected address

**Process:**
- Automated form filling
- All 4 fields filled correctly
- Form submitted

**Exit:**
- Update posted successfully
- Alert shown to user
- User manually proceeds as needed

## Reference Code Location

- Reference implementation: `/docs/Refer Code/UpdatePoster.js`
- Contains detailed logic for:
  - Address matching algorithms
  - Multiple click strategies
  - Submission verification methods
  - Error handling patterns

## Notes

- This is an MVP/POC implementation
- Keep code simple and under 500 lines per file
- Use existing shadcn/ui components only
- No custom components or classes
- Focus on core functionality only