Module Name: Agent Update Visibility Manager
Module Description: (agents) with updates marked as "invisible" - mark them visible. This module does not need data extraction or module 2 or 3.

## Prerequisites
- Module 1 (RDN Portal Auth) must be functional
- User must have valid RDN credentials
- Supabase table `agent_update_visibility_log` created

## Key Business Logic
- Process only updates authored by "(Agent)" from "Professional Towing and Recovery, LLC"
- Company validation uses flexible matching (regex pattern: `/professional\s+towing/i`)
- Convert "Not Visible" updates to "Visible" only for matching company
- Track all processed cases for reporting with company name
- Cases with no matching agent updates are logged with updates_made_visible = 0
- Store both company name and update text in database for audit trail 
    
 
Navigation Process:
 
 
1. on our site, need a page where we will need a button that triggers this process 
   Page URL: /agent-updates-visibility
2. after clicking the button - RDN login session should start if user is not logged in 
   refer to module # 1 
   user will be on this page on RDN if login is successful: https://app.recoverydatabase.net/main_frame.php
3. after successful login redirect to https://app.recoverydatabase.net/v2/main/new_updates.php?case_worker=ALL&order=priority&type=ALL&days_since_update=all&case_status%5B%5D=Open and you will be on the new updates page. html source code is in /html-source-code/new-updates.txt

4. Complete the following actions in order :
   4.1 - This page has multiple cases. one case per row. just work on the first row. 

    4.2 click on the button = view case and remove from the list (removes from new updates list only, does not delete case)
        field name = View Case And Remove From List
        Outer html code =   <a class="btn btn-secondary js-remove-new" data-id="4335840695" target="case2174402343" href="/alpha_rdn/module/default/case2/?tab=6&amp;case_id=2174402343">
                        View Case And Remove From List
                    </a>
        This will open a case in a new tab - please take a note of this - 
        url in a new tab will be in this format -  /alpha_rdn/module/default/case2/?tab=6&amp;case_id={case id}
 
5   On this page /alpha_rdn/module/default/case2/?tab=6&amp;case_id={case id} - 
    html source code of this page is in /docs/html-source-code/case-updates.txt
    5.1 - go to the pagination and click all 
        field name = ALL
        Outer html code =   <li class="page-item active">
						<a href="#" class="page-link" data-page="ALL">ALL</a>
					</li>
    
        keep dynamic page loading; meaning wait till page loads. but in case minimum page loading time should be 30 seconds. 
    5.2 - on this page there are multiple updates. Each update has Last Updated By and Company
            field name = Last Updated By
            Outer html code =  <dt>Last Updated By</dt>
            Example: <dd>Austin Serrano (Agent)</dd>
            
            Company field extraction:
            - Located in update metadata section
            - Pattern: "Updates by agents from 'Company Name'"
            - Example: "Updates by agents from 'Professional Towing and Recovery, LLC'"
            
    5.3 - Check if update meets BOTH conditions:
          a) Last Updated By contains "(Agent)"
          b) Company matches "Professional Towing and Recovery" (using flexible regex)
             - Accepts variations: "Professional Towing", "professional towing and recovery", etc.
             - Pattern: `/professional\s+towing/i` (case-insensitive)
          
    5.4 - If BOTH conditions are met AND Not Visible is present, then click on NOT Visible
            field name = Not Visible 
            Outer html code =  <button class="btn btn-link js-remove-on-delete js-visible text-danger" onclick="toggleVisibleUpdate(4335837625);">
									<svg class="svg-inline--fa fa-check fa-w-16" aria-hidden="true" id="isvisibleicon_4335837625" data-active="active" focusable="false" data-prefix="fas" data-icon="check" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path></svg><!-- <span class="fas fa-check" aria-hidden="true" id="isvisibleicon_4335837625" data-active="active"></span> Font Awesome fontawesome.com -->
									<span id="visiblestate_4335837625">Not Visible</span>
								</button>
    5.5 - when clicked on NOT visible - it will open modal with id="formModal"
    5.6 - click on continue button 
            field name = Continue 
            Outer html code =  <button class="btn btn-warning" type="button" onclick="togglePostVisibleUpdate(4335837625);">Continue</button>
    5.7 - This will show "Visible" for the same update 
        -  field name = Visible 
        -  Outer html code =  <button class="btn btn-link text-success js-remove-on-delete js-visible" onclick="toggleVisibleUpdate(4335837625);">
									<svg class="svg-inline--fa fa-check fa-w-16" aria-hidden="true" id="isvisibleicon_4335837625" data-active="active" focusable="false" data-prefix="fas" data-icon="check" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path></svg><!-- <span class="fas fa-check" aria-hidden="true" id="isvisibleicon_4335837625" data-active="active"></span> Font Awesome fontawesome.com -->
									<span id="visiblestate_4335837625">Visible</span>
								</button>
    5.8 - This very important - one case may have multiple updates by agents with updates marked as "invisible". so we need to check all the updates by (agents) from the matching company and mark them visible. Keep count of updates_made_visible for database logging.
    
    5.9 - Extract and store update text for each toggled update:
          - Selector: `dd[id$="_view_comments"]` (primary)
          - Fallback selectors if primary not found:
            - `dt:has-text("Details") + dd`
            - `dd[class*="update-text-"]`
          - Store the full update text content for audit purposes
          
