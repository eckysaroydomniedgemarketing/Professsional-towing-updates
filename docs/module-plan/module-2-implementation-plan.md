# Module 2 Implementation Plan (MVP/POC)

## Overview
Simple implementation plan for Module 2 - Data Extraction from Updates Tab

## Task List

### 1. **Create Module File**
- Create `src/modules/data-extraction/extractCaseData.ts`
- Add basic TypeScript types for data structures

### 2. **Extract Functions**
- `extractCaseDetails()` - Get case info from top section
- `extractVehicle()` - Get vehicle VIN, year, make, model
- `extractAddresses()` - Get all addresses from page
- `extractUpdates()` - Get update entries (clicks ALL button for pagination)

### 2.1. **Pagination Handling**
- Click "ALL" button in `.js-update-pagination` 
- Wait for `#loading` indicator
- Extract all updates from `div[id^="updatearea_"]`

### 2.5. **Database Preparation**
- Create parent record in `case_updates` table first
- Handle foreign key constraints
- Insert with case_id and default status

### 3. **Supabase Database Functions**
- Setup Supabase client with project URL and anon key
- Use Supabase JavaScript client methods:
  - `supabase.from('case_updates').insert()` - MUST BE FIRST
  - `supabase.from('case_details').insert()`
  - `supabase.from('case_vehicles').insert()`
  - `supabase.from('case_addresses').insert()` 
  - `supabase.from('case_update_history').insert()`
  - `supabase.from('zip_codes').select()` to check coverage

### 4. **Main Function**
- `extractCaseData(caseId, page)` that:
  - Creates parent record in case_updates table
  - Calls all extract functions
  - Handles pagination (clicks ALL before extracting updates)
  - Inserts data using Supabase client
  - Returns `{ success: boolean, caseId: string, recordsInserted?: number, error?: string }`

### 5. **Basic Error Handling**
- Try-catch around main operations
- Log errors to console
- Return error in response