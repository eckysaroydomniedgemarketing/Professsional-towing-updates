import { rdnSupabase } from './supabase';
import { 
  CaseDetails, 
  CaseVehicle, 
  CaseAddress, 
  CaseUpdateHistory,
  ZipCode,
  CaseUpdate 
} from '../types';

// Create a new processing session
export async function createProcessingSession(caseId: string, module: string = 'module-2') {
  const { data, error } = await rdnSupabase
    .from('processing_sessions')
    .insert({
      case_id: caseId,
      module: module,
      status: 'started',
      metadata: { extraction_time: new Date().toISOString() }
    })
    .select('id')
    .single();
  
  if (error) throw error;
  console.log(`Created session ${data.id} for case ${caseId}`);
  return data.id;
}

// Update session status
export async function updateSessionStatus(sessionId: string, status: 'completed' | 'failed', metadata?: any) {
  const updateData: any = {
    status,
    ...(status === 'completed' && { completed_at: new Date().toISOString() }),
    ...(metadata && { metadata })
  };
  
  const { error } = await rdnSupabase
    .from('processing_sessions')
    .update(updateData)
    .eq('id', sessionId);
  
  if (error) throw error;
  console.log(`Updated session ${sessionId} to status: ${status}`);
  return true;
}

// Insert case details
export async function insertCaseDetails(data: CaseDetails, sessionId?: string) {
  // Log order_type extraction success
  if (data.order_type) {
    console.log(`Order Type successfully extracted and saved: "${data.order_type}" for case ${data.case_id}`);
  } else {
    console.log(`Warning: Order Type was null for case ${data.case_id}`);
  }
  
  const insertData = sessionId ? { ...data, session_id: sessionId } : data;
  
  const { error } = await rdnSupabase
    .from('case_details')
    .insert(insertData);
  
  if (error) throw error;
  return true;
}

// Insert vehicle information
export async function insertVehicle(data: CaseVehicle, sessionId?: string) {
  const insertData = sessionId ? { ...data, session_id: sessionId } : data;
  
  const { error } = await rdnSupabase
    .from('case_vehicles')
    .insert(insertData);
  
  if (error) throw error;
  return true;
}

// Insert addresses (can be multiple)
export async function insertAddresses(addresses: CaseAddress[], sessionId?: string) {
  if (addresses.length === 0) return true;
  
  const insertData = sessionId 
    ? addresses.map(addr => ({ ...addr, session_id: sessionId }))
    : addresses;
  
  const { error } = await rdnSupabase
    .from('case_addresses')
    .insert(insertData);
  
  if (error) throw error;
  return true;
}

// Insert update history entries
export async function insertUpdateHistory(updates: CaseUpdateHistory[], sessionId?: string) {
  if (updates.length === 0) return true;
  
  const insertData = sessionId 
    ? updates.map(update => ({ ...update, session_id: sessionId }))
    : updates;
  
  const { error } = await rdnSupabase
    .from('case_update_history')
    .insert(insertData);
  
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

// Insert or update case update (parent record)
export async function insertCaseUpdate(caseId: string, status: string = 'Open') {
  const { error } = await rdnSupabase
    .from('case_updates')
    .upsert({ 
      case_id: caseId,
      status: status 
    }, {
      onConflict: 'case_id'
    });
  
  if (error) throw error;
  return true;
}