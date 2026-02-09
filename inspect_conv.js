import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvqqmcwriuqrhnwjbtvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXFtY3dyaXVxcmhud2pidHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Njc5NTMsImV4cCI6MjA4NTA0Mzk1M30.kJy-6xd2LlEX_8BB_JM7sXAfJjLlmmERK1zhB9I7n4o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.rpc('get_table_definition', { table_name: 'social_conversations' });
    // Since I don't know if RPC exists, I'll try raw query if I could, but I can't.
    // Let's just check the columns and constraints via a simple select if it was possible.
    // I'll try to list constraints using a different approach.
}

// Let's just try to insert a dummy to see where it fails or check existing rows
async function inspect() {
    console.log("Inspecting social_conversations...");
    const { data, error } = await supabase.from('social_conversations').select('*').limit(1);
    console.log("Data:", data);
    console.log("Error:", error);
}

inspect();
