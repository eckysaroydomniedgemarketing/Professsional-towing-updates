import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// RDN Project specific client
const rdnProjectId = 'ebttpcsfdbkeotxnivha';
const rdnUrl = `https://${rdnProjectId}.supabase.co`;

// For RDN project operations
export const rdnSupabase = createClient(
  rdnUrl,
  process.env.NEXT_PUBLIC_RDN_ANON_KEY || supabaseAnonKey
);