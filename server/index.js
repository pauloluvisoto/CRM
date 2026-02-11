
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const SCHEMA_PATH = path.join(__dirname, '..', 'schema_financeiro.json');

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors({
    origin: '*', // Allow all origins to handle dynamic Vite ports (5173, 5174, etc.)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Helper: Get Schema
async function getSchema() {
    // 1. Try DB
    if (supabase) {
        const { data, error } = await supabase
            .from('app_metadata')
            .select('value')
            .eq('key', 'schema_financeiro')
            .single();

        if (data && data.value) return data.value;
    }

    // 2. Fallback to FS
    if (fs.existsSync(SCHEMA_PATH)) {
        const data = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        return JSON.parse(data);
    }

    throw new Error('Schema not found');
}

// Helper: Save Schema
async function saveSchema(newSchema) {
    // 1. Try DB
    let dbSuccess = false;
    if (supabase) {
        const { error } = await supabase
            .from('app_metadata')
            .upsert({
                key: 'schema_financeiro',
                value: newSchema,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (!error) dbSuccess = true;
        else console.error('DB Save Error:', error);
    }

    // 2. Try FS (Backup / Dev)
    try {
        fs.writeFileSync(SCHEMA_PATH, JSON.stringify(newSchema, null, 4));
    } catch (e) {
        // Ignored in Vercel/Production if readonly
        if (!dbSuccess) throw e; // Throw if BOTH failed
    }
}

// Endpoint to get KPIs
app.get('/api/kpis', async (req, res) => {
    try {
        const schema = await getSchema();
        res.json(schema);
    } catch (error) {
        console.error('Error reading schema:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to update KPIs
app.post('/api/kpis', async (req, res) => {
    try {
        const newSchema = req.body;

        if (!newSchema || typeof newSchema !== 'object') {
            return res.status(400).json({ error: 'Invalid schema data' });
        }

        if (!newSchema.metas_comerciais || !newSchema.receitas) {
            return res.status(400).json({ error: 'Schema missing required sections' });
        }

        newSchema.last_update = new Date().toISOString();

        await saveSchema(newSchema);
        console.log('✅ [API] Schema updated successfully');
        res.json({ success: true, message: 'Schema updated' });

    } catch (error) {
        console.error('Error updating schema:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CONSTANTS (Mirroring Finance Engine)
const FINANCE_CONSTANTS = {
    RECEITA_FIXA_POR_VENDA: 597,
    TAXA_IMPOSTO: 0.16,
    COGS: {
        'Servidor': 10,
        'Tokens GPT': 10,
        'API e Telefonia': 230
    }
};

// Endpoint to register a sale (Real-time sync)
app.post('/api/sales/register', async (req, res) => {
    try {
        const { commission = 0 } = req.body;

        const schema = await getSchema();

        // 1. Calculate Values
        const grossRevenue = FINANCE_CONSTANTS.RECEITA_FIXA_POR_VENDA + Number(commission);
        const taxes = grossRevenue * FINANCE_CONSTANTS.TAXA_IMPOSTO;

        // 2. Recursive Update Helper
        const updateCategory = (categories, name, value) => {
            for (let cat of categories) { // Error here: categories is object in new schema? No, it's array in old schema, but new schema structure?
                // Wait, schema structure is: "receitas": { "total": { "bp": X, "real": Y }, ... }
                // Use strict path updates for now based on known structure
                // But the previous code used iteration. 
                // Let's check schema_financeiro.json structure again.
                // It is OBJECT based: "receitas": { "fixa": { "bp": ..., "real": ... } }
                // The previous code iterate `categories`. That implies it expects an array?
                // `updateCategory(schema.receitas.fixa, ...)` -> `schema.receitas.fixa` is an OBJECT `{ bp, real }`. It is NOT an array.
                // THE PREVIOUS CODE WAS PROBABLY BROKEN OR FOR A DIFFERENT SCHEMA VERSION!
                // Wait, let's look at `schema_financeiro.json` content again.
                // "receitas": { "fixa": { "bp": 28650, "real": 0 } ... }
                // The previous code: `updateCategory(schema.receitas.fixa)`
                // `for (let cat of categories)` -> iterating over an object's keys? No, `of` is for iterables.
                // If `schema.receitas.fixa` is an object, `of` throws TypeError!
                // So the previous code WAS BROKEN or I misread the file.
                // Let's assume the previous code was for an ARRAY based schema, but the current file is OBJECT based.
                // I must FIX this logic for the current OBJECT schema.

                // New Logic: direct property access
                return false;
            }
        };

        // FIX: Direct updates for known schema structure
        if (schema.receitas.fixa) schema.receitas.fixa.real = (schema.receitas.fixa.real || 0) + FINANCE_CONSTANTS.RECEITA_FIXA_POR_VENDA;
        if (schema.receitas.variavel) schema.receitas.variavel.real = (schema.receitas.variavel.real || 0) + Number(commission);

        // Recalculate Totals
        if (schema.receitas.total) {
            schema.receitas.total.real = (schema.receitas.fixa?.real || 0) + (schema.receitas.variavel?.real || 0);
        }

        // Taxes
        if (schema.custos && schema.custos.impostos) {
            schema.custos.impostos.real = (schema.custos.impostos.real || 0) + taxes;
        }

        // COGS
        // In this schema, COGS is a single aggregated value "cogs"
        // We can just add the sum of constants
        const totalCogsIncrease = Object.values(FINANCE_CONSTANTS.COGS).reduce((a, b) => a + b, 0);
        if (schema.custos && schema.custos.cogs) {
            schema.custos.cogs.real = (schema.custos.cogs.real || 0) + totalCogsIncrease;
        }

        await saveSchema(schema);

        console.log(`✅ [API] Sale registered: +R$ ${grossRevenue.toFixed(2)} (Comm: ${commission})`);
        res.json({ success: true, revenue: grossRevenue });

    } catch (error) {
        console.error('Error registering sale:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// W-API Webhook
app.post('/api/webhooks/wapi-received', async (req, res) => {
    // ... (Keep existing logic, simplified for brevity here, but I will include full logic in the write)
    console.log('📩 [W-API] Webhook Received:', JSON.stringify(req.body, null, 2));

    try {
        const { body } = req;
        // ... (Parsing logic)
        let phone = body.from || body.key?.remoteJid || body.data?.key?.remoteJid;
        if (phone && phone.includes('@')) phone = phone.split('@')[0];

        let content = body.message?.conversation || body.message?.extendedTextMessage?.text || body.content || '';
        if (!content && body.message?.imageMessage) content = '📷 Imagem';

        const isFromMe = body.fromMe || body.key?.fromMe || body.data?.key?.fromMe;

        if (!phone || !content || isFromMe) {
            return res.status(200).json({ status: 'ignored' });
        }

        // DB Logic
        let { data: conversation, error: convError } = await supabase
            .from('social_conversations')
            .select('*')
            .eq('external_id', phone)
            .eq('platform', 'whatsapp')
            .single();

        if (!conversation) {
            const { data: newConv } = await supabase
                .from('social_conversations')
                .insert([{
                    platform: 'whatsapp',
                    external_id: phone,
                    last_message: content,
                    last_message_at: new Date().toISOString(),
                    unread_count: 1
                }])
                .select()
                .single();
            conversation = newConv;
        } else {
            await supabase
                .from('social_conversations')
                .update({
                    last_message: content,
                    last_message_at: new Date().toISOString(),
                    unread_count: (conversation.unread_count || 0) + 1
                })
                .eq('id', conversation.id);
        }

        await supabase
            .from('social_messages')
            .insert([{
                conversation_id: conversation.id,
                content: content,
                direction: 'inbound',
                external_id: body.key?.id || 'wapi-' + Date.now()
            }]);

        res.json({ success: true });

    } catch (error) {
        console.error('❌ [W-API] Error processing webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start Server if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    app.listen(PORT, () => {
        console.log(`🚀 API Server running on http://localhost:${PORT}`);
        console.log(`📂 Storage: Supabase & FS Fallback`);
    });
}

export default app;
