import { createClient } from '@supabase/supabase-js';

// Credentials
const supabaseUrl = 'https://hvqqmcwriuqrhnwjbtvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXFtY3dyaXVxcmhud2pidHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Njc5NTMsImV4cCI6MjA4NTA0Mzk1M30.kJy-6xd2LlEX_8BB_JM7sXAfJjLlmmERK1zhB9I7n4o';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
    console.log('--- SEEDING CENTRAL_VENDAS MOCK DATA NO PROBABILITY ---');

    const targetStages = [
        'receptivo_lead', 'receptivo_qualificacao', 'receptivo_agendada', 'receptivo_proposta', 'receptivo_fechamento',
        'ativo_abordagem', 'ativo_aguardando', 'ativo_rvp', 'ativo_proposta', 'ativo_followup'
    ];

    // 1. Clear old deals
    console.log('Clearing old deals...');
    const { error: errorDelete } = await supabase.from('central_vendas')
        .delete()
        .in('stage', targetStages);

    if (errorDelete) console.error('Error clearing deals:', errorDelete.message);

    // 2. Insert Receptivo (Inbound)
    const inboundDeals = [
        { empresa_cliente: 'Grupo Silva - ERP', faturamento_mensal: 12500.00, stage: 'receptivo_lead', tipo_pipeline: 'Receptivo', nome_contato: 'Roberto Silva' },
        { empresa_cliente: 'TechSoft Inc', faturamento_mensal: 45000.00, stage: 'receptivo_lead', tipo_pipeline: 'Receptivo', nome_contato: 'Amanda Jones' },
        { empresa_cliente: 'Startup X - App', faturamento_mensal: 18000.00, stage: 'receptivo_qualificacao', tipo_pipeline: 'Receptivo', nome_contato: 'Pedro H.' },
        { empresa_cliente: 'Construtora Forte', faturamento_mensal: 32000.00, stage: 'receptivo_agendada', tipo_pipeline: 'Receptivo', nome_contato: 'Marcos' },
        { empresa_cliente: 'Loja Virtual Top', faturamento_mensal: 22000.00, stage: 'receptivo_proposta', tipo_pipeline: 'Receptivo', nome_contato: 'Felipe' }
    ];

    console.log('Inserting Inbound...');
    const { error: errorIns1 } = await supabase.from('central_vendas').insert(inboundDeals);
    if (errorIns1) console.error('Error inserting Inbound:', errorIns1.message);

    // 3. Insert Ativo (Outbound)
    const outboundDeals = [
        { empresa_cliente: 'Indústria Alpha (Cold)', faturamento_mensal: 0, stage: 'ativo_abordagem', tipo_pipeline: 'Ativo_Diagnostico', nome_contato: 'Gerente Compras' },
        { empresa_cliente: 'Rede Hoteleira', faturamento_mensal: 15000.00, stage: 'ativo_aguardando', tipo_pipeline: 'Ativo_Diagnostico', nome_contato: 'Diretor' },
        { empresa_cliente: 'Transportadora BR', faturamento_mensal: 40000.00, stage: 'ativo_rvp', tipo_pipeline: 'Ativo_Diagnostico', nome_contato: 'Logística' },
        { empresa_cliente: 'Multinacional Z', faturamento_mensal: 120000.00, stage: 'ativo_proposta', tipo_pipeline: 'Ativo_Diagnostico', nome_contato: 'VP Vendas' }
    ];

    console.log('Inserting Outbound...');
    const { error: errorIns2 } = await supabase.from('central_vendas').insert(outboundDeals);
    if (errorIns2) console.error('Error inserting Outbound:', errorIns2.message);

    console.log('--- DONE ---');
}

seed();
