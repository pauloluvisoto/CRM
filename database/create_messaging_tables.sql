-- Migration: Create Messaging System Tables
-- Description: Supports Instagram and WhatsApp integrations

-- 1. Table: conversations
-- Stores the high-level chat state between the CRM and a lead/client
CREATE TABLE IF NOT EXISTS social_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  platform VARCHAR(50) NOT NULL, -- 'instagram', 'whatsapp'
  external_id VARCHAR(255) NOT NULL, -- IGSID or Phone Number
  
  contact_id UUID REFERENCES central_vendas(id) ON DELETE SET NULL, -- Link to a Deal
  
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate conversations for the same external ID on the same platform
  UNIQUE(platform, external_id)
);

-- 2. Table: social_messages
-- Stores individual chat bubbles
CREATE TABLE IF NOT EXISTS social_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  conversation_id UUID REFERENCES social_conversations(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')), -- 'inbound' (from customer), 'outbound' (from CRM)
  
  external_id VARCHAR(255), -- Message ID from platform (e.g., mid.xxx)
  metadata JSONB DEFAULT '{}'::jsonb -- For complex objects (images, reactions, etc.)
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conv_external ON social_conversations(external_id);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON social_messages(conversation_id);

-- 4. RLS Policies
ALTER TABLE social_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_messages ENABLE ROW LEVEL SECURITY;

-- Simple policy: authenticated users can see everything for now (or refine by created_by if needed)
CREATE POLICY "Allow authenticated access to conversations" ON social_conversations
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated access to messages" ON social_messages
  FOR ALL TO authenticated USING (true);

-- 5. Trigger for updated_at
CREATE TRIGGER update_social_conversations_updated_at
  BEFORE UPDATE ON social_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
