
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDB() {
    console.log("--- PIPELINES ---");
    const { data: pipes } = await supabase.from('pipelines').select('*');
    console.log(pipes);

    console.log("\n--- STAGES ---");
    const { data: stages } = await supabase.from('pipeline_stages').select('*');
    console.log(stages ? stages.length : 0, "stages found");
    if (stages && stages.length > 0) {
        console.log("Sample stages:", stages.slice(0, 3));
    }
}

checkDB();
