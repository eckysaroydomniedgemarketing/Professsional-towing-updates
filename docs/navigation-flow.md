# Professional Towing RDN Navigation Flow

This document outlines the step-by-step navigation flow for the Professional Towing automation process, based on the Standard Operating Procedure (SOP). Each step includes the page URL, required actions, and data extraction points with complete outer HTML selectors.

## MODULE 1: SYSTEM ACCESS AND NAVIGATION

### Navigation Flow Options
1. **Automatic Flow**: System navigates to case listing and processes cases sequentially
2. **Manual Case Input**: System navigates directly to a specific case when targetCaseId is provided
3. **Get Next Case**: System reuses existing session to process the next case in the listing

### Step 1: Navigate to RDN Portal Login Page
- **URL**: `https://secureauth.recoverydatabase.net/public/login?rd=/`
- **Actions**:
  - Load the login page

### Step 2: Authenticate with Credentials
- **URL**: Same as Step 1
- **Actions**:
  - Enter Username in: 
    ```html
    <input type="text" class="form-control form-control-lg" name="username" placeholder="Username" required="required" autocomplete="off" autofocus>
    ```
  - Enter Password in: 
    ```html
    <input type="password" class="form-control form-control-lg" name="password" placeholder="Password" required="required" autocomplete="off">
    ```
  - Enter ID Code/Security Code in: 
    ```html
    <input type="text" class="form-control form-control-lg" name="code" placeholder="ID Code / Security Code" required="required" autocomplete="off">
    ```
  - Click Login button: 
    ```html
    <button class="btn btn-success" onclick="checkCaptcha()">Login</button>
    ```

### Step 3: Access Dashboard
- **URL**: Dashboard page (redirected after login)
- **Actions**:
  - Locate "Case Update Needed Listing" link in the "Cases And Reports" section: 
    ```html
    <a class="linkbar__link" data-toggle="tooltip" title="&lt;strong&gt;Updates Needed:&lt;/strong&gt;<br /> View accounts that have not been updated for the number of days indicated in the client&#039;s profile. <br /><br />By selecting Never Updated, you can see all accounts that have never had an update." href="three_day_updates.php?num_of_days=3">Case Update Needed Listing </a>
    ```
  - Click on the link

### Step 4: Configure View Settings
- **URL**: Case Update Needed Listing page
- **Actions**:
  1. Set Case Worker filter:
     - Click on "By Case Worker" dropdown: 
       ```html
       <select name="case_worker" id="by_caseworker" class="form-select">
           <option value="">All</option>
           <!-- More options here -->
       </select>
       ```
     - Select "All" option: 
       ```html
       <option value="">All</option>
       ```
  
  2. Update the filter:
     - Click "Update" button (submit the form):
       ```html
       <button type="submit" class="btn btn-primary">Update</button>
       ```
  
  3. Set the number of entries to display:
     - Click "Show" dropdown: 
       ```html
       <select name="length" aria-controls="casestable" class="form-select">
           <option value="10">10</option>
           <option value="25">25</option>
           <option value="50">50</option>
           <option value="100">100</option>
       </select>
       ```
     - Select "100" option: 
       ```html
       <option value="100">100</option>
       ```
  
  4. Sort by last update:
     - Click on "Last Update" column header to sort in descending order:
       ```html
       <th class="sorting" tabindex="0" aria-controls="casestable" aria-label="Last Update: activate to sort column ascending">Last Update</th>
       ```

### Step 5: Open Case for Update
- **URL**: Case Update Needed Listing page
- **Actions**:
  - Locate "View Update" link for the desired case: 
    ```html
    <a href="view_case.php?case_id=CASE_NUMBER">View Updates</a>
    ```
  - Click on the link to open the case details

### Step 5a: Direct Case Navigation (Manual Case Input)
- **URL**: Direct navigation when targetCaseId is provided
- **Actions**:
  - When a specific case ID is entered manually, navigate directly to:
    ```
    https://app.recoverydatabase.net/alpha_rdn/module/default/case2/?tab=6&case_id={caseId}
    ```
  - This bypasses the case listing and goes straight to the case detail page
  - The system will:
    1. Login to RDN portal (if not already logged in)
    2. Navigate directly to the specified case URL
    3. Extract case data from the loaded page
    4. Continue with normal processing workflow

## MODULE 2: CASE VALIDATION AND QUALIFICATION

### Step 6: Validate Case Eligibility
- **URL**: Case details page
- **Actions**:
  - Check "Order To" field:
    ```html
    <dt>Order To</dt>
    <dd>Involuntary Repo</dd>
    ```
  
  - Check "Status" field:
    ```html
    <dt>Status</dt>
    <dd>Open</dd>
    ```

- **Data to Extract**:
  - Order Type 
  - Status 

