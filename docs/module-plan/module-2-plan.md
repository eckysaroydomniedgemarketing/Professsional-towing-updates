# Module 2: Data Extraction from Updates Tab

## Overview
Module 2 is a pure data extraction module. It extracts all case-related data from the Updates tab page and stores it in the database. No data processing, validation, or business logic decisions are made - just extract and insert.

## Module Integration

### Purpose
- **Single Responsibility**: Extract data from UI and insert into database
- **No Logic**: No filtering, no decisions, no processing - just store everything

### Entry Point
- **From**: Module 1 completes navigation to Updates tab
- **Required**: Authenticated session, case_id, Updates tab loaded
- **Trigger**: `await module2.extractCaseData(caseId, page)`

### Exit Point  
- **Returns**: `{ success: boolean, caseId: string, recordsInserted?: number, error?: string }`
- **Next**: Module 3 processes the stored data

## Data Extraction Flow

**Note**: All data extraction happens from the Updates tab page. The case summary information remains visible at the top of the page even when viewing the Updates tab. Steps are ordered for efficient extraction from top to bottom of the page.

**Reference HTML**: Example HTML source code for the Updates tab page is available at: `docs/html-source-code/updates.txt`

### Step 0: Create Parent Record
- **Action**: Insert record into case_updates table
- **Purpose**: Satisfy foreign key constraints for child tables
- **Data**: case_id and status ('Open' by default)
- **Note**: This must be done before any other inserts

### Step 1: Extract Case Details
- **Action**: Extract all case details from the top section of the page
- **Location**: Case summary section at the top of the Updates tab page
- **HTML Structure**:
  ```html
  <div class='col-auto'><dt>Order Date</dt><dd>2025-07-23</dd></div>
  <div class='col-auto'><dt>Case #</dt><dd>2174447548</dd></div>
  <div class='col-auto'><dt>Ref. Number</dt><dd>59692</dd></div>
  <div class='col-auto'><dt>Client</dt><dd>ALS Resolvion (1st Placement)</dd></div>
  <div class='col-auto'><dt>Collector</dt><dd>Automation ALSR</dd></div>
  <div class='col-auto'><dt>Lien Holder</dt><dd>United Auto Credit Corporation</dd></div>
  <div class='col-auto'><dt>Client Acct No</dt><dd>2172871113</dd></div>
  ```
  
  Additional fields:
  ```html
  <dt>Order To</dt>
  <dd>Involuntary Repo</dd>
  
  <dt>Status</dt>
  <dd>Open</dd>
  ```
  
- **Data to Extract**: 
  - Order Date
  - Case Number
  - Reference Number
  - Client
  - Collector
  - Lien Holder
  - Client Account Number
  - Order Type (Order To)
  - Status

### Step 2: Extract Vehicle Information
- **Action**: Extract vehicle details from the case summary section
- **Location**: Same top section of the Updates tab page
- **Vehicle Information Fields**:
  ```html
  <dt>V.I.N.</dt>
  <dd>3N1CN8DV3LL888403</dd>
  ```
  
  ```html
  <dt>Year</dt>
  <dd>2020</dd>
  ```
  
  ```html
  <dt>Make</dt>
  <dd>NISSAN</dd>
  ```
  
  ```html
  <dt>Model</dt>
  <dd>SENTRA</dd>
  ```
  
  ```html
  <dt>Color</dt>
  <dd>WHITE</dd>
  ```
  
  ```html
  <dt>License Plate</dt>
  <dd>ABC123</dd>
  ```
  
  ```html
  <dt>License State</dt>
  <dd>OH</dd>
  ```

- **Data to Extract**:
  - VIN (Vehicle Identification Number)
  - Year
  - Make
  - Model
  - Color
  - License Plate Number
  - License Plate State
  - Any other vehicle-related fields

### Step 3: Extract Address Information
- **Action**: Extract all addresses associated with the case
- **Location**: Case summary section or dedicated address section
- **Primary Address Section**:
  ```html
  <div class="col-auto">
    <dt>Address</dt>
    <dd>1101 EUCLID AVE APT 518<br>CLEVELAND, OH 44115</dd>
  </div>
  ```
  
- **Multiple Addresses**: Cases can have multiple addresses with validity status
  - **Address List Structure** (likely in a section or table):
    ```html
    <div class="addresses-section">
      <div class="address-entry">
        <span class="address-type">Address Type</span>
        <span class="address-text">1101 EUCLID AVE APT 518<br>CLEVELAND, OH 44115</span>
      </div>
      <div class="address-entry">
        <span class="address-type">Address Type</span>
        <span class="address-text">2200 MAIN ST<br>CLEVELAND, OH 44116</span>
      </div>
    </div>
    ```
  
- **Data to Extract**: 
  - All addresses with their types (stored as-is from RDN)
  - Full address for each
  - ZIP code for each address (last 5 digits)
  - Primary/default address indicator

### Step 4: Extract Update History
- **Action**: Extract all previous updates from the Updates tab content area with pagination handling
- **Location**: Main content area below the case summary (loaded by switchTab(6))

- **Important**: Updates are paginated - must click "ALL" button first
- **Pagination Handling**:
  1. Wait for Updates tab content to load
  2. Look for pagination controls (`.js-update-pagination`)  
  3. Click "ALL" button: `a[data-page="ALL"]`
  4. Wait for `#loading` indicator to disappear
  5. Extract all updates from `div[id^="updatearea_"]` containers

