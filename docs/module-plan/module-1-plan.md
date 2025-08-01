# Module 1: System Access and Case Update Browser Automation

## Overview
Automate login and navigation to access cases requiring updates in the RDN Portal.

## Navigation Flow with Selectors

### Step 1: Navigate to RDN Portal Login
- **Action**: Load login page
- **URL**: `https://secureauth.recoverydatabase.net/public/login?rd=/`
- **Expected Result**: Login form displayed
- **Important**: All navigation after login occurs within an iframe named "mainFrame"

### Step 2: Enter Credentials
- **Action**: Fill login form fields
- **Username Field**: 
  ```html
  <input type="text" class="form-control form-control-lg" name="username" placeholder="Username" required="required" autocomplete="off" autofocus>
  ```
  - **Input**: `{{username}}`
  
- **Password Field**: 
  ```html
  <input type="password" class="form-control form-control-lg" name="password" placeholder="Password" required="required" autocomplete="off">
  ```
  - **Input**: `{{password}}`
  
- **Security Code Field**: 
  ```html
  <input type="text" class="form-control form-control-lg" name="code" placeholder="ID Code / Security Code" required="required" autocomplete="off">
  ```
  - **Input**: `{{security_code}}`

### Step 3: Submit Login
- **Action**: Click login button
- **Login Button**: 
  ```html
  <button class="btn btn-success" onclick="checkCaptcha()">Login</button>
  ```
- **Expected URL**: Dashboard page (redirected after successful login)

### Step 4: Navigate to Case Update Listing
- **Action**: Click "Case Update Needed Listing" link
- **Link Selector**: 
  ```html
  <a class="linkbar__link" data-toggle="tooltip" title="&lt;strong&gt;Updates Needed:&lt;/strong&gt;<br /> View accounts that have not been updated for the number of days indicated in the client&#039;s profile. <br /><br />By selecting Never Updated, you can see all accounts that have never had an update." href="three_day_updates.php?num_of_days=3">Case Update Needed Listing </a>
  ```
- **Expected URL**: `three_day_updates.php?num_of_days=3`

### Step 5: Configure Filters
- **Action 1**: Set Case Worker to "All"
  - **Dropdown Selector**: `select[name="case_worker"]` (inside mainFrame iframe)
  - **Select Option**: `<option value="">All</option>` (empty value = All)

- **Action 2**: Apply filter
  - **Update Button**: 
    ```html
    <input type="submit" value="Update">
    ```

- **Action 3**: Set display entries to 100
  - **Note**: Selector varies, commonly `select[name="DataTables_Table_0_length"]` or `select[name="casestable_length"]`
  - **Entries Dropdown**: 
    ```html
    <select name="length" aria-controls="casestable" class="form-select">
        <option value="10">10</option>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
    </select>
    ```
  - **Select Option**: 
    ```html
    <option value="100">100</option>
    ```

- **Action 4**: Sort by Last Update
  - **Column Header**: 
    ```html
    <th class="sorting" tabindex="0" aria-controls="casestable" aria-label="Last Update: activate to sort column ascending">Last Update</th>
    ```
  - **Note**: Click to sort in descending order (oldest updates first)

### Step 6: Navigate to Case Summary
- **Action**: Click case ID number (bold link) in table
- **Table**: `#casestable tbody tr:first-child` (inside mainFrame iframe)
- **Link**: First case ID link - `a[href*="case_id="] b` (bold case number)
- **Expected URL**: `https://app.recoverydatabase.net/alpha_rdn/module/default/case2/?case_id={{case_id}}#`
- **Note**: Click the case ID number directly, not the "View Updates" link

### Step 7: Navigate to Updates Tab
- **Action**: Click the Updates tab on the case summary page
- **Tab HTML**: 
  ```html
  <li class="nav-item" id="tab_6">
      <a href="#" onclick="switchTab(6);return false;" class="nav-link">
          <span id="tab_label_span_6">
              <svg class="svg-inline--fa fa-info-circle fa-w-16 me-2" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="info-circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg="">
                  <path fill="currentColor" d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"></path>
              </svg>
              <!-- <i class="fas fa-info-circle me-2"></i> Font Awesome fontawesome.com -->
              <span class="js-label">Updates</span> 
              <span class="js-count">
                  <span class="badge rounded-pill d-inline-block ms-2 text-white">8</span>
              </span>
          </span>
      </a>
  </li>
  ```
- **Tab Selectors** (use any of these):
  - `li#tab_6 a.nav-link`
  - `a[onclick="switchTab(6);return false;"]`
  - Target by Updates text: `span.js-label:contains("Updates")`
- **Expected Result**: Updates tab content loads in the same page
- **Note**: This triggers JavaScript function `switchTab(6)` - content loads dynamically

### Step 8: Module 2 Handoff
- **Action**: Module 2 takes over to process the updates
- **Handoff Point**: Once Updates tab content is loaded
- **Module 2 Tasks**: Handle all update operations within the tab
- **Return Signal**: Module 2 signals completion to return to case listing

### Step 9: Return to Case Listing and Iterate
- **Action**: Navigate back to case update listing page
- **Navigation**: Browser back or click "Case Update Needed Listing" link again
- **Iteration**: 
  1. Select next unprocessed case from the listing
  2. Repeat Steps 6-8 for each case
  3. Process up to 10 cases for MVP
- **Tracking**: Mark processed cases to avoid duplicates

## Data Storage Schema

### Table: case_updates
- **Purpose**: Store cases requiring updates
- **Columns**:
  - `id` (UUID, primary key)
  - `case_id` (text, unique)
  - `last_update_date` (date)
  - `days_since_update` (integer)
  - `case_worker` (text)
  - `status` (text) - Values: 'pending', 'in_progress', 'completed'
  - `update_started_at` (timestamp) - When Module 2 starts processing
  - `update_completed_at` (timestamp) - When Module 2 finishes
  - `extracted_at` (timestamp)
  - `created_at` (timestamp)

### Table: case_details
- **Purpose**: Store detailed case information
- **Columns**:
  - `id` (UUID, primary key)
  - `case_id` (text, foreign key to case_updates.case_id)
  - `field_name` (text)
  - `field_value` (text)
  - `extracted_at` (timestamp)

## Relationships
- `case_updates` (1) → (many) `case_details`

## Input Placeholders
- `{{username}}` - RDN Portal username
- `{{password}}` - RDN Portal password
- `{{security_code}}` - ID/Security code
- `{{case_id}}` - Specific case number (extracted from listing)

## Module Integration
### Module 1 → Module 2 Handoff
- **Handoff Point**: After clicking Updates tab (Step 7)
- **Data Passed**: 
  - Current `case_id`
  - Session/authentication context
  - Browser state with Updates tab loaded
- **Module 2 Responsibilities**:
  - Process all updates within the Updates tab
  - Signal completion back to Module 1
  
### Module 2 → Module 1 Return
- **Return Point**: After Module 2 completes update processing
- **Return Action**: Navigate back to case listing
- **Continue**: Process next case (up to 10 total)