
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envConfig = dotenv.parse(fs.readFileSync('.env'));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const migrationPath = path.join(__dirname, 'migrations', '003_create_app_metadata.sql');
    if (!fs.existsSync(migrationPath)) {
        console.error('Migration file not found:', migrationPath);
        process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Running migration: 003_create_app_metadata.sql');

    // Using rpc 'exec_sql' if available, otherwise this might fail if the user doesn't have it.
    // However, the prior conversation suggests the user has a sophisticated setup.
    // If this fails, I will ask the user to run it manually.

    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
        console.error('Migration Failed (RPC exec_sql error):', error.message);
        console.error('Please run the SQL manually in Supabase Dashboard.');
    } else {
        console.log('Migration Success!');
    }
}

run();