### Step 7: Extract ZIP Code
- **URL**: Same as Step 6
- **Actions**:
  - Extract ZIP code from the address section: 
    ```html
    <div class="col-auto">
      <dt>Address</dt>
      <dd>1101 EUCLID AVE APT 518<br>CLEVELAND, OH 44115</dd>
    </div>
    ```
    - Extract the ZIP code part (44115 in this example)
- **Data to Extract**:
  - ZIP code from address

<!-- ### Step 8: Verify ZIP Code Against Coverage Area
- **URL**: Same as Step 6
- **Actions**:
  - Query Supabase `zip_codes` table and validate ZIP code presence
  - Note: Previously used Google Sheets (`https://docs.google.com/spreadsheets/d/1hd99HmMSCoHwsD25Ie8svsZEQSYkr4xj/edit?gid=1151459725#gid=1151459725`), now using Supabase database -->

### Step 9: Review Previous Updates
- **URL**: Same as Step 6
- **Actions**:
  - Navigate to the "Updates" section:
    ```html
    <li id="tab_6" class="nav-item">
      <a class="nav-link" href="#" onclick="switchTab(6);return false;">
        <span id="tab_label_span_6">
          <i class="fas me-2 fa-comment-dots"></i>
          <span class="js-label">Updates</span>
          <span class="js-count"></span>
        </span>
      </a>
    </li>
    ```
  - Review existing updates: Each update entry in the Updates section:
    ```html
    <div class="update">
      <!-- Update content with details -->
      <div class="update__section">
        <div class="well">Update text content here</div>
      </div>
    </div>
    ```
- **Data to Extract**:
  - Previous updates content

### Step 10: Search for Exclusion Keywords
- **URL**: Same as Step 6
- **Actions**:
  - Use Ctrl+F functionality to search for:
    - "DRN"
    - "LPR"
    - "GPS"
    - "Surrender"
  - Check "Not Visible" updates (if available)
    ```html
    <button type="button" class="btn btn-sm btn-secondary" data-bs-toggle="modal" data-bs-target="#js-not-visible-updates">
      Not Visible Updates <span class="badge bg-secondary">2</span>
    </button>
    ```

### Step 11: Identify First Updates Without Property Details
- **URL**: Same as Step 6
- **Actions**:
  - Review updates to identify first updates without property details

## MODULE 3: PROPERTY ANALYSIS AND TEMPLATE SELECTION

### Step 12: Verify Address on Google Maps
- **URL**: Google Maps
- **Actions**:
  - Open Google Maps in a new tab: `https://www.google.com/maps`
  - Enter the address from the case (extracted in Step 7)
  - Verify the address exists and is valid

### Step 13: Access Property Images
- **URL**: Case details page
- **Actions**:
  - Click on the "Photos / Docs" tab: 
    ```html
    <li id="tab_14" class="nav-item">
      <a class="nav-link" href="#" onclick="switchTab(14);return false;">
        <span id="tab_label_span_14">
          <i class="fas me-2 fa-camera"></i>
          <span class="js-label">Photos / Docs</span>
          <span class="js-count"></span>
        </span>
      </a>
    </li>
    ```
- **Data to Extract**:
  - Property images

### Step 14: Analyze Property Condition and Characteristics
- **URL**: Same as Step 13
- **Actions**:
  - Examine property images
  - Note property characteristics (e.g., "Two storey house with open parking")
- **Data to Extract**:
  - Property characteristics for analysis

### Step 15: Select Appropriate Template
- **URL**: Template document
- **Actions**:
  - Access templates: `https://docs.google.com/document/d/16oDIUq5F1yfCr3nkSMCx6yNRcMe6OTWuA21NY620XKc/edit?tab=t.0`
  - Select template based on:
    - Property analysis results
    - Template rotation logic (avoid duplicate of most recent)
  - Template Selection Logic:
    - If last update was Template A → Choose Template B
    - If last update was Template B → Choose Template C
    - Continue sequence to avoid duplicates

## MODULE 4: UPDATE CREATION AND SUBMISSION

### Step 16: Create New Case Update
- **URL**: Case details page, Updates tab
- **Actions**:
  1. Navigate to Updates tab: 
     ```html
     <li id="tab_6" class="nav-item">
       <a class="nav-link" href="#" onclick="switchTab(6);return false;">
         <span id="tab_label_span_6">
           <i class="fas me-2 fa-comment-dots"></i>
           <span class="js-label">Updates</span>
           <span class="js-count"></span>
         </span>
       </a>
     </li>
     ```
  
  2. Set update type:
     - Select "Type" dropdown: 
       ```html
       <select name="update_type" class="form-select">
         <option value="Agent-Update">(O) Agent-Update</option>
         <!-- Other options -->
       </select>
       ```
     - Choose "Agent Update"
  
  3. Set address update:
     - Select "Address Update" dropdown: 
       ```html
       <select name="address_update" class="form-select">
         <option value="">-- None --</option>
         <!-- Address options -->
       </select>
       ```
     - Choose same address as main case information
  
  4. Enter update details:
     - Paste selected template in "Details" textarea: 
       ```html
       <textarea name="details" class="form-control" rows="6" maxlength="1500"></textarea>
       ```
  
  5. Submit the update:
     - Click "Create" button to post the update:
       ```html
       <button type="submit" class="btn btn-primary">Create</button>
       ```

