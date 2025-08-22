// Type definitions for Module 2 data extraction

export interface CaseDetails {
  case_id: string;
  order_date: string | null;
  ref_number: string | null;
  order_type: string | null;
  status: string | null;
  client: string | null;
  collector: string | null;
  lien_holder: string | null;
  client_account_number: string | null;
  my_summary_additional_info?: string | null;
  created_at?: string;
}

export interface CaseVehicle {
  case_id: string;
  vin: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  color: string | null;
  license_plate: string | null;
  license_state: string | null;
  additional_details?: any;
  created_at?: string;
}

export interface CaseAddress {
  case_id: string;
  address_type: string | null;
  full_address: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  is_covered: boolean | null;
  google_maps_verified: boolean | null;
  address_validity: boolean | null;
  created_at?: string;
}

export interface CaseUpdateHistory {
  case_id: string;
  update_date: string | null;
  update_type: string | null;
  update_author: string | null;
  update_content: string | null;
  address_associated: string | null;
  contains_exclusion_keyword: boolean | null;
  exclusion_keywords: string[] | null;
  is_visible: boolean | null;
  created_at?: string;
}

export interface ExtractionResult {
  success: boolean;
  caseId: string;
  recordsInserted?: number;
  error?: string;
  sessionId?: string;
}

export interface ZipCode {
  zip_code: string;
  is_active: boolean;
}

export interface CaseUpdate {
  case_id: string;
  status: string | null;
  created_at?: string;
}