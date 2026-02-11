// import fetch from 'node-fetch'; // native fetch used

const url = 'http://localhost:3001/api/webhooks/wapi-received';

const fakePayload = {
    key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: `TEST-${Date.now()}`
    },
    message: {
        conversation: 'Teste de mensagem webhook local'
    },
    pushName: 'Cliente Teste'
};

/* Alternative structure sometimes used:
const fakePayload2 = {
    from: '5511888888888@c.us',
    content: 'Outro teste',
    fromMe: false
};
*/

async function sendWebhook() {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fakePayload)
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (error) {
        console.error('Error sending webhook:', error);
    }
}

sendWebhook();
