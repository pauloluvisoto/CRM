
-- ATUALIZAÇÃO DO SISTEMA DE METAS (Novas Métricas)
ALTER TABLE public.user_goals 
ADD COLUMN IF NOT EXISTS sales_qty_goal INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lead_to_meeting_goal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS no_show_rate_goal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS meeting_to_sale_goal NUMERIC DEFAULT 0;

-- Opcional: Remover colunas antigas se não forem mais usadas, 
-- mas por segurança vamos apenas adicionar as novas.
