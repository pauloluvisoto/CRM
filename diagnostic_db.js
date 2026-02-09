import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvqqmcwriuqrhnwjbtvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXFtY3dyaXVxcmhud2pidHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Njc5NTMsImV4cCI6MjA4NTA0Mzk1M30.kJy-6xd2LlEX_8BB_JM7sXAfJjLlmmERK1zhB9I7n4o';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnostic() {
    console.log('--- DIAGNOSTIC START ---');

    // 1. Fetch Stages
    const { data: stages } = await supabase.from('pipeline_stages').select('id, name, pipeline_id, position');
    console.log('\n--- PIPELINE STAGES ---');
    console.table(stages?.map(s => ({
        id: s.id,
        name: s.name,
        pipeline: s.pipeline_id.substring(0, 8) + '...',
        pos: s.position
    })));

    // 2. Fetch Deals
    const { data: deals } = await supabase.from('central_vendas').select('id, empresa_cliente, stage, tipo_pipeline').limit(20);
    console.log('\n--- DEALS (Recent) ---');
    console.table(deals?.map(d => ({
        id: d.id.substring(0, 8) + '...',
        name: d.empresa_cliente,
        stage: d.stage,
        type: d.tipo_pipeline
    })));

    // 3. Count total deals
    const { count } = await supabase.from('central_vendas').select('*', { count: 'exact', head: true });
    console.log(`\nTotal deal count: ${count}`);

    console.log('\n--- DIAGNOSTIC END ---');
}

diagnostic();
