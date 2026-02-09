import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvqqmcwriuqrhnwjbtvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXFtY3dyaXVxcmhud2pidHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Njc5NTMsImV4cCI6MjA4NTA0Mzk1M30.kJy-6xd2LlEX_8BB_JM7sXAfJjLlmmERK1zhB9I7n4o';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deepDiagnostic() {
    console.log('--- DEEP DIAGNOSTIC START ---');

    // 1. Check Pipelines
    const { data: pipelines } = await supabase.from('pipelines').select('id, name, type');
    console.log('\n[PIPELINES]');
    console.table(pipelines);

    // 2. Check All Stages
    const { data: stages } = await supabase.from('pipeline_stages').select('id, name, pipeline_id, position');
    console.log('\n[PIPELINE STAGES]');
    console.table(stages?.map(s => ({
        id: s.id,
        name: s.name,
        pipelineId: s.pipeline_id,
        pos: s.position
    })));

    // 3. Check Central Vendas (Samples)
    const { data: deals } = await supabase.from('central_vendas').select('id, empresa_cliente, stage, tipo_pipeline').limit(50);
    console.log('\n[DEALS SAMPLES]');
    if (deals && deals.length > 0) {
        const stageIds = stages?.map(s => s.id) || [];
        console.table(deals.map(d => ({
            id: d.id.substring(0, 8),
            empresa: d.empresa_cliente,
            stageInDb: d.stage,
            pipelineType: d.tipo_pipeline,
            isValidStage: stageIds.includes(d.stage) ? 'YES' : 'NO !!!'
        })));
    } else {
        console.log('No deals found in central_vendas.');
    }

    // 4. Check Legacy Data in 'deals' table
    const { data: legacyDeals } = await supabase.from('deals').select('id, title, column_id').limit(10);
    console.log('\n[LEGACY DEALS SAMPLES]');
    console.table(legacyDeals);

    console.log('\n--- DEEP DIAGNOSTIC END ---');
}

deepDiagnostic();
