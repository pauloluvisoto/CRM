-- Migration: Add Instagram fields to clients table
-- Description: Supports linking an Instagram User (IGSID) to a Business Client

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS instagram_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS instagram_data JSONB DEFAULT '{}'::jsonb;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_instagram_id ON clients(instagram_id);
