-- Pipeline Stages Schema
-- Allows dynamic ordering and naming of pipeline columns

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id VARCHAR(50) PRIMARY KEY, -- Changed from UUID to preserve existing keys like 'novo_lead'
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL,
  color VARCHAR(50) DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_position ON pipeline_stages(position);

-- RLS
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Policies (Assuming open for authenticated users for now)
CREATE POLICY "Authenticated users can view stages"
  ON pipeline_stages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update stages"
  ON pipeline_stages FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert stages"
  ON pipeline_stages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete stages"
  ON pipeline_stages FOR DELETE
  USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE pipeline_stages IS 'Stores ordered columns/stages for each pipeline';
