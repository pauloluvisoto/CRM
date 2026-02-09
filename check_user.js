import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvqqmcwriuqrhnwjbtvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXFtY3dyaXVxcmhud2pidHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Njc5NTMsImV4cCI6MjA4NTA0Mzk1M30.kJy-6xd2LlEX_8BB_JM7sXAfJjLlmmERK1zhB9I7n4o';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
    console.log('--- USER CHECK ---');
    const email = 'pluvisoto@gmail.com';
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (error) {
        console.error('Error fetching profile:', error.message);
    } else {
        console.log('Profile found:', JSON.stringify(profile, null, 2));
    }
}

checkUser();