- **Update Entry Structure**:
  ```html
  <div id="updatearea_XXXXXXXXX">
    <dl>
      <dt>Updated Date/Time</dt><dd>{{date}}</dd>
      <dt>Update Type</dt><dd>{{type}}</dd>
      <dt>Last Updated By</dt><dd>{{author}}</dd>
      <dt>Details</dt><dd>{{content}}</dd>
    </dl>
  </div>
  ```

- **Update Container Structure**:
  ```html
  <div id="ContentLoader" class="section--top-margin">
    <!-- Updates list loads here after switchTab(6) -->
    <div class="update-list">
      <!-- Individual update entries -->
    </div>
  </div>
  ```

- **Individual Update Entry Structure**:
  ```html
  <div class="update">
    <div class="update__header">
      <span class="update__date">{{update_date}}</span>
      <span class="update__type">{{update_type}}</span>
      <span class="update__author">{{author_name}}</span>
    </div>
    <div class="update__section">
      <div class="update__address">{{address_info}}</div>
      <div class="well">{{update_content_text}}</div>
    </div>
  </div>
  ```

- **Alternative Table Structure** (if updates are in table format):
  ```html
  <table class="table" id="updates-table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Added By</th>
        <th>Address</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      <tr class="update-row">
        <td class="update-date">{{date}}</td>
        <td class="update-type">{{type}}</td>
        <td class="update-author">{{author}}</td>
        <td class="update-address">{{address}}</td>
        <td class="update-details">{{details}}</td>
      </tr>
    </tbody>
  </table>
  ```

- **Data to Extract for each update**:
  - Update date/timestamp
  - Update type (Agent-Update, Client-Update, etc.)
  - Update author/source
  - Update content/message
  - Address associated with update
  - Visibility status (visible/not visible)

- **Critical Notes**:
  - Must extract ALL updates for each case (not just visible on first page)
  - Cases typically have multiple updates spanning months/years
  - Pagination must be handled to capture complete update history
  - Wait for dynamic content to load between pagination actions

- **Selectors to try**:
  - Container: `#ContentLoader`, `.update-list`, `#updates-table`
  - Individual updates: `.update`, `.update-row`, `tr[class*="update"]`
  - Date: `.update__date`, `.update-date`, `td:nth-child(1)`
  - Type: `.update__type`, `.update-type`, `td:nth-child(2)`
  - Author: `.update__author`, `.update-author`, `td:nth-child(3)`
  - Content: `.well`, `.update-details`, `.update__section`

- **Note**: The actual structure will be revealed after switchTab(6) loads the content dynamically

## Data Storage Schema

### Table: case_updates (Parent Table - Must be created first)
- **Purpose**: Parent table to satisfy foreign key constraints
- **Columns**:
  - `case_id` (text, primary key)
  - `status` (text)
  - `created_at` (timestamp)

### Table: case_details
- **Purpose**: Store extracted case details
- **Columns**:
  - `id` (UUID, primary key)
  - `case_id` (text, foreign key to case_updates.case_id)
  - `order_date` (date)
  - `ref_number` (text)
  - `order_type` (text)
  - `status` (text)
  - `client` (text)
  - `collector` (text)
  - `lien_holder` (text)
  - `client_account_number` (text)
  - `created_at` (timestamp)

### Table: case_vehicles
- **Purpose**: Store vehicle information for each case
- **Columns**:
  - `id` (UUID, primary key)
  - `case_id` (text, foreign key to case_updates.case_id)
  - `vin` (text) - Vehicle Identification Number
  - `year` (integer)
  - `make` (text)
  - `model` (text)
  - `color` (text)
  - `license_plate` (text)
  - `license_state` (text)
  - `additional_details` (jsonb) - For any other vehicle fields
  - `created_at` (timestamp)

### Table: case_addresses
- **Purpose**: Store multiple addresses per case with ZIP validation
- **Columns**:
  - `id` (UUID, primary key)
  - `case_id` (text, foreign key to case_updates.case_id)
  - `address_type` (text) - Stored as-is from RDN portal
  - `full_address` (text)
  - `street_address` (text)
  - `city` (text)
  - `state` (text)
  - `zip_code` (text)
  - `is_primary` (boolean) - Indicates if this is the primary address
  - `is_covered` (boolean)
  - `google_maps_verified` (boolean)
  - `created_at` (timestamp)

### Table: case_update_history
- **Purpose**: Store all updates found for a case
- **Columns**:
  - `id` (UUID, primary key)
  - `case_id` (text, foreign key to case_updates.case_id)
  - `update_date` (timestamp)
  - `update_type` (text)
  - `update_author` (text)
  - `update_content` (text)
  - `address_associated` (text)
  - `contains_exclusion_keyword` (boolean)
  - `exclusion_keywords` (text[])
  - `is_visible` (boolean)
  - `created_at` (timestamp)

### Table: zip_codes
- **Purpose**: Reference table for covered ZIP codes
- **Columns**:
  - `id` (UUID, primary key)
  - `zip_code` (text, unique)
  - `is_active` (boolean)
  - `created_at` (timestamp)

## Relationships
- `case_updates` (1) → (1) `case_details`
- `case_updates` (1) → (1) `case_vehicles`
- `case_updates` (1) → (many) `case_addresses` - Multiple addresses per case
- `case_updates` (1) → (many) `case_update_history`
- `case_addresses.zip_code` → `zip_codes.zip_code`

## Input Placeholders
- None required - Module 2 focuses solely on data extraction

## Data Extraction Focus
All case data is extracted regardless of values:
- Order Type (any value)
- Status (any value)
- Address and ZIP code
- Vehicle information
- Update history
- Exclusion keywords presence (DRN, LPR, GPS, Surrender)
- Note: Data is stored for analysis, no cases excluded during extraction

