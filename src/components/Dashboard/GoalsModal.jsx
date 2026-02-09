
import React from 'react';
import { X, Target } from 'lucide-react';
import CommercialManagement2026 from './CommercialManagement2026';

const GoalsModal = ({ isOpen, onClose, deals, pipelines, stages }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    backdrop-filter: blur(10px);
                }
                .modal-content {
                    background: #121214;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 24px;
                    width: 95%;
                    max-width: 1400px;
                    height: 90vh;
                    overflow-y: auto;
                    padding: 2.5rem;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8);
                }
                .modal-content::-webkit-scrollbar {
                  width: 8px;
                }
                .modal-content::-webkit-scrollbar-track {
                  background: rgba(0, 0, 0, 0.2); 
                }
                .modal-content::-webkit-scrollbar-thumb {
                  background: #3f3f46; 
                  border-radius: 4px;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .modal-header h2 {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-transform: uppercase;
                    letter-spacing: -0.5px;
                }
            `}</style>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><Target size={24} className="text-brand" /> Gestão Comercial - Janeiro 2026</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* RENDER NEW MANAGEMENT VIEW */}
                <CommercialManagement2026
                    deals={deals}
                    pipelines={pipelines}
                    stages={stages}
                />
            </div>
        </div>
    );
};

export default GoalsModal;

