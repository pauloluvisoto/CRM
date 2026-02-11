-- Migration: Add instagram_username field to central_vendas
-- Description: Allows storing Instagram username (@handle) instead of numeric ID

-- Add the new column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'central_vendas' 
        AND column_name = 'instagram_username'
    ) THEN
        ALTER TABLE central_vendas 
        ADD COLUMN instagram_username TEXT;
        
        -- Optionally create an index for faster searches
        CREATE INDEX IF NOT EXISTS idx_central_vendas_instagram_username 
        ON central_vendas(instagram_username);
    END IF;
END $$;

-- Migration note: 
-- The 'instagram' column will remain as numeric ID for backwards compatibility
-- The new 'instagram_username' will store the @ handle (e.g., @usuario)
