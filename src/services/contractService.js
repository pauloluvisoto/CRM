import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

// Import the docx file as a URL (Vite asset handling)
// Note: In Vite, we might need to use `?url` suffix or puts it in `public/` folder.
// Since it's in `src/assets`, we can try importing it. 
// If that fails, we might need to move it to `public/docs/`.
// For now, let's assume we can fetch it.
const CONTRACT_TEMPLATE_URL = '/contrato_v3.docx';

const ASSINAFY_API_KEY = import.meta.env.VITE_ASSINAFY_API_KEY;
const ASSINAFY_ENDPOINT = 'https://api.assinafy.com/v1/documents';

const contractService = {
    /**
     * Generate a filled DOCX contract based on the model.
     * @param {Object} deal - Deal data
     * @param {Object} contractData - Specific contract fields
     */
    async getContractBlob(deal, contractData) {
        console.log('Generating Contract Blob for:', deal.empresa_cliente);

        try {
            // 1. Fetch the template
            const response = await fetch(CONTRACT_TEMPLATE_URL);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${response.statusText}`);
            }
            const blobInput = await response.blob();
            const arrayBuffer = await blobInput.arrayBuffer();

            // 2. Load into PizZip
            const zip = new PizZip(arrayBuffer);

            // 3. Create Docxtemplater instance
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                delimiters: { start: '____OPEN____', end: '____CLOSE____' }
            });

            // 4. Render the document (replace variables)
            const dataToRender = {
                RAZAO_SOCIAL: contractData.razao_social || deal.empresa_cliente,
                CNPJ: contractData.cnpj || deal.cnpj || '__________________',
                ENDERECO: contractData.endereco_completo || '__________________',
                REPRESENTANTE: contractData.nome_representante || '__________________',
                CPF_REPRESENTANTE: contractData.cpf_representante || '__________________',
                EMAIL: contractData.email_assinatura || '__________________',
                DATA_ATUAL: new Date().toLocaleDateString('pt-BR'),
                VALOR_MENSAL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.faturamento_mensal || 0),
                ...deal, // fallback for other fields
                ...contractData
            };

            console.log('Rendering Data:', dataToRender);

            doc.render(dataToRender);

            // 5. Generate output
            const out = doc.getZip().generate({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });

            return out;

        } catch (error) {
            console.error('Error in getContractBlob:', error);
            if (error.properties && error.properties.errors) {
                const errorMessages = error.properties.errors.map(e => e.message).join('\n');
                throw new Error(`Template Errors: ${errorMessages}`);
            }
            throw error;
        }
    },

    /**
     * Generate and download the contract.
     */
    async generateContract(deal, contractData) {
        try {
            const blob = await this.getContractBlob(deal, contractData);

            // 6. Save/Download
            const fileName = `Contrato - ${contractData.razao_social || 'Cliente'}.docx`;
            saveAs(blob, fileName);

            return {
                success: true,
                message: 'Contrato gerado e baixado com sucesso! Verifique a pasta de downloads.'
            };

        } catch (error) {
            console.error('Error in generateContract wrapper:', error);
            return { success: false, message: 'Erro ao gerar o arquivo: ' + error.message };
        }
    },

    /**
     * Send document to Assinafy for digital signature.
     * @param {File|Blob} pdfFile - The PDF file to upload
     * @param {Object} signers - List of signers (name, email, cpf)
     */
    async sendToAssinafy(pdfFile, signers) {
        if (!ASSINAFY_API_KEY) {
            console.warn('Assinafy Key missing.');
            return { success: false, error: 'Chave da API Assinafy não configurada.' };
        }

        console.log('Sending to Assinafy...', signers);

        // Placeholder for API call
        // const formData = new FormData();
        // formData.append('file', pdfFile);
        // formData.append('signers', JSON.stringify(signers));

        // await fetch(ASSINAFY_ENDPOINT, ...)

        return {
            success: true,
            docId: 'mock-doc-id-123',
            status: 'sent'
        };
    }
};

export default contractService;
