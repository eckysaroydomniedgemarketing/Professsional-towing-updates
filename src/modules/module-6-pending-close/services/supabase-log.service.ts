import { createClient } from '@supabase/supabase-js';
import type { PendingCloseLog, WorkflowStats } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export class SupabaseLogService {
  private supabase = createClient(supabaseUrl, supabaseKey);
  private batchedLogs: PendingCloseLog[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  
  /**
   * Log a case processing event
   */
  async logCaseProcessing(log: PendingCloseLog): Promise<void> {
    // Add to batch
    this.batchedLogs.push(log);
    
    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    // Set timer to flush batch after 2 seconds
    this.batchTimer = setTimeout(() => {
      this.flushBatch();
    }, 2000);
    
    // Flush immediately if batch is large
    if (this.batchedLogs.length >= 10) {
      await this.flushBatch();
    }
  }
  
  /**
   * Flush batched logs to database
   */
  async flushBatch(): Promise<void> {
    if (this.batchedLogs.length === 0) return;
    
    const logsToFlush = [...this.batchedLogs];
    this.batchedLogs = [];
    
    try {
      const { error } = await this.supabase
        .from('pending_close_log')
        .insert(logsToFlush);
      
      if (error) {
        console.error('[PENDING-CLOSE] Error flushing logs:', error);
        // Re-add failed logs to batch
        this.batchedLogs.unshift(...logsToFlush);
      } else {
        console.log(`[PENDING-CLOSE] Flushed ${logsToFlush.length} logs to database`);
      }
    } catch (error) {
      console.error('[PENDING-CLOSE] Error flushing logs:', error);
      // Re-add failed logs to batch
      this.batchedLogs.unshift(...logsToFlush);
    }
  }
  
  /**
   * Get processed cases for today
   */
  async getProcessedCases(): Promise<PendingCloseLog[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await this.supabase
      .from('pending_close_log')
      .select('*')
      .gte('processed_at', today.toISOString())
      .order('processed_at', { ascending: false });
    
    if (error) {
      console.error('[PENDING-CLOSE] Error fetching cases:', error);
      return [];
    }
    
    return data || [];
  }
  
  /**
   * Get statistics for today
   */
  async getTodayStats(): Promise<WorkflowStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await this.supabase
      .from('pending_close_log')
      .select('action_taken')
      .gte('processed_at', today.toISOString());
    
    if (error) {
      console.error('[PENDING-CLOSE] Error fetching stats:', error);
      return { total: 0, success: 0, failed: 0 };
    }
    
    const stats = {
      total: data?.length || 0,
      success: data?.filter(d => d.action_taken === 'status_changed').length || 0,
      failed: data?.filter(d => d.action_taken === 'failed').length || 0
    };
    
    return stats;
  }
  
  /**
   * Delete a specific log entry
   */
  async deleteLog(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('pending_close_log')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[PENDING-CLOSE] Error deleting log:', error);
      return false;
    }
    
    return true;
  }
}