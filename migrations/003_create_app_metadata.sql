-- Migration: App Metadata for Configuration
-- Date: 2026-02-11
-- Description: Creates a table to store application configuration (replacing JSON files)

CREATE TABLE IF NOT EXISTS app_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial schema_financeiro.json content
INSERT INTO app_metadata (key, value)
VALUES ('schema_financeiro', '{
    "receitas": {
        "total": {
            "bp": 33900,
            "real": 0
        },
        "fixa": {
            "bp": 28650,
            "real": 0
        },
        "variavel": {
            "bp": 1500,
            "real": 0
        }
    },
    "custos": {
        "cogs": {
            "bp": 9660,
            "real": 0
        },
        "impostos": {
            "bp": 2864,
            "real": 0
        },
        "administrativo": {
            "bp": 3050,
            "real": 0
        },
        "salarios": {
            "bp": 7200,
            "real": 0
        },
        "marketing": {
            "bp": 5000,
            "real": 0
        },
        "software": {
            "bp": 600,
            "real": 0
        },
        "despesasFixas": {
            "bp": 15850,
            "real": 0
        }
    },
    "margens": {
        "resultadoBruto": {
            "bp": 21376,
            "real": 0
        },
        "lucroLiquido": {
            "bp": 5526,
            "real": 0
        }
    },
    "metas_comerciais": {
        "leads": 1986,
        "reunioes": 151,
        "vendas": 51,
        "ticket_medio": 597
    },
    "inadimplencia_total": 0,
    "last_update": "2026-02-08T22:31:12.101Z"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create function to update updated_at
CREATE TRIGGER update_app_metadata_updated_at
    BEFORE UPDATE ON app_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
