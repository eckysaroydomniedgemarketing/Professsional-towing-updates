import { createClient, SupabaseClient } from '@supabase/supabase-js';

class SupabaseServerService {
  private client: SupabaseClient | null = null;
  
  getClient(): SupabaseClient {
    if (!this.client) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      this.client = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
    
    return this.client;
  }
  
  async testConnection(): Promise<boolean> {
    try {
      const client = this.getClient();
      const { error } = await client.from('agent_update_visibility_log').select('id').limit(1);
      return !error;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }
}

export const supabaseServerService = new SupabaseServerService();