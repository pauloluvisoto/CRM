import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvqqmcwriuqrhnwjbtvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXFtY3dyaXVxcmhud2pidHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Njc5NTMsImV4cCI6MjA4NTA0Mzk1M30.kJy-6xd2LlEX_8BB_JM7sXAfJjLlmmERK1zhB9I7n4o';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStages() {
    console.log('--- CHECKING STANDARD STAGES ---');
    const standardIds = [
        'receptivo_lead', 'receptivo_qualificacao', 'receptivo_agendada', 'receptivo_proposta', 'receptivo_fechamento',
        'ativo_lead', 'ativo_contato', 'ativo_diagnostico', 'ativo_proposta', 'ativo_fechamento'
    ];

    const { data: stages } = await supabase.from('pipeline_stages').select('id, name');
    const foundIds = stages?.map(s => s.id) || [];

    console.log('IDs in pipeline_stages:', foundIds);

    const missing = standardIds.filter(id => !foundIds.includes(id));
    console.log('Missing standard IDs:', missing);

    if (missing.length > 0) {
        console.log('WARNING: Standard stages are missing from pipeline_stages table. This will break mapping.');
    } else {
        console.log('SUCCESS: All standard stages are present.');
    }
}

checkStages();
