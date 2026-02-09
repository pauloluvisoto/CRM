-- Synchronize pipeline_stages colors with dashboard KPI colors
UPDATE pipeline_stages 
SET color = CASE 
    WHEN UPPER(name) = 'NOVO LEAD' THEN '#3b82f6'
    WHEN UPPER(name) = 'QUALIFICAÇÃO' THEN '#f59e0b'
    WHEN UPPER(name) = 'REUNIÃO AGENDADA' THEN '#6366f1'
    WHEN UPPER(name) = 'PROPOSTA ENVIADA' THEN '#3b82f6'
    WHEN UPPER(name) = 'EM FOLLOW UP' THEN '#a855f7'
    WHEN UPPER(name) = 'NO SHOW' THEN '#ef4444'
    WHEN UPPER(name) = 'NEGÓCIO FECHADO' THEN '#10b981'
    WHEN UPPER(name) = 'ONBOARDING' THEN '#10b981'
    WHEN UPPER(name) = 'NEGÓCIO PERDIDO' THEN '#ef4444'
    ELSE color
END;
