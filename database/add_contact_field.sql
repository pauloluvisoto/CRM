
-- Migration: Add Contact Name and Social Fields
-- This script adds necessary columns to central_vendas table

-- 1. Add nome_contato (Contact Name)
ALTER TABLE central_vendas 
ADD COLUMN IF NOT EXISTS nome_contato VARCHAR(255);

-- 2. Add instagram (Instagram handle or link)
ALTER TABLE central_vendas 
ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);

-- 3. Add whatsapp (WhatsApp phone number)
ALTER TABLE central_vendas 
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(100);

-- Comments for documentation
COMMENT ON COLUMN central_vendas.nome_contato IS 'Name of the contact person at the company';
COMMENT ON COLUMN central_vendas.instagram IS 'Instagram handle or profile link';
COMMENT ON COLUMN central_vendas.whatsapp IS 'WhatsApp contact number';
