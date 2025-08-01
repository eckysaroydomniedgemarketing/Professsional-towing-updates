-- Create case_updates table
CREATE TABLE IF NOT EXISTS case_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT UNIQUE NOT NULL,
  last_update_date DATE,
  days_since_update INTEGER,
  case_worker TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  update_started_at TIMESTAMPTZ,
  update_completed_at TIMESTAMPTZ,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create case_details table
CREATE TABLE IF NOT EXISTS case_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (case_id) REFERENCES case_updates(case_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_case_updates_case_id ON case_updates(case_id);
CREATE INDEX idx_case_updates_status ON case_updates(status);
CREATE INDEX idx_case_details_case_id ON case_details(case_id);

-- Enable Row Level Security
ALTER TABLE case_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_details ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON case_updates
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON case_details
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);