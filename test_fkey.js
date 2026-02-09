import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvqqmcwriuqrhnwjbtvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXFtY3dyaXVxcmhud2pidHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Njc5NTMsImV4cCI6MjA4NTA0Mzk1M30.kJy-6xd2LlEX_8BB_JM7sXAfJjLlmmERK1zhB9I7n4o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('social_conversations').insert({
        contact_id: '84d2712a-b0c8-4d88-9767-c4d173076813', // Copying from user's screenshot
        platform: 'test',
        external_id: 'test'
    });

    if (error) {
        console.log("INSERT ERROR:", error.message);
        console.log("DETAILS:", error.details);
    } else {
        console.log("INSERT SUCCESS");
        // Cleanup
        await supabase.from('social_conversations').delete().eq('external_id', 'test');
    }
}

check();
