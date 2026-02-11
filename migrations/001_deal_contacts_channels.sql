-- Migration: Sistema de Relacionamento Negócios-Contatos-Canais
-- Data: 2026-02-10
-- Descrição: Cria estrutura hierárquica Deal → Contacts → Message Channels

-- ============================================
-- 1. TABELA: deal_contacts (Relacionamento N:N)
-- ============================================
CREATE TABLE IF NOT EXISTS deal_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES central_vendas(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  role_in_deal TEXT, -- Ex: "Dono", "Gerente", "Decisor", "Influenciador"
  notes TEXT, -- Notas sobre o papel desta pessoa no negócio
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deal_id, contact_id) -- Evita duplicatas
);

-- ============================================
-- 2. TABELA: message_channels (Canais de Comunicação)
-- ============================================
CREATE TABLE IF NOT EXISTS message_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_type TEXT NOT NULL CHECK (channel_type IN ('whatsapp', 'instagram', 'email', 'phone', 'telegram', 'other')),
  channel_identifier TEXT NOT NULL, -- Número, username, email
  channel_name TEXT, -- Nome amigável do canal (ex: "WhatsApp Pessoal", "Instagram Empresa")
  
  -- Vinculação Flexível
  linked_to_type TEXT NOT NULL CHECK (linked_to_type IN ('deal', 'contact')),
  linked_to_id UUID NOT NULL, -- ID do negócio ou contato
  
  -- Rastreabilidade
  deal_id UUID NOT NULL REFERENCES central_vendas(id) ON DELETE CASCADE, -- Sempre preenchido
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- Preenchido se canal é de pessoa específica
  
  -- Metadados
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(channel_type, channel_identifier) -- Evita duplicar mesmo canal
);

-- ============================================
-- 3. ÍNDICES para Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_deal_contacts_deal ON deal_contacts(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_contacts_contact ON deal_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_deal_contacts_primary ON deal_contacts(is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_message_channels_deal ON message_channels(deal_id);
CREATE INDEX IF NOT EXISTS idx_message_channels_contact ON message_channels(contact_id);
CREATE INDEX IF NOT EXISTS idx_message_channels_type ON message_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_message_channels_linked ON message_channels(linked_to_type, linked_to_id);

-- ============================================
-- 4. TRIGGERS para updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_deal_contacts_updated_at
    BEFORE UPDATE ON deal_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_channels_updated_at
    BEFORE UPDATE ON message_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. RLS (Row Level Security) - Opcional
-- ============================================
-- Habilitar RLS se necessário
-- ALTER TABLE deal_contacts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE message_channels ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (exemplo básico)
-- CREATE POLICY "Users can view their own deal contacts"
--   ON deal_contacts FOR SELECT
--   USING (deal_id IN (SELECT id FROM central_vendas WHERE created_by = auth.uid()));

-- ============================================
-- 6. VIEWS Úteis
-- ============================================

-- View: Negócios com seus contatos
CREATE OR REPLACE VIEW deals_with_contacts AS
SELECT 
  d.id as deal_id,
  d.empresa_cliente as deal_name,
  d.stage,
  d.tipo_pipeline,
  json_agg(
    json_build_object(
      'contact_id', c.id,
      'name', c.name,
      'email', c.email,
      'phone', c.phone,
      'role_in_deal', dc.role_in_deal,
      'is_primary', dc.is_primary
    )
  ) FILTER (WHERE c.id IS NOT NULL) as contacts
FROM central_vendas d
LEFT JOIN deal_contacts dc ON d.id = dc.deal_id
LEFT JOIN contacts c ON dc.contact_id = c.id
GROUP BY d.id, d.empresa_cliente, d.stage, d.tipo_pipeline;

-- View: Contatos com seus negócios
CREATE OR REPLACE VIEW contacts_with_deals AS
SELECT 
  c.id as contact_id,
  c.name,
  c.email,
  c.phone,
  c.company,
  json_agg(
    json_build_object(
      'deal_id', d.id,
      'deal_name', d.empresa_cliente,
      'role_in_deal', dc.role_in_deal,
      'is_primary', dc.is_primary,
      'stage', d.stage
    )
  ) FILTER (WHERE d.id IS NOT NULL) as deals
FROM contacts c
LEFT JOIN deal_contacts dc ON c.id = dc.contact_id
LEFT JOIN central_vendas d ON dc.deal_id = d.id
GROUP BY c.id, c.name, c.email, c.phone, c.company;

-- View: Canais de mensagem com contexto completo
CREATE OR REPLACE VIEW channels_with_context AS
SELECT 
  mc.id as channel_id,
  mc.channel_type,
  mc.channel_identifier,
  mc.channel_name,
  mc.linked_to_type,
  mc.is_active,
  mc.last_message_at,
  d.empresa_cliente as deal_name,
  c.name as contact_name,
  c.email as contact_email
FROM message_channels mc
LEFT JOIN central_vendas d ON mc.deal_id = d.id
LEFT JOIN contacts c ON mc.contact_id = c.id;

-- ============================================
-- 7. COMENTÁRIOS nas Tabelas
-- ============================================
COMMENT ON TABLE deal_contacts IS 'Relacionamento N:N entre negócios e contatos (pessoas)';
COMMENT ON TABLE message_channels IS 'Canais de comunicação vinculados a negócios ou contatos específicos';

COMMENT ON COLUMN deal_contacts.is_primary IS 'Indica se este é o contato principal do negócio';
COMMENT ON COLUMN deal_contacts.role_in_deal IS 'Papel da pessoa no negócio (Dono, Gerente, Decisor, etc)';

COMMENT ON COLUMN message_channels.linked_to_type IS 'Tipo de entidade vinculada: deal (negócio) ou contact (pessoa)';
COMMENT ON COLUMN message_channels.linked_to_id IS 'ID da entidade vinculada (deal_id ou contact_id)';
COMMENT ON COLUMN message_channels.deal_id IS 'Referência ao negócio (sempre preenchido para rastreabilidade)';
COMMENT ON COLUMN message_channels.contact_id IS 'Referência ao contato (preenchido se canal é de pessoa específica)';