6   save case data in supabase table `agent_update_visibility_log` for reporting purpose:
    - case_id (text)
    - company_name (text) - The extracted company name
    - update_text (text) - The full update content
    - updates_made_visible (integer)
    - processing_mode (text: 'manual' or 'automatic')
    - created_at (timestamp with timezone in IST) 
7.  page url /agent-updates-visibility create manual or automatic toggle button - automatic is off by default - when manual is selected then we will manually review at this step and click on next case button on /agent-updates-visibility and if automatic is turned on then skip this step of manual review / clicking on Next case button and just go to step # 8 
8. close the current case tab and go to https://app.recoverydatabase.net/v2/main/new_updates.php?case_worker=ALL&order=priority&type=ALL&days_since_update=all&case_status%5B%5D=Open and repeat the steps 4,5,6 until no cases are left  
9. show entire report on /agent-updates-visibility - give export to csv option
   Report Format:
   - Date (IST)
   - Case ID
   - Company Name
   - Updates Made Visible (count)
   - Processing Mode (Manual/Automatic)
   - Status (Processed/Skipped)

## Database Table Structure
Table: agent_update_visibility_log
- id (uuid, primary key)
- case_id (text)
- company_name (text) - The company name extracted from update metadata
- update_text (text) - The full update content for audit purposes
- updates_made_visible (integer, default 0)
- processing_mode (text: 'manual' or 'automatic')
- created_at (timestamp with timezone in IST)

## UI Elements on /agent-updates-visibility page
1. Start Processing button
2. Mode Toggle (Manual/Automatic - default: Manual)
3. Current Case Display (shows case ID being processed)
4. Next Case button (visible only in manual mode)
5. Report section with Export to CSV button

## Company Validation Details
### Extraction Method:
- Search for pattern: "Updates by agents from '[Company Name]'"
- Extract company name from within single quotes
- Store exact company name as found in HTML

### Matching Logic:
```javascript
// Flexible regex pattern for company matching
const isValidCompany = /professional\s+towing/i.test(companyName)
```
- Case-insensitive matching
- Handles variations in spacing
- Accepts partial matches (e.g., "Professional Towing" matches "Professional Towing and Recovery, LLC")

### Update Text Extraction:
- Primary selector: `dd[id$="_view_comments"]`
- Fallback selectors tried in order if primary fails
- Stores complete update text for each visibility toggle

## Error Handling
- Session timeout: Re-authenticate using Module 1 login flow
- No matching company updates: Log with updates_made_visible = 0, company_name = null
- Company extraction failure: Skip the update, log error
- Update text extraction failure: Store null, continue processing
- Network timeout: Reload the current page and continue

## Success Criteria
- Only "Professional Towing and Recovery" agent updates are processed
- All matching "Not Visible" updates converted to "Visible"
- Each processed case logged with company name and update text
- Report available with CSV export functionality including company column
                