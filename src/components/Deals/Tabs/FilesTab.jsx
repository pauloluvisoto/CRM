import React from 'react';
import { Paperclip, UploadCloud } from 'lucide-react';

const FilesTab = () => {
    return (
        <div className="files-tab empty-state">
            <div className="icon-circle">
                <UploadCloud size={32} />
            </div>
            <h3>Arquivos em Breve</h3>
            <p>O armazenamento de arquivos estará disponível na próxima atualização.</p>

            <button className="btn-upload disabled" disabled>
                <Paperclip size={16} /> Anexar Arquivo
            </button>

            <style>{`
                .files-tab {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    text-align: center;
                    color: var(--text-secondary);
                    border: 1px dashed var(--border-color);
                    border-radius: 8px;
                    background-color: var(--bg-primary);
                }
                .icon-circle {
                    width: 64px; height: 64px;
                    border-radius: 50%;
                    background-color: var(--bg-hover);
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 1rem;
                    color: var(--primary);
                }
                h3 { color: var(--text-primary); margin-bottom: 0.5rem; }
                p { font-size: 0.9rem; max-width: 250px; margin-bottom: 1.5rem; }

                .btn-upload {
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                    background: transparent;
                    color: var(--text-muted);
                    cursor: not-allowed;
                    display: flex; gap: 0.5rem; align-items: center;
                }
            `}</style>
        </div>
    );
};

export default FilesTab;
