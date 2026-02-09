import React, { useState, useRef } from 'react';
import { Upload, ArrowRight, Check, AlertCircle, FileDown, Download, X, Database, ArrowDown } from 'lucide-react';
import { processImport, createPipelineFromData, processKanbanImport } from '../../utils/importer';
import * as XLSX from 'xlsx';

const ImportModal = ({ isOpen, onClose, onImportComplete }) => {
    // STEPS: 
    // 1: Download Template & Upload
    // 2: Preview & Confirm
    // 3: Processing
    const [step, setStep] = useState(1);
    const [fileData, setFileData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [pipelineName, setPipelineName] = useState('');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef(null);

    React.useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFileData([]);
            setResult(null);
            setProgress(0);
            setPipelineName('');
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- TEMPLATE GENERATION ---
    const downloadTemplate = () => {
        const wb = XLSX.utils.book_new();
        const headers = ['Nome do Lead', 'Empresa/Projeto', 'Etapa do Funil', 'Valor (R$)', 'WhatsApp', 'Instagram', 'Email'];
        const exampleRow = ['João Silva', 'Empresa X', 'Novo Lead', '5000', '11999998888', '@joaosilva', 'joao@email.com'];
        const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

        // Adjust column widths
        ws['!cols'] = headers.map(() => ({ wch: 20 }));

        XLSX.utils.book_append_sheet(wb, ws, "Modelo Importação");
        XLSX.writeFile(wb, "Modelo_Padrao_CRM.xlsx");
    };

    // GENERIC FILE PROCESSOR
    const processFile = (file) => {
        if (!file) return;

        setLoading(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (data.length < 2) throw new Error("O arquivo parece vazio ou sem cabeçalhos.");

                const detectedHeaders = data[0].map(h => h ? h.trim() : '');

                // VALIDATION: Check if headers match standard
                const required = ['Nome do Lead', 'Etapa do Funil'];
                const missing = required.filter(r => !detectedHeaders.includes(r));

                if (missing.length > 0) {
                    // Try loose matching
                    const hasName = detectedHeaders.some(h => h.toLowerCase().includes('nome') || h.toLowerCase().includes('lead'));
                    const hasStage = detectedHeaders.some(h => h.toLowerCase().includes('etapa') || h.toLowerCase().includes('status') || h.toLowerCase().includes('funil'));

                    if (!hasName || !hasStage) {
                        throw new Error(`Arquivo inválido. Use o Modelo Padrão. Colunas obrigatórias não encontradas: ${missing.join(', ')}`);
                    }
                }

                const rows = data.slice(1);
                // Convert to objects
                const objectRows = rows.map(r => {
                    let obj = {};
                    detectedHeaders.forEach((h, i) => {
                        obj[h] = r[i];
                    });
                    return obj;
                });

                setHeaders(detectedHeaders);
                setFileData(objectRows);
                setPipelineName(file.name.split('.')[0]);
                setStep(2);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    // HANDLERS
    const handleFileSelect = (e) => {
        processFile(e.target.files[0]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        processFile(e.dataTransfer.files[0]);
    };

    const runImport = async () => {
        setStep(3);
        setLoading(true);
        setProgress(0);

        try {
            // STRICT MAPPING based on Standard Template
            const findCol = (keywords) => headers.find(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase())));

            const mapping = {
                title: findCol(['Nome do Lead', 'Lead', 'Nome']),
                company: findCol(['Empresa', 'Projeto', 'Company']),
                value: findCol(['Valor', 'R$', 'Preço']),
                whatsapp: findCol(['WhatsApp', 'Telefone', 'Celular', 'Fone']),
                instagram: findCol(['Instagram', 'Insta', 'IG']),
                email: findCol(['Email', 'E-mail']),
                status: findCol(['Etapa do Funil', 'Etapa', 'Status', 'Fase'])
            };

            if (!mapping.title || !mapping.status) {
                throw new Error("Falha ao identificar colunas 'Nome do Lead' ou 'Etapa'. Por favor use o Modelo Padrão.");
            }

            // 1. Create Structure (Pipeline + Stages found in data)
            const config = {
                name: pipelineName,
                createMethod: 'status_column',
                statusColumn: mapping.status
            };

            const createdColumns = await createPipelineFromData(config, fileData);

            // 2. Import Deals
            const importOptions = {
                mode: 'new',
                columns: createdColumns,
                statusColumn: mapping.status
            };

            const res = await processImport(fileData, mapping, importOptions, (pct) => setProgress(pct));
            setResult(res);

            if (onImportComplete) onImportComplete();

        } catch (err) {
            console.error(err);
            setResult({ successCount: 0, errors: [{ row: '-', error: err.message }] });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: '#020617', // Very Dark Blue/Black base
                backgroundImage: 'linear-gradient(to bottom right, #050a04, #0a1106)', // Deep Green Gradient
                color: '#f4f4f5',
                width: '100%',
                maxWidth: '36rem', // Slightly wider for breathing room
                borderRadius: '1.5rem', // Softer corners
                border: '1px solid #bef264',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(190, 242, 100, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh',
                position: 'relative',
                overflow: 'hidden'
            }} className="animate-in fade-in zoom-in duration-300">

                {/* HEADER with Green Accent */}
                <div style={{ padding: '2.5rem 3rem 1rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 className="text-2xl font-bold text-[#bef264]">Importação Padrão</h2>
                    {/* Close Button - Moved Up and Out */}
                    <button
                        onClick={onClose}
                        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', padding: '0.5rem', borderRadius: '9999px', color: '#71717a', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', zIndex: 20 }}
                        className="hover:text-white hover:bg-white/5 transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '0 3rem 2rem 3rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Siga o modelo para garantir que todos os dados (Contato, Empresa, Nome) sejam importados corretamente.</p>

                    {/* STEP 1: UPLOAD/DOWNLOAD */}
                    {step === 1 && (
                        <div className="space-y-6">
                            {/* Download Template */}
                            <div style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '1.5rem',
                                borderRadius: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.25rem',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
                                    <div className="p-3 bg-[#bef264]/10 rounded-xl text-[#bef264] shrink-0">
                                        <FileDown size={28} strokeWidth={1.5} />
                                    </div>
                                    <div className="text-center md:text-left flex-1" style={{ color: 'white' }}>
                                        <h3 className="text-lg font-bold mb-1">1. Obtenha o Modelo Padrão</h3>
                                        <p className="text-zinc-500 text-xs">Para importar sem erros, use nossa planilha oficial.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={downloadTemplate}
                                    style={{
                                        backgroundColor: '#18181b',
                                        color: 'white',
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.75rem',
                                        border: '1px solid #3f3f46',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.875rem'
                                    }}
                                    className="hover:bg-[#27272a] transition-colors"
                                >
                                    Baixar Planilha Modelo
                                </button>
                            </div>



                            {/* Upload Area */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                style={{
                                    border: `2px dashed ${isDragging ? '#bef264' : '#3f3f46'}`,
                                    backgroundColor: isDragging ? 'rgba(190, 242, 100, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '1rem',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                            >
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                    <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-[#bef264]/20 text-[#bef264]' : 'bg-zinc-800 text-zinc-400'}`}>
                                        <Upload size={32} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg mb-1">2. Envie sua planilha preenchida</p>
                                        <p className="text-zinc-500 text-sm">Arraste ou clique para selecionar</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PREVIEW */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1.25rem',
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                borderRadius: '1rem',
                                border: '1px solid #27272a'
                            }}>
                                <div className="p-3 bg-[#bef264]/10 text-[#bef264] rounded-xl">
                                    <Database size={24} />
                                </div>
                                <div>
                                    <p style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>Arquivo pronto para importar</p>
                                    <p style={{ fontSize: '0.875rem', color: '#a1a1aa' }}>{fileData.length} leads encontrados</p>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#bef264', marginBottom: '0.75rem', marginLeft: '0.25rem' }}>
                                    Nome para o novo Pipeline
                                </label>
                                <input
                                    value={pipelineName}
                                    onChange={(e) => setPipelineName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#0a0a0a',
                                        border: '1px solid #27272a',
                                        borderRadius: '0.75rem',
                                        padding: '1rem',
                                        color: 'white',
                                        outline: 'none',
                                        fontSize: '1rem',
                                        transition: 'border-color 0.2s'
                                    }}
                                    placeholder="Ex: Leads Importados"
                                    className="focus:border-[#bef264]"
                                />
                                <p style={{ fontSize: '0.75rem', color: '#52525b', marginTop: '0.75rem', marginLeft: '0.25rem' }}>
                                    Este será o nome do quadro onde os cards serão criados.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PROCESSING / SUCCESS */}
                    {step === 3 && (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10 animate-in fade-in">
                            {result ? (
                                <div className="animate-in zoom-in duration-300">
                                    <div className="inline-flex p-4 bg-[#bef264]/10 text-[#bef264] rounded-full mb-6">
                                        <Check size={48} strokeWidth={3} />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-3">Importação Concluída!</h3>
                                    <p className="text-zinc-400 mb-8 text-lg">{result.successCount} leads importados para <br /> <span className="text-[#bef264] font-semibold">"{pipelineName}"</span>.</p>
                                    <button
                                        onClick={() => { onClose(); onImportComplete(); }}
                                        className="bg-[#bef264] text-[#1a2e05] px-8 py-3.5 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-[#bef264]/20"
                                    >
                                        Ver Pipeline
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full max-w-sm space-y-6">
                                    <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Processando importação...</p>
                                    <div className="h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                                        <div
                                            className="h-full bg-[#bef264] rounded-full transition-all duration-300 relative overflow-hidden"
                                            style={{ width: `${progress}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <p className="text-sm font-mono text-[#bef264]">{progress}% completo</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* END OF SCROLLABLE CONTENT AREA */}

                {/* ERROR ALERT */}
                {error && (
                    <div className="absolute top-20 left-0 right-0 px-8 z-50 pointer-events-none">
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-4 text-red-200 animate-in slide-in-from-top-2 pointer-events-auto shadow-2xl backdrop-blur-md">
                            <AlertCircle size={24} className="text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-red-400 mb-1 text-lg">Não foi possível ler o arquivo</p>
                                <p className="text-sm opacity-80 leading-relaxed">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* FOOTER */}
                {step === 2 && (
                    <div style={{
                        padding: '2rem', // Increased padding
                        borderTop: '1px solid #27272a',
                        marginTop: 'auto',
                        display: 'flex',
                        justifyContent: 'center', // CENTERED BUTTONS
                        alignItems: 'center',
                        gap: '1rem',
                        backgroundColor: 'rgba(0,0,0,0.4)', // Slightly darker footer
                        borderBottomLeftRadius: '1.5rem',
                        borderBottomRightRadius: '1.5rem'
                    }}>
                        <button
                            onClick={() => setStep(1)}
                            style={{
                                padding: '0.75rem 2rem',
                                borderRadius: '0.75rem',
                                color: '#a1a1aa',
                                fontWeight: 600,
                                background: 'transparent',
                                border: '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            className="hover:text-white hover:bg-white/5 hover:border-white/10"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={runImport}
                            disabled={!pipelineName}
                            style={{
                                backgroundColor: '#bef264',
                                color: '#1a2e05',
                                padding: '0.75rem 2.5rem',
                                borderRadius: '0.75rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                border: 'none',
                                cursor: pipelineName ? 'pointer' : 'not-allowed',
                                opacity: pipelineName ? 1 : 0.5,
                                boxShadow: '0 4px 12px -2px rgba(190, 242, 100, 0.3)',
                                fontSize: '1rem'
                            }}
                            className="hover:brightness-110 active:scale-95 transition-all"
                        >
                            Confirmar Importação <ArrowRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportModal;
