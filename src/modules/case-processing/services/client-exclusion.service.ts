import { supabase } from '@/lib/supabase';

export interface ClientExclusionResult {
  isExcluded: boolean;
  reason?: string;
  skipValidation?: boolean;
}

export class ClientExclusionService {
  private static instance: ClientExclusionService;

  private constructor() {}

  static getInstance(): ClientExclusionService {
    if (!ClientExclusionService.instance) {
      ClientExclusionService.instance = new ClientExclusionService();
    }
    return ClientExclusionService.instance;
  }

  async checkClientExclusion(clientName: string | null | undefined): Promise<ClientExclusionResult> {
    try {
      // If no client name provided, not excluded
      if (!clientName || clientName.trim() === '') {
        return { isExcluded: false, skipValidation: true };
      }

      // Check if table has any active exclusions
      const { count, error: countError } = await supabase
        .from('client_exclusions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (countError) {
        console.error('Error checking client exclusions count:', countError);
        return { isExcluded: false, skipValidation: true };
      }

      // If table is empty, skip validation
      if (!count || count === 0) {
        return { isExcluded: false, skipValidation: true };
      }

      // Check if client is in active exclusion list (case-insensitive)
      const { data, error } = await supabase
        .from('client_exclusions')
        .select('client_name, exclusion_reason')
        .ilike('client_name', clientName.trim())
        .eq('is_active', true)
        .single();

      if (error) {
        // No match found
        if (error.code === 'PGRST116') {
          return { isExcluded: false, skipValidation: false };
        }
        console.error('Error checking client exclusion:', error);
        return { isExcluded: false, skipValidation: false };
      }

      if (data) {
        return {
          isExcluded: true,
          reason: data.exclusion_reason || 'Client is on exclusion list',
          skipValidation: false
        };
      }

      return { isExcluded: false, skipValidation: false };
    } catch (error) {
      console.error('Unexpected error in client exclusion check:', error);
      return { isExcluded: false, skipValidation: true };
    }
  }

  async hasExclusions(): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('client_exclusions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) {
        console.error('Error checking exclusions count:', error);
        return false;
      }

      return count !== null && count > 0;
    } catch (error) {
      console.error('Error checking if exclusions exist:', error);
      return false;
    }
  }
}