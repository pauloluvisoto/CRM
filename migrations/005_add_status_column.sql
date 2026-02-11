
-- Migration: Add status column to social_messages table
-- Date: 2026-02-11
-- Description: Adds 'status' column to track message delivery status (sent, delivered, read, received)

ALTER TABLE IF EXISTS public.social_messages 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'received';

CREATE INDEX IF NOT EXISTS idx_social_messages_status ON public.social_messages(status);

-- Optional: Update existing rows to have default status if needed (but the ALTER TABLE does not update existing DEFAULT without UPDATE)
UPDATE public.social_messages SET status = 'received' WHERE status IS NULL;
