import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvqqmcwriuqrhnwjbtvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXFtY3dyaXVxcmhud2pidHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Njc5NTMsImV4cCI6MjA4NTA0Mzk1M30.kJy-6xd2LlEX_8BB_JM7sXAfJjLlmmERK1zhB9I7n4o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking tables...");

    // We try to fetch 1 row from each to check existence and count
    const tables = ['clients', 'contacts', 'social_conversations', 'social_messages', 'central_vendas'];

    for (const table of tables) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`Table [${table}]: ERROR - ${error.message} (${error.code})`);
            } else {
                console.log(`Table [${table}]: EXISTS - ${count} rows`);
            }
        } catch (e) {
            console.log(`Table [${table}]: EXCEPTION - ${e.message}`);
        }
    }
}

check();
