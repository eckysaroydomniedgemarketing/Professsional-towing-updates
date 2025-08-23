-- Create pending_close_log table for Module 6
CREATE TABLE IF NOT EXISTS public.pending_close_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL,
  vin_number TEXT,
  previous_status TEXT DEFAULT 'Pending Close',
  new_status TEXT DEFAULT 'Close',
  action_taken TEXT CHECK (action_taken IN ('status_changed', 'skipped', 'failed')),
  processing_mode TEXT CHECK (processing_mode IN ('manual', 'automatic')),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_by TEXT DEFAULT 'system',
  error_message TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_pending_close_log_case_id ON public.pending_close_log(case_id);
CREATE INDEX idx_pending_close_log_processed_at ON public.pending_close_log(processed_at);
CREATE INDEX idx_pending_close_log_action_taken ON public.pending_close_log(action_taken);

-- Add RLS policies
ALTER TABLE public.pending_close_log ENABLE ROW LEVEL SECURITY;

-- Policy for read access (all authenticated users can read)
CREATE POLICY "Allow read access to pending_close_log" ON public.pending_close_log
  FOR SELECT
  USING (true);

-- Policy for insert access (all authenticated users can insert)
CREATE POLICY "Allow insert to pending_close_log" ON public.pending_close_log
  FOR INSERT
  WITH CHECK (true);

-- Policy for update access (all authenticated users can update)
CREATE POLICY "Allow update to pending_close_log" ON public.pending_close_log
  FOR UPDATE
  USING (true);

-- Add comment
COMMENT ON TABLE public.pending_close_log IS 'Logs for Module 6 - Pending Close workflow processing';