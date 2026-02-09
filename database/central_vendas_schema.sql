-- Central de Vendas Schema
-- Created: 2026-01-29
-- Description: Core table for Recupera.ia CRM Regeneration

-- =====================================================
-- TABLE: central_vendas
-- Description: Centralizes all sales data for Receptivo and Ativo pipelines
-- =====================================================
CREATE TABLE IF NOT EXISTS central_vendas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Core Deal Info
  empresa_cliente VARCHAR(255) NOT NULL,
  faturamento_mensal DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Pipeline Control
  tipo_pipeline VARCHAR(50) NOT NULL CHECK (tipo_pipeline IN ('Receptivo', 'Ativo_Diagnostico')),
  stage VARCHAR(50) DEFAULT 'Novo Lead', -- Stage tracking for pipelines
  
  -- Financial & Commission
  -- Comissao is 1.2% (0.012) of Faturamento_Mensal
  comissao_estimada DECIMAL(12,2) GENERATED ALWAYS AS (faturamento_mensal * 0.012) STORED,
  
  -- Contract Management
  status_contrato VARCHAR(50) DEFAULT 'Nao_Gerado' CHECK (status_contrato IN ('Nao_Gerado', 'Gerado', 'Assinado')),
  link_contrato_pdf TEXT,
  
  -- Engagement Tracking (Ativo Pipeline logic)
  data_ultima_tentativa TIMESTAMP WITH TIME ZONE,
  contador_tentativas INTEGER DEFAULT 0,
  
  -- Constraints
  CONSTRAINT check_faturamento_positive CHECK (faturamento_mensal >= 0)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_central_vendas_pipeline ON central_vendas(tipo_pipeline);
CREATE INDEX IF NOT EXISTS idx_central_vendas_status_contrato ON central_vendas(status_contrato);
CREATE INDEX IF NOT EXISTS idx_central_vendas_user ON central_vendas(created_by);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE central_vendas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own deals"
  ON central_vendas FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own deals"
  ON central_vendas FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own deals"
  ON central_vendas FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own deals"
  ON central_vendas FOR DELETE
  USING (auth.uid() = created_by);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE TRIGGER update_central_vendas_updated_at
  BEFORE UPDATE ON central_vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE central_vendas IS 'Central table for all CRM deals (Receptivo and Ativo)';
COMMENT ON COLUMN central_vendas.comissao_estimada IS 'Automatically calculated as 1.2% of Faturamento Mensal';
COMMENT ON COLUMN central_vendas.contador_tentativas IS 'Tracks attempts for Leads no Limbo logic';
