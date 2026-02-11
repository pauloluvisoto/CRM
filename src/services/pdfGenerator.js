import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { CONTRACT_FULL_TEXT } from './contractTemplate';

// Configure fonts - CRITICAL for simple text rendering
// Use standard Roboto font which is included in vfs_fonts
pdfMake.vfs = pdfFonts.pdfMake.vfs;
pdfMake.fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
    }
};

const pdfGenerator = {

    // Helper to format currency
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    },

    // Helper to format CPFs/CNPJs
    formatDocument(doc) {
        if (!doc) return '';
        const cleaned = doc.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        if (cleaned.length === 14) {
            return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return doc;
    },

    // Helper to format date
    formatDateFull(date) {
        if (!date) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('pt-BR', options);
    },

    /**
     * Parses the raw contract text into pdfmake content nodes
     */
    parseContractTextToContent(rawText) {
        const lines = rawText.split('\n');
        const content = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return; // Skip empty lines

            if (trimmed.startsWith('CLÁUSULA') || trimmed === 'PARTES' || trimmed === 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS') {
                content.push({
                    text: trimmed,
                    style: trimmed === 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS' ? 'header' : 'clauseHeader'
                });
            } else if (trimmed.startsWith('Parágrafo')) {
                content.push({
                    text: trimmed,
                    style: 'clauseText',
                    margin: [20, 5, 0, 5] // Indent paragraphs
                });
            } else if (/^[a-z]\)/.test(trimmed) || /^[ivx]+\)/.test(trimmed)) {
                // List items like a), b), i), ii)
                content.push({
                    text: trimmed,
                    style: 'clauseText',
                    margin: [30, 2, 0, 2] // More indent
                });
            } else if (/^\d+\.\d+/.test(trimmed)) {
                // Numbered clauses like 1.1, 2.3.1
                content.push({
                    text: trimmed,
                    style: 'clauseText',
                    marginTop: 5
                });
            } else {
                // Normal text
                content.push({
                    text: trimmed,
                    style: 'bodyText'
                });
            }
        });

        return content;
    },

    /**
     * Generates and downloads the Contract PDF (Browser usage)
     */
    generateContractPDF(deal, contractData) {
        try {
            console.log('Generating Full Contract PDF (Download)...');

            // Prepare variable replacements
            const replacements = {
                '{{RAZAO_SOCIAL}}': (contractData.razao_social || deal.empresa_cliente || '__________________').toUpperCase(),
                '{{CNPJ}}': this.formatDocument(contractData.cnpj || deal.cnpj || '__________________'),
                '{{ENDERECO}}': contractData.endereco_completo || '__________________',
                '{{REPRESENTANTE}}': contractData.nome_representante || '__________________',
                '{{CPF_REPRESENTANTE}}': this.formatDocument(contractData.cpf_representante || '__________________'),
                '{{EMAIL}}': contractData.email_assinatura || '__________________',
                '____OPEN____DATA_ATUAL____CLOSE____': this.formatDateFull(new Date())
            };


            let finalText = CONTRACT_FULL_TEXT;
            // Clean up template if needed (the template uses placeholders directly now)

            Object.keys(replacements).forEach(key => {
                const val = replacements[key];
                finalText = finalText.split(key).join(val);
            });
            // Cleanup tags if any
            finalText = finalText.replace(/____OPEN____/g, '').replace(/____CLOSE____/g, '');


            // Add Signatures Block manually to the end of the text or handle it here?
            // The template ends with "E, por estarem justas...". 
            // We need to add the signature fields.
            // My parser parses text lines.
            // I should append the signature block content nodes AFTER parsing the text.

            const contentNodes = this.parseContractTextToContent(finalText);

            // Append Signature Block
            contentNodes.push(
                { text: `São João da Boa Vista/SP, ${this.formatDateFull(new Date())}`, alignment: 'center', margin: [0, 40, 0, 40], pageBreak: 'before' }
            );

            contentNodes.push({
                columns: [
                    {
                        stack: [
                            { text: '______________________________________', alignment: 'center' },
                            { text: (contractData.razao_social || 'CONTRATANTE').toUpperCase(), bold: true, alignment: 'center', fontSize: 10 },
                            { text: contractData.nome_representante || 'Representante', bold: true, alignment: 'center', fontSize: 10 },
                            { text: `CPF: ${this.formatDocument(contractData.cpf_representante)}`, bold: true, alignment: 'center', fontSize: 10 },
                            { text: `Email: ${contractData.email_assinatura || ''}`, bold: true, alignment: 'center', fontSize: 10 }
                        ]
                    },
                    {
                        stack: [
                            { text: '______________________________________', alignment: 'center' },
                            { text: 'SINAPSE LTDA', bold: true, alignment: 'center', fontSize: 10 },
                            { text: 'Paulo Cesar Luvisoto Filho', bold: true, alignment: 'center', fontSize: 10 },
                            { text: 'CPF: 264.678.078-80', bold: true, alignment: 'center', fontSize: 10 },
                            { text: 'Email: paulo@recupera.ia.br', bold: true, alignment: 'center', fontSize: 10 }
                        ]
                    }
                ],
                columnGap: 20,
                margin: [0, 0, 0, 40]
            });

            contentNodes.push({ text: 'TESTEMUNHAS:', bold: true, margin: [0, 0, 0, 20] });

            contentNodes.push({
                columns: [
                    {
                        stack: [
                            { text: '______________________________________', alignment: 'center' },
                            { text: 'Nome: Luis Guilherme Lima Kempe', alignment: 'left', margin: [40, 0, 0, 0], fontSize: 10 },
                            { text: 'CPF: 457.866.808-86', alignment: 'left', margin: [40, 0, 0, 0], fontSize: 10 }
                        ]
                    },
                    {
                        stack: [
                            { text: '______________________________________', alignment: 'center' },
                            { text: 'Nome: Matheus Guimarães L. C. Gonçalves', alignment: 'left', margin: [40, 0, 0, 0], fontSize: 10 },
                            { text: 'CPF: 459.365.548-05', alignment: 'left', margin: [40, 0, 0, 0], fontSize: 10 }
                        ]
                    }
                ]
            });


            const docDefinition = {
                content: contentNodes,
                styles: {
                    header: { fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
                    clauseHeader: { fontSize: 11, bold: true, marginTop: 15, marginBottom: 5, alignment: 'left' },
                    clauseText: { fontSize: 10, alignment: 'justify', marginBottom: 3, lineHeight: 1.2 },
                    bodyText: { fontSize: 10, alignment: 'justify', marginBottom: 5, lineHeight: 1.2 }
                },
                footer: function (currentPage, pageCount) {
                    if (currentPage === pageCount) return null;
                    return {
                        text: 'Rubrica: __________________________',
                        alignment: 'right',
                        margin: [0, 10, 40, 0],
                        fontSize: 9
                    };
                },
                pageMargins: [40, 60, 40, 60]
            };

            const fileName = `Contrato - ${contractData.razao_social || 'Cliente'}.pdf`;
            pdfMake.createPdf(docDefinition).download(fileName);

            return { success: true, message: 'PDF Gerado com Sucesso! (Texto Completo)' };

        } catch (error) {
            console.error('Error generating contract PDF:', error);
            return { success: false, message: 'Erro ao gerar PDF: ' + error.message };
        }
    },

    /**
     * Generates the PDF Blob for uploading to APIs
     * @param {*} deal 
     * @param {*} contractData 
     * @returns {Promise<Blob>}
     */
    async getContractBlob(deal, contractData) {
        return new Promise((resolve, reject) => {
            try {
                // Same logic as above but for Blob
                console.log('Generating Full Contract Blob...');

                const replacements = {
                    '{{RAZAO_SOCIAL}}': (contractData.razao_social || deal.empresa_cliente || '__________________').toUpperCase(),
                    '{{CNPJ}}': this.formatDocument(contractData.cnpj || deal.cnpj || '__________________'),
                    '{{ENDERECO}}': contractData.endereco_completo || '__________________',
                    '{{REPRESENTANTE}}': contractData.nome_representante || '__________________',
                    '{{CPF_REPRESENTANTE}}': this.formatDocument(contractData.cpf_representante || '__________________'),
                    '{{EMAIL}}': contractData.email_assinatura || '__________________',
                    '____OPEN____DATA_ATUAL____CLOSE____': this.formatDateFull(new Date())
                };

                let finalText = CONTRACT_FULL_TEXT;
                Object.keys(replacements).forEach(key => {
                    const val = replacements[key];
                    finalText = finalText.split(key).join(val);
                });
                finalText = finalText.replace(/____OPEN____/g, '').replace(/____CLOSE____/g, '');

                const contentNodes = this.parseContractTextToContent(finalText);

                // Append Signature Block (Duplicated logic for safety, could be extracted but keeping simple for fix)
                contentNodes.push(
                    { text: `São João da Boa Vista/SP, ${this.formatDateFull(new Date())}`, alignment: 'center', margin: [0, 40, 0, 40], pageBreak: 'before' }
                );

                contentNodes.push({
                    columns: [
                        {
                            stack: [
                                { text: '______________________________________', alignment: 'center' },
                                { text: (contractData.razao_social || 'CONTRATANTE').toUpperCase(), bold: true, alignment: 'center', fontSize: 10 },
                                { text: contractData.nome_representante || 'Representante', bold: true, alignment: 'center', fontSize: 10 },
                                { text: `CPF: ${this.formatDocument(contractData.cpf_representante)}`, bold: true, alignment: 'center', fontSize: 10 },
                                { text: `Email: ${contractData.email_assinatura || ''}`, bold: true, alignment: 'center', fontSize: 10 }
                            ]
                        },
                        {
                            stack: [
                                { text: '______________________________________', alignment: 'center' },
                                { text: 'SINAPSE LTDA', bold: true, alignment: 'center', fontSize: 10 },
                                { text: 'Paulo Cesar Luvisoto Filho', bold: true, alignment: 'center', fontSize: 10 },
                                { text: 'CPF: 264.678.078-80', bold: true, alignment: 'center', fontSize: 10 },
                                { text: 'Email: paulo@recupera.ia.br', bold: true, alignment: 'center', fontSize: 10 }
                            ]
                        }
                    ],
                    columnGap: 20,
                    margin: [0, 0, 0, 40]
                });

                contentNodes.push({ text: 'TESTEMUNHAS:', bold: true, margin: [0, 0, 0, 20] });

                contentNodes.push({
                    columns: [
                        {
                            stack: [
                                { text: '______________________________________', alignment: 'center' },
                                { text: 'Nome: Luis Guilherme Lima Kempe', alignment: 'left', margin: [40, 0, 0, 0], fontSize: 10 },
                                { text: 'CPF: 457.866.808-86', alignment: 'left', margin: [40, 0, 0, 0], fontSize: 10 }
                            ]
                        },
                        {
                            stack: [
                                { text: '______________________________________', alignment: 'center' },
                                { text: 'Nome: Matheus Guimarães L. C. Gonçalves', alignment: 'left', margin: [40, 0, 0, 0], fontSize: 10 },
                                { text: 'CPF: 459.365.548-05', alignment: 'left', margin: [40, 0, 0, 0], fontSize: 10 }
                            ]
                        }
                    ]
                });

                const docDefinition = {
                    content: contentNodes,
                    styles: {
                        header: { fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
                        clauseHeader: { fontSize: 11, bold: true, marginTop: 15, marginBottom: 5, alignment: 'left' },
                        clauseText: { fontSize: 10, alignment: 'justify', marginBottom: 3, lineHeight: 1.2 },
                        bodyText: { fontSize: 10, alignment: 'justify', marginBottom: 5, lineHeight: 1.2 }
                    },
                    footer: function (currentPage, pageCount) {
                        if (currentPage === pageCount) return null;
                        return {
                            text: 'Rubrica: __________________________',
                            alignment: 'right',
                            margin: [0, 10, 40, 0],
                            fontSize: 9
                        };
                    },
                    pageMargins: [40, 60, 40, 60]
                };

                const pdfDocGenerator = pdfMake.createPdf(docDefinition);
                pdfDocGenerator.getBlob((blob) => {
                    resolve(blob);
                });

            } catch (e) {
                console.error('Error generating contract blob:', e);
                reject(e);
            }
        });
    }
};

export default pdfGenerator;
