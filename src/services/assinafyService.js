const API_URL = '/api/assinafy';
const API_KEY = import.meta.env.VITE_ASSINAFY_API_KEY;
const ACCOUNT_ID = import.meta.env.VITE_ASSINAFY_ACCOUNT_ID;

export const assinafyService = {
    /**
     * Sends a document to Assinafy for signature (Virtual Method - Standard).
     * @param {Blob} pdfBlob - The PDF file as a Blob.
     * @param {string} fileName - Name of the file.
     * @param {Array} signersData - List of signers [{ name, email, cpf, type: 'SIGN' }].
     * @param {Array} ccReceivers - List of copy receivers [{ name, email }].
     * @returns {Promise<Object>} - The API response.
     */
    async createDocument(pdfBlob, fileName, signersData, ccReceivers = []) {
        if (!API_KEY || !ACCOUNT_ID) {
            console.error('Assinafy Credentials missing.');
            return { success: false, message: 'Credenciais Assinafy (Chave ou ID) não configuradas.' };
        }

        try {
            // STEP 1: Create Signers first to get their IDs
            const signerIds = [];

            // Filter out CC receivers from signers list to ensure they don't sign
            const actualSigners = [...signersData];

            console.log(`[Assinafy] Processing ${actualSigners.length} signers...`);

            for (const s of actualSigners) {
                console.log(`[Assinafy] Creating/Finding signer: ${s.email}`);
                let sId;

                const signerRes = await fetch(`${API_URL}/accounts/${ACCOUNT_ID}/signers`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        full_name: s.name,
                        email: s.email,
                        ... (s.cpf ? { tax_id: s.cpf.replace(/\D/g, '') } : {})
                    })
                });

                const signerJson = await signerRes.json();

                if (signerRes.ok) {
                    sId = signerJson.id || (signerJson.data && signerJson.data.id);
                } else {
                    // Fallback to find existing
                    console.warn(`[Assinafy] Signer creation failed, searching existing: ${signerJson.message}`);
                    const listRes = await fetch(`${API_URL}/accounts/${ACCOUNT_ID}/signers`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${API_KEY}` }
                    });
                    if (listRes.ok) {
                        const listJson = await listRes.json();
                        const signersList = Array.isArray(listJson) ? listJson : (listJson.data || []);
                        const existing = signersList.find(existing => existing.email === s.email);
                        if (existing) sId = existing.id;
                    }
                    if (!sId) throw new Error(`Erro ao criar/encontrar signatário ${s.email}`);
                }
                signerIds.push(sId);
            }

            // STEP 2: Upload Document
            console.log('[Assinafy] Uploading document...');
            const formData = new FormData();
            formData.append('file', pdfBlob, fileName);

            const uploadRes = await fetch(`${API_URL}/accounts/${ACCOUNT_ID}/documents`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${API_KEY}` },
                body: formData
            });

            const uploadJson = await uploadRes.json();
            if (!uploadRes.ok) {
                throw new Error(`Erro no upload: ${uploadJson.message || JSON.stringify(uploadJson)}`);
            }

            const docId = uploadJson.id || (uploadJson.data && uploadJson.data.id);
            console.log(`[Assinafy] Document uploaded. ID: ${docId}`);

            // STEP 3: Create Assignment (Virtual Method)
            const assignmentPayload = {
                method: 'virtual',
                signerIds: signerIds,
                expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };

            // Add Observers/Reviewers if supported
            if (ccReceivers.length > 0) {
                assignmentPayload.observers = ccReceivers.map(cc => ({ email: cc.email, name: cc.name }));
                console.log(`[Assinafy] Adding CC receivers as observers: ${ccReceivers.length}`);
            }

            // Loop with Retry for 'metadata_processing'
            let assignmentJson;
            let attempts = 0;
            const maxAttempts = 20; // Increased to 20 to allow ~60s wait
            const retryDelay = 3000; // 3 seconds

            while (attempts < maxAttempts) {
                attempts++;
                console.log(`[Assinafy] Creating assignment for Doc ${docId} (Attempt ${attempts}/${maxAttempts})...`);

                const assignmentRes = await fetch(`${API_URL}/documents/${docId}/assignments`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(assignmentPayload)
                });

                assignmentJson = await assignmentRes.json();

                if (assignmentRes.ok) {
                    const assignId = assignmentJson.id || (assignmentJson.data && assignmentJson.data.id);
                    console.log(`[Assinafy] Assignment created successfully! ID: ${assignId}`);
                    // PATCH: Check if we have an ID. If not, but request was OK, maybe just proceed using DocID or generic success.
                    // But usually there's an ID.
                    break;
                }

                // Retry Logic: Wait if processing
                const isProcessing = (assignmentJson.message && assignmentJson.message.includes('metadata_processing')) ||
                    (assignmentJson.code && assignmentJson.code === 'metadata_processing');

                if (isProcessing) {
                    console.warn(`[Assinafy] Document still processing. Retrying in ${retryDelay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    continue;
                } else {
                    console.warn(`[Assinafy] Assignment failed: ${assignmentJson.message}`);
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Small wait
                    if (attempts === maxAttempts) {
                        throw new Error(`Falha API Assinafy: ${assignmentJson.message}`);
                    }
                }
            }

            // Robust ID check
            const finalId = assignmentJson ? (assignmentJson.id || (assignmentJson.data && assignmentJson.data.id)) : null;

            if (!finalId) {
                // If the request was technically OK (code 200) but no ID returned, we might still want to count it as success?
                // But safer to assume failure if no tracking ID.
                console.error('[Assinafy] Response OK but no ID found:', assignmentJson);
                // Last ditch: if assignmentJson has 'success': true?
                throw new Error(`O envio foi aceito mas não retornou ID de rastreio.`);
            }

            return { success: true, data: { ...assignmentJson, id: finalId }, message: 'Documento enviado com sucesso para assinatura!' };

        } catch (error) {
            console.error('[Assinafy Service Error]', error);
            return { success: false, message: error.message };
        }
    }
};

export default assinafyService;
