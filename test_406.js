import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvqqmcwriuqrhnwjbtvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXFtY3dyaXVxcmhud2pidHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Njc5NTMsImV4cCI6MjA4NTA0Mzk1M30.kJy-6xd2LlEX_8BB_JM7sXAfJjLlmmERK1zhB9I7n4o';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test406() {
    console.log('--- TESTING 406 CAUSE ---');
    const userId = '9e56cc13-ba79-4ac5-8ef9-58306a9f4504';

    // Test 1: Renaming role:role with .single()
    const { data, error } = await supabase.from('profiles').select('role:role').eq('id', userId).single();
    if (error) {
        console.log('Test 1 Failed (with rename + single):', error.message, 'Code:', error.code);
    } else {
        console.log('Test 1 Success:', data);
    }

    // Test 2: Standard select with .single()
    const { data: d2, error: e2 } = await supabase.from('profiles').select('role, status').eq('id', userId).single();
    if (e2) {
        console.log('Test 2 Failed (standard + single):', e2.message, 'Code:', e2.code);
    } else {
        console.log('Test 2 Success:', d2);
    }

    // Test 3: Maybe single (PostgREST equivalent of not using object header if 0 rows)
    const { data: d3, error: e3 } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    console.log('Test 3 (maybeSingle) result:', d3, 'Error:', e3?.message);
}

test406();
