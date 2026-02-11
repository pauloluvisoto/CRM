
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to ask question
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
    console.log('--- Configuração de Webhook W-API ---');

    // 1. Get Credentials
    let envContent = '';
    try {
        envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
    } catch (e) { }

    let token = '';
    let instanceId = '';

    // Try to parse from .env
    const tokenMatch = envContent.match(/VITE_W_API_TOKEN=(.+)/);
    if (tokenMatch) token = tokenMatch[1].trim();

    const instanceMatch = envContent.match(/VITE_W_API_INSTANCE_ID=(.+)/);
    if (instanceMatch) instanceId = instanceMatch[1].trim();

    // Confirm with user
    if (!token || token === 'SEU_TOKEN_AQUI') {
        token = await question('Digite seu Token da Conta W-API: ');
    }

    if (!instanceId || instanceId === 'SEU_INSTANCE_ID_AQUI') {
        instanceId = await question('Digite o ID da Instância Conectada: ');
    } else {
        console.log(`Usando Instância do .env: ${instanceId}`);
        const confirm = await question('Pressione Enter para confirmar ou digite outro ID: ');
        if (confirm.trim()) instanceId = confirm.trim();
    }

    // 2. Get Vercel URL
    let vercelUrl = await question('Digite a URL do seu projeto na Vercel (ex: https://crm-recupera-ia.vercel.app): ');
    vercelUrl = vercelUrl.trim().replace(/\/$/, ''); // Remove trailing slash

    if (!vercelUrl.startsWith('http')) {
        vercelUrl = 'https://' + vercelUrl;
    }

    const webhookUrl = `${vercelUrl}/api/webhooks/wapi-received`;
    console.log(`\nConfigurando webhook para: ${webhookUrl}`);

    // 3. Call W-API to update Webhook
    const updateUrl = `https://api.w-api.app/v1/webhook/update-webhook-received?instanceId=${instanceId}`;

    try {
        console.log('Enviando requisição...', updateUrl);
        const response = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ value: webhookUrl })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('\n✅ Sucesso! Webhook configurado.');
            console.log('Resposta:', data);

            // Validate config
            const checkUrl = `https://api.w-api.app/v1/instance/fetch-instance?instanceId=${instanceId}`;
            const checkRes = await fetch(checkUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const checkData = await checkRes.json();

            console.log('\n--- Verificação ---');
            console.log('URL Atual na W-API:', checkData.webhookReceivedUrl);

            if (checkData.webhookReceivedUrl === webhookUrl) {
                console.log('Tudo certo! As mensagens devem chegar agora.');
            } else {
                console.warn('⚠️ A URL retornada é diferente. Verifique se salvou corretamente.');
            }

        } else {
            console.error('\n❌ Erro ao configurar webhook:');
            console.error(data);
        }

    } catch (error) {
        console.error('\n❌ Erro de conexão:', error.message);
    }

    rl.close();
}

setup();
