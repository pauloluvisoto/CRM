
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
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
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
        const { data } = await supabase
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
        if (!dbSuccess) throw e;
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

        // 2. Fix Schema Updates (Direct Access)
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
    console.log('📩 [W-API] Webhook Received:', JSON.stringify(req.body, null, 2));

    try {
        const { body } = req;

        // 0. Logging (Diagnose connectivity & payload)
        // We catch errors here to avoid crashing the flow if logging fails
        let logId = null;
        try {
            const { data: logData } = await supabase
                .from('webhook_logs')
                .insert([{ payload: body, status: 'received' }])
                .select()
                .single();
            logId = logData?.id;
        } catch (e) { console.error('Logging failed:', e); }

        // 1. Parse Phone/Sender
        // W-API format seen in logs: body.chat.id or body.sender.id
        let phone = body.chat?.id || body.sender?.id || body.from || body.key?.remoteJid || body.data?.key?.remoteJid;

        if (phone && phone.includes('@')) {
            phone = phone.split('@')[0];
        }

        // 2. Parse Content
        // W-API format seen in logs: body.msgContent
        let content = '';
        if (body.msgContent) {
            content = body.msgContent.conversation ||
                body.msgContent.extendedTextMessage?.text ||
                '';
            if (!content && body.msgContent.imageMessage) content = '📷 Imagem';
            if (!content && body.msgContent.audioMessage) content = '🎵 Áudio';
        } else {
            // Legacy/Standard format
            content = body.message?.conversation ||
                body.message?.extendedTextMessage?.text ||
                body.content ||
                '';
            if (!content && body.message?.imageMessage) content = '📷 Imagem';
            if (!content && body.message?.audioMessage) content = '🎵 Áudio';
        }

        // 3. Check Direction & ID
        const isFromMe = body.fromMe || body.key?.fromMe || body.data?.key?.fromMe;
        const messageId = body.messageId || body.key?.id || body.data?.key?.id || 'wapi-' + Date.now();

        // 4. Extract Contact Info
        const contactName = body.sender?.pushName || body.sender?.verifiedBizName || body.chat?.contact?.name || body.pushName || '';
        const pictureUrl = body.sender?.profilePicture || body.chat?.profilePicture || body.profilePicture || '';

        console.log(`🔍 [W-API] Parsed: Phone=${phone}, Name="${contactName}", ID=${messageId}, FromMe=${isFromMe}`);

        if (!phone || !content) {
            if (logId) await supabase.from('webhook_logs').update({ status: 'ignored', error_message: 'No phone/content' }).eq('id', logId);
            return res.status(200).json({ status: 'ignored' });
        }

        const direction = isFromMe ? 'outbound' : 'inbound';

        // 5. Find or Create Conversation
        let { data: conversation, error: convError } = await supabase
            .from('social_conversations')
            .select('*')
            .eq('external_id', phone)
            .eq('platform', 'whatsapp')
            .single();

        if (convError && convError.code !== 'PGRST116') { // PGRST116 is "Row not found"
            throw convError;
        }

        const metadataUpdate = { phone: phone };

        if (!conversation) {
            const { data: newConv, error: createError } = await supabase
                .from('social_conversations')
                .insert([{
                    platform: 'whatsapp',
                    external_id: phone,
                    contact_name: contactName || phone, // Fallback to phone if name missing
                    picture_url: pictureUrl,
                    last_message: content,
                    last_message_at: new Date().toISOString(),
                    unread_count: isFromMe ? 0 : 1,
                    metadata: metadataUpdate
                }])
                .select()
                .single();

            if (createError) throw createError;
            conversation = newConv;
        } else {
            const updateData = {
                last_message: content,
                last_message_at: new Date().toISOString()
            };

            // Update name/pic if available
            if (contactName) updateData.contact_name = contactName;
            if (pictureUrl) updateData.picture_url = pictureUrl;

            if (!isFromMe) {
                updateData.unread_count = (conversation.unread_count || 0) + 1;
            }

            // Merge metadata
            const currentMeta = conversation.metadata || {};
            updateData.metadata = { ...currentMeta, ...metadataUpdate };

            await supabase
                .from('social_conversations')
                .update(updateData)
                .eq('id', conversation.id);
        }

        // 6. Insert Message
        const { error: msgError } = await supabase
            .from('social_messages')
            .insert([{
                conversation_id: conversation.id,
                content: content,
                direction: direction,
                external_id: messageId,
                status: isFromMe ? 'sent' : 'delivered'
            }]);

        if (msgError) throw msgError;

        if (logId) await supabase.from('webhook_logs').update({ status: 'processed' }).eq('id', logId);

        res.json({ success: true });

    } catch (error) {
        console.error('❌ [W-API] Error processing webhook:', error);
        try {
            await supabase.from('webhook_logs').insert([{
                payload: req.body,
                status: 'error',
                error_message: error.message
            }]);
        } catch (e) { }
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
