import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env relative to current dir
const envConfig = dotenv.parse(fs.readFileSync('.env'))
for (const k in envConfig) {
    process.env[k] = envConfig[k]
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key. Check .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = process.argv[2];

if (!sql) {
    console.error('Please provide SQL query as argument');
    process.exit(1);
}

async function run() {
    // Attempt to run raw SQL via rpc if enabled, or simple table query fallback?
    // Actually, usually we can't run DDL via client easily.
    // But let's try to see if we can use the 'rpc' method if the user has a function for it,
    // otherwise we might need to guide the user to the dashboard.

    // HOWEVER, for Realtime, we can try to update the publication.
    // If we can't run raw SQL, we can't enable realtime programmatically easily without the dashboard.
    // But let's try anyway just in case the user has the 'exec_sql' rpc function I see in some projects.

    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
        console.error('Error (maybe RPC missing):', error.message);
        console.log('\n--- MANUAL ACTION REQUIRED ---');
        console.log('Please run this SQL in your Supabase Dashboard > SQL Editor:');
        console.log(sql);
        console.log('------------------------------\n');
    } else {
        console.log('Success:', data);
    }
}

run();
