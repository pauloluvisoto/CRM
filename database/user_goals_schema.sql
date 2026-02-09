
-- SISTEMA DE METAS (Passo 3)
CREATE TABLE IF NOT EXISTS public.user_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    revenue_goal NUMERIC DEFAULT 0,
    leads_goal INTEGER DEFAULT 0,
    meetings_goal INTEGER DEFAULT 0,
    month INTEGER,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month, year)
);

-- RLS
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goals"
ON public.user_goals
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Para simplificar o acesso na visão geral (Admin/Supervisor)
CREATE POLICY "Admins can view all goals"
ON public.user_goals
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
);
