import type { 
  VisibilityLogEntry, 
  VisibilityReport, 
  ProcessingStats, 
  DailySummary 
} from '../types';
import { supabaseServerService } from './supabase-server.service';

class VisibilityLogService {
  /**
   * Log case processing with visibility update count
   */
  async logCaseVisibilityUpdate(
    caseId: string,
    updatesCount: number,
    mode: 'manual' | 'automatic',
    company?: string,
    updateText?: string
  ): Promise<{ data: string | null; error: any }> {
    try {
      const supabase = supabaseServerService.getClient();
      
      // Direct insert instead of RPC function
      const { data, error } = await supabase
        .from('agent_update_visibility_log')
        .insert({
          case_id: caseId,
          updates_made_visible: updatesCount,
          processing_mode: mode,
          company: company,
          update_text: updateText
        })
        .select('id')
        .single();

      if (error) throw error;
      return { data: data?.id || null, error: null };
    } catch (error) {
      console.error('Error logging visibility update:', error);
      return { data: null, error };
    }
  }

  /**
   * Convert UTC to IST timezone
   */
  private convertToIST(utcDate: string): string {
    const date = new Date(utcDate);
    // Add 5 hours 30 minutes for IST
    date.setHours(date.getHours() + 5);
    date.setMinutes(date.getMinutes() + 30);
    
    // Format as YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Get visibility report with optional date filtering
   */
  async getVisibilityReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<{ data: VisibilityReport[] | null; error: any }> {
    try {
      const supabase = supabaseServerService.getClient();
      
      // Build query
      let query = supabase
        .from('agent_update_visibility_log')
        .select('*')
        .order('created_at', { ascending: false });

      // Add date filters if provided
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match VisibilityReport interface
      const transformedData: VisibilityReport[] = data?.map(row => ({
        id: row.id,
        date_ist: this.convertToIST(row.created_at),
        case_id: row.case_id,
        updates_made_visible: row.updates_made_visible,
        processing_mode: row.processing_mode,
        status: row.updates_made_visible > 0 ? 'Processed' : 'Skipped'
      })) || [];

      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Error fetching visibility report:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if case was already processed today
   */
  async isCaseProcessedToday(caseId: string): Promise<{ exists: boolean; error: any }> {
    try {
      const supabase = supabaseServerService.getClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('agent_update_visibility_log')
        .select('id')
        .eq('case_id', caseId)
        .gte('created_at', today.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      return { exists: !!data, error: null };
    } catch (error) {
      console.error('Error checking case processing status:', error);
      return { exists: false, error };
    }
  }

  /**
   * Get processing statistics for dashboard
   */
  async getProcessingStats(): Promise<{ data: ProcessingStats | null; error: any }> {
    try {
      const supabase = supabaseServerService.getClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('agent_update_visibility_log')
        .select('updates_made_visible, processing_mode')
        .gte('created_at', today.toISOString());

      if (error) throw error;

      const stats: ProcessingStats = {
        totalCases: data?.length || 0,
        totalUpdates: data?.reduce((sum, row) => sum + row.updates_made_visible, 0) || 0,
        manualCases: data?.filter(row => row.processing_mode === 'manual').length || 0,
        automaticCases: data?.filter(row => row.processing_mode === 'automatic').length || 0,
        skippedCases: data?.filter(row => row.updates_made_visible === 0).length || 0
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching processing stats:', error);
      return { data: null, error };
    }
  }

  /**
   * Get daily summary from view
   */
  async getDailySummary(
    limit: number = 30
  ): Promise<{ data: DailySummary[] | null; error: any }> {
    try {
      const supabase = supabaseServerService.getClient();
      const { data, error } = await supabase
        .from('agent_visibility_daily_summary')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      return { data: null, error };
    }
  }

  /**
   * Export report data to CSV format
   */
  exportToCSV(data: VisibilityReport[]): string {
    const headers = ['Date (IST)', 'Case ID', 'Updates Made Visible', 'Processing Mode', 'Status'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.date_ist}"`,
        `"${row.case_id}"`,
        row.updates_made_visible,
        `"${row.processing_mode}"`,
        `"${row.status}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Download CSV file
   */
  downloadCSV(data: VisibilityReport[], filename: string = 'visibility-report.csv'): void {
    const csvContent = this.exportToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Delete a log entry by ID
   */
  async deleteLogEntry(logId: string): Promise<{ success: boolean; error: any }> {
    try {
      const supabase = supabaseServerService.getClient();
      const { error } = await supabase
        .from('agent_update_visibility_log')
        .delete()
        .eq('id', logId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting log entry:', error);
      return { success: false, error };
    }
  }

  /**
   * Subscribe to real-time visibility updates
   */
  subscribeToUpdates(callback: (payload: any) => void) {
    const supabase = supabaseServerService.getClient();
    const subscription = supabase
      .channel('visibility-updates')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_update_visibility_log'
        },
        (payload) => {
          console.log('New case processed:', payload.new);
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribeFromUpdates(subscription: any) {
    const supabase = supabaseServerService.getClient();
    supabase.removeChannel(subscription);
  }
}

export const visibilityLogService = new VisibilityLogService();