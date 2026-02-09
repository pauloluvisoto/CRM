import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvqqmcwriuqrhnwjbtvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXFtY3dyaXVxcmhud2pidHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Njc5NTMsImV4cCI6MjA4NTA0Mzk1M30.kJy-6xd2LlEX_8BB_JM7sXAfJjLlmmERK1zhB9I7n4o';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLegacy() {
    console.log('--- CHECKING LEGACY COLUMNS TABLE ---');
    const { data: legacyColumns } = await supabase.from('columns').select('id, title, pipeline_id, position');
    console.table(legacyColumns?.map(c => ({
        id: c.id,
        title: c.title,
        pipeline: c.pipeline_id?.substring(0, 8),
        pos: c.position
    })));

    const { data: pipelines } = await supabase.from('pipelines').select('id, name');
    console.log('\n--- PIPELINES ---');
    console.table(pipelines);
}

checkLegacy();
