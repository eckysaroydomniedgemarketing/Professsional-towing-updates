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

### Step 6: Process Cases Iteratively
- **Action**: Process multiple cases one by one
- **Process**: 
  1. Click first case ID number (bold link) in table
  2. Process case data
  3. Return to case listing
  4. Repeat for next case (MVP: up to 10 cases)
- **Table**: `#casestable tbody tr:first-child` (inside mainFrame iframe)
- **Link**: First case ID link - `a[href*="case_id="] b` (bold case number)
- **Expected URL**: `/alpha_rdn/module/default/case2/?case_id={{case_id}}`
- **Note**: Click the case ID number directly, not the "View Updates" link

## Data Storage Schema

### Table: case_updates
- **Purpose**: Store cases requiring updates
- **Columns**:
  - `id` (UUID, primary key)
  - `case_id` (text, unique)
  - `last_update_date` (date)
  - `days_since_update` (integer)
  - `case_worker` (text)
  - `status` (text)
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