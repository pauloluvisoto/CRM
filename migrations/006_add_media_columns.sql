
-- Migration: Add media_url and media_type columns to social_messages
-- Date: 2026-02-11

ALTER TABLE IF EXISTS public.social_messages 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT; 
-- media_type can be 'image', 'video', 'audio', 'document', 'sticker', 'text' (default implicit)

CREATE INDEX IF NOT EXISTS idx_social_messages_media_type ON public.social_messages(media_type);
