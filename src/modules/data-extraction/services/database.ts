import { rdnSupabase } from './supabase';
import { 
  CaseDetails, 
  CaseVehicle, 
  CaseAddress, 
  CaseUpdateHistory,
  ZipCode,
  CaseUpdate 
} from '../types';

// Insert case details
export async function insertCaseDetails(data: CaseDetails) {
  // Log order_type extraction success
  if (data.order_type) {
    console.log(`Order Type successfully extracted and saved: "${data.order_type}" for case ${data.case_id}`);
  } else {
    console.log(`Warning: Order Type was null for case ${data.case_id}`);
  }
  
  const { error } = await rdnSupabase
    .from('case_details')
    .insert(data);
  
  if (error) throw error;
  return true;
}

// Insert vehicle information
export async function insertVehicle(data: CaseVehicle) {
  const { error } = await rdnSupabase
    .from('case_vehicles')
    .insert(data);
  
  if (error) throw error;
  return true;
}

// Insert addresses (can be multiple)
export async function insertAddresses(addresses: CaseAddress[]) {
  if (addresses.length === 0) return true;
  
  const { error } = await rdnSupabase
    .from('case_addresses')
    .insert(addresses);
  
  if (error) throw error;
  return true;
}

// Insert update history entries
export async function insertUpdateHistory(updates: CaseUpdateHistory[]) {
  if (updates.length === 0) return true;
  
  const { error } = await rdnSupabase
    .from('case_update_history')
    .insert(updates);
  
  if (error) throw error;
  return true;
}

// Check if ZIP code is covered
export async function checkZipCodeCoverage(zipCode: string): Promise<boolean> {
  const { data, error } = await rdnSupabase
    .from('zip_codes')
    .select('is_active')
    .eq('zip_code', zipCode)
    .single();
  
  if (error || !data) return false;
  return data.is_active || false;
}

// Get all active ZIP codes for bulk checking
export async function getActiveZipCodes(): Promise<string[]> {
  const { data, error } = await rdnSupabase
    .from('zip_codes')
    .select('zip_code')
    .eq('is_active', true);
  
  if (error || !data) return [];
  return data.map(z => z.zip_code);
}

// Insert case update (parent record)
export async function insertCaseUpdate(caseId: string, status: string = 'Open') {
  const { error } = await rdnSupabase
    .from('case_updates')
    .insert({ 
      case_id: caseId,
      status: status 
    });
  
  // If record already exists, that's OK for MVP
  if (error && error.code !== '23505') throw error;
  return true;
}