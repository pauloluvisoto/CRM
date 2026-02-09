-- 1. FIX: Ensure columns exist (Fix for 400 Bad Request)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS instagram_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS instagram_data JSONB DEFAULT '{}'::jsonb;

-- 2. FIX: Add index for performance
CREATE INDEX IF NOT EXISTS idx_clients_instagram_id ON clients(instagram_id);

-- 3. OPTIONAL: Add contact_name to conversations if you want to cache it there too
ALTER TABLE social_conversations
ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- 4. CLEANUP: Clear old chat data to start fresh (Removes "Desconhecido" garbage)
-- WARNING: This deletes all chat history. Only run if you want a clean slate.
TRUNCATE TABLE social_messages CASCADE;
TRUNCATE TABLE social_conversations CASCADE;
-- We don't delete clients to keep your customer base, but we can clear the instagram link if needed:
-- UPDATE clients SET instagram_id = NULL; 
