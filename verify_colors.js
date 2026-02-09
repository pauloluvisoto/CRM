
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvqqmcwriuqrhnwjbtvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXFtY3dyaXVxcmhud2pidHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Njc5NTMsImV4cCI6MjA4NTA0Mzk1M30.kJy-6xd2LlEX_8BB_JM7sXAfJjLlmmERK1zhB9I7n4o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyColors() {
    const { data: stages, error } = await supabase
        .from('pipeline_stages')
        .select('name, color');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Current Stages in DB:');
    stages.forEach(s => {
        console.log(`- ${s.name}: ${s.color}`);
    });
}

verifyColors();
