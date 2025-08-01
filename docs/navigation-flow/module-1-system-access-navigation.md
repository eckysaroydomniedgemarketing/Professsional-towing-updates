# MODULE 1: SYSTEM ACCESS AND NAVIGATION

This module covers the initial login process and navigation to find cases that need updates.

## Step 1: Navigate to RDN Portal Login Page
- **URL**: `https://secureauth.recoverydatabase.net/public/login?rd=/`
- **Actions**:
  - Load the login page

## Step 2: Authenticate with Credentials
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

## Step 3: Access Dashboard
- **URL**: Dashboard page (redirected after login)
- **Actions**:
  - Locate "Case Update Needed Listing" link in the "Cases And Reports" section: 
    ```html
    <a class="linkbar__link" data-toggle="tooltip" title="&lt;strong&gt;Updates Needed:&lt;/strong&gt;<br /> View accounts that have not been updated for the number of days indicated in the client&#039;s profile. <br /><br />By selecting Never Updated, you can see all accounts that have never had an update." href="three_day_updates.php?num_of_days=3">Case Update Needed Listing </a>
    ```
  - Click on the link

## Step 4: Configure View Settings
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

## Step 5: Open Case for Update
- **URL**: Case Update Needed Listing page
- **Actions**:
  - Locate "View Update" link for the desired case: 
    ```html
    <a href="view_case.php?case_id=CASE_NUMBER">View Updates</a>
    ```
  - Click on the link to open the case details