## MODULE 5: COMPLETION AND TRACKING

### Step 17: Refresh RDN Tab
- **URL**: Case details page
- **Actions**:
  - Refresh the page to ensure updates reflect properly
  - Keyboard shortcut: F5 or Ctrl+R

### Step 18: Navigate to Updates Section and Notify Stakeholders
- **URL**: Case details page, Updates tab
- **Actions**:
  - Click "Collector" button:
    ```html
    <button type="button" class="btn btn-secondary" onclick="notifyCollector()">Collector</button>
    ```
  - Click "Client" button:
    ```html
    <button type="button" class="btn btn-secondary" onclick="notifyClient()">Client</button>
    ```
  - Click "Transferred to Client" button:
    ```html
    <button type="button" class="btn btn-secondary" onclick="markTransferred()">Transferred to Client</button>
    ```

### Step 19: Copy Vehicle Identification Number (VIN)
- **URL**: Case details page
- **Actions**:
  - Locate and copy the VIN from the main RDN page: 
    ```html
    <dt>V.I.N.</dt>
    <dd>3N1CN8DV3LL888403</dd>
    ```
- **Data to Extract**:
  - Vehicle Identification Number (VIN)

### Step 20: Log VIN in Hourly Progress Report
- **URL**: Hourly Progress Report spreadsheet
- **Actions**:
  - Access: `https://docs.google.com/spreadsheets/d/1-X8q0JGwAHpFTMU5yjm3sgbDEqk347Lyo4ZulNt_b3s/edit?gid=0#gid=0`
  - Paste VIN for case tracking in appropriate cell

## MODULE 6: NEW UPDATES PROCESSING

### Step 21: Access New Updates from Dashboard
- **URL**: Dashboard page
- **Actions**:
  - Click "New updates" icon from left panel:
    ```html
    <a class="linkbar__link" href="/mod02_SA/recent_updates.php">New updates</a>
    ```

### Step 22: Configure Filters
- **URL**: New Updates page
- **Actions**:
  1. Set "Limits Updates To" dropdown:
     - Click dropdown: 
       ```html
       <select class="js-multiselect form-select" name="case_worker" onChange="submit();">
         <option value='ALL'>Show All</option>
         <option value='MINE' selected>Show Mine</option>
         <!-- Other options -->
       </select>
       ```
     - Select "Show All": 
       ```html
       <option value='ALL'>Show All</option>
       ```
  
  2. Set "Update Date Within" dropdown:
     - Click dropdown: 
       ```html
       <select class="form-select" name="days_since_update" id="days_since_update" onChange="submit();">
         <option value="1">Last 24 Hours</option>
         <option value="3">Last 3 Days</option>
         <option value="7">Last 7 Days</option>
         <option value="30">Last 30 Days</option>
         <option value="60">Last 60 Days</option>
         <option value="90">Last 90 Days</option>
         <option value="all">All Time</option>
       </select>
       ```
     - Select "All Time": 
       ```html
       <option value="all">All Time</option>
       ```
  
  3. Set "Sort By" dropdown:
     - Click dropdown: 
       ```html
       <select class="form-select" name="order" onChange="submit();">
         <option value="priority">High Priority First</option>
         <option value="date">Newest First</option>
       </select>
       ```
     - Select "High Priority First": 
       ```html
       <option value="priority">High Priority First</option>
       ```

### Step 23: Process Open Status Cases
- **URL**: Same as Step 22
- **Actions**:
  - Review updates from field agents in list
  - Ensure all updates are visible
  - Remove remaining cases from list using:
    - Select All button: 
      ```html
      <button type="button" class="btn btn-sm btn-outline-secondary js-select-all-new">Select All</button>
      ```
    - Remove Selected button: 
      ```html
      <button type="button" class="btn btn-sm btn-outline-danger js-remove-selected-new">Remove Selected</button>
      ```

## Exclusion Rules

### Cases that DO NOT require updates:
- Impound Repo
- Voluntary Repo
- Repossessed account
- Hold Account
- Close Account
- NEVER Updated
- DRN HIT, LPR, GPS cases
- SURRENDER cases
- Unit Spotted cases

**Exception:** If DRN hit, GPS, or LPR found in old update AND client sent 2-3 updates after that old update → case can be worked on