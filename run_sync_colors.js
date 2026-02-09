
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvqqmcwriuqrhnwjbtvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXFtY3dyaXVxcmhud2pidHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Njc5NTMsImV4cCI6MjA4NTA0Mzk1M30.kJy-6xd2LlEX_8BB_JM7sXAfJjLlmmERK1zhB9I7n4o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncColors() {
    console.log('Fetching stages...');
    const { data: stages, error: fetchError } = await supabase
        .from('pipeline_stages')
        .select('id, name');

    if (fetchError) {
        console.error('Error fetching stages:', fetchError);
        return;
    }

    const getTargetColor = (name) => {
        const n = name.toUpperCase();
        if (n.includes('NOVO LEAD') || n.includes('PROSPECTO') || n.includes('ABORDAGEM')) return '#3b82f6'; // Blue
        if (n.includes('QUALIFICA')) return '#f59e0b'; // Amber
        if (n.includes('AGUARDANDO') || n.includes('DIAGN')) return '#f59e0b'; // Amber
        if (n.includes('AGENDADA') || n.includes('REUNI') || n.includes('RVP')) return '#6366f1'; // Indigo
        if (n.includes('PROPOSTA') || n.includes('CONTRATO')) return '#3b82f6'; // Blue (Flow)
        if (n.includes('FOLLOW UP') || n.includes('FOLLOW-UP') || n.includes('DECIS')) return '#a855f7'; // Purple
        if (n.includes('FECHADO') || n.includes('FECHAMENTO') || n.includes('GANHO') || n.includes('ONBOARDING')) return '#10b981'; // Green
        if (n.includes('NO SHOW') || n.includes('PERDIDO') || n.includes('PERDA')) return '#ef4444'; // Red
        return null;
    };

    for (const stage of stages) {
        const color = getTargetColor(stage.name);
        if (color) {
            console.log(`Updating "${stage.name}" to ${color}`);
            const { error: updateError } = await supabase
                .from('pipeline_stages')
                .update({ color })
                .eq('id', stage.id);

            if (updateError) console.error(`Failed to update ${stage.name}:`, updateError);
        }
    }
    console.log('Sync completed!');
}

syncColors();
