-- Migration: Add 'type' column to pipelines to decouple logic from display name

ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- Backfill existing data
UPDATE pipelines 
SET type = 'Receptivo' 
WHERE type IS NULL AND (name LIKE '%Receptivo%' OR name = 'Pipeline Padrão');

UPDATE pipelines 
SET type = 'Ativo' 
WHERE type IS NULL AND (name LIKE '%Ativo%' OR name = 'Prospecção Fria');

-- Default for others (safety net)
UPDATE pipelines
SET type = 'Receptivo'
WHERE type IS NULL;

-- Enable RLS for updates if not already (pipelines mostly likely public or protected)
-- Assuming authenticated users can update (for renaming)
CREATE POLICY "Authenticated users can update pipelines"
  ON pipelines FOR UPDATE
  USING (auth.role() = 'authenticated');
