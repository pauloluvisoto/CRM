import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvqqmcwriuqrhnwjbtvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXFtY3dyaXVxcmhud2pidHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Njc5NTMsImV4cCI6MjA4NTA0Mzk1M30.kJy-6xd2LlEX_8BB_JM7sXAfJjLlmmERK1zhB9I7n4o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const targetId = '84d2712a-b0c8-4d88-9767-c4d173076813';
    console.log(`Checking if ID ${targetId} exists in 'clients' table...`);

    const { data: client, error: clientErr } = await supabase
        .from('clients')
        .select('id, company_name')
        .eq('id', targetId)
        .maybeSingle();

    if (clientErr) {
        console.log("Error checking client:", clientErr.message);
    } else if (client) {
        console.log(`CLIENT FOUND: ${client.company_name}`);
    } else {
        console.log("CLIENT NOT FOUND IN 'clients' TABLE!");
    }

    // Checking the error again to see the constraint message
    const { error: insertErr } = await supabase.from('social_conversations').insert({
        contact_id: targetId,
        platform: 'test',
        external_id: 'test_id_' + Date.now()
    });

    if (insertErr) {
        console.log("CONSTRAINT ERROR MESSAGE:", insertErr.message);
        console.log("CONSTRAINT DETAILS:", insertErr.details);
    } else {
        console.log("INSERT WORKED! (Meaning you fixed it)");
    }
}

check();
