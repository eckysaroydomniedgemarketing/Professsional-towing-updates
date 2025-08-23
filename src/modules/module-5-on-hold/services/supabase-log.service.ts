import { createClient } from '@supabase/supabase-js';
import { OnHoldLogEntry, ProcessingMode } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export class SupabaseLogService {
  private supabase = createClient(supabaseUrl, supabaseKey);
  private batchQueue: OnHoldLogEntry[] = [];
  
  async logCaseProcessing(entry: OnHoldLogEntry): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('on_hold_log')
        .insert(entry);
        
      if (error) {
        console.error('Error logging to database:', error);
      }
    } catch (error) {
      console.error('Supabase log error:', error);
    }
  }
  
  async batchLog(entries: OnHoldLogEntry[]): Promise<void> {
    if (entries.length === 0) return;
    
    try {
      const { error } = await this.supabase
        .from('on_hold_log')
        .insert(entries);
        
      if (error) {
        console.error('Batch log error:', error);
      }
    } catch (error) {
      console.error('Batch insert error:', error);
    }
  }
  
  addToBatch(entry: OnHoldLogEntry): void {
    this.batchQueue.push(entry);
    
    if (this.batchQueue.length >= 10) {
      this.flushBatch();
    }
  }
  
  async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;
    
    const entries = [...this.batchQueue];
    this.batchQueue = [];
    
    await this.batchLog(entries);
  }
  
  async getProcessedCases(mode?: ProcessingMode): Promise<any[]> {
    try {
      let query = this.supabase
        .from('on_hold_log')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (mode) {
        query = query.eq('processing_mode', mode);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching logs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Fetch error:', error);
      return [];
    }
  }
  
  async getTodayStats(): Promise<{ total: number; success: number; failed: number }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await this.supabase
        .from('on_hold_log')
        .select('action_taken')
        .gte('created_at', today.toISOString());
        
      if (error || !data) {
        return { total: 0, success: 0, failed: 0 };
      }
      
      const total = data.length;
      const success = data.filter(d => d.action_taken === 'status_changed').length;
      const failed = total - success;
      
      return { total, success, failed };
    } catch (error) {
      console.error('Stats error:', error);
      return { total: 0, success: 0, failed: 0 };
    }
  }
}