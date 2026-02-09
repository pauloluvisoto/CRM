
import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Instagram, MessageCircle, FileText, CheckSquare, Paperclip, Layout } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { logActivity } from '../../utils/logger';
import NotesTab from './Tabs/NotesTab';
import TasksTab from './Tabs/TasksTab';
import FilesTab from './Tabs/FilesTab';

const EditDealModal = ({ isOpen, onClose, deal, columns, onDealUpdated, onDealDeleted }) => {
    // UI Version: 2.5 (Fully Synchronized, Commission Removed)
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general'); // general | notes | tasks | files

    const [formData, setFormData] = useState({
        company: '',
        contact_name: '',
        column_id: '',
        instagram: '',
        whatsapp: ''
    });

    useEffect(() => {
        if (deal) {
            setFormData({
                company: deal.company || deal.empresa_cliente || '',
                contact_name: deal.nome_contato || deal.contact_name || '',
                column_id: deal.stage || deal.columnId || deal.column_id || '',
                instagram: deal.instagram || '',
                whatsapp: deal.whatsapp || ''
            });
            setActiveTab('general'); // Reset tab on open
        }
    }, [deal, isOpen]);

    if (!isOpen || !deal) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('central_vendas')
                .update({
                    empresa_cliente: formData.company,
                    nome_contato: formData.contact_name,
                    stage: formData.column_id,
                    instagram: formData.instagram,
                    whatsapp: formData.whatsapp
                })
                .eq('id', deal.id)
                .select();

            if (error) throw error;

            if (onDealUpdated && data && data.length > 0) {
                const updatedDeal = data[0];
                onDealUpdated({
                    ...deal,
                    id: updatedDeal.id,
                    title: updatedDeal.empresa_cliente,
                    company: updatedDeal.empresa_cliente,
                    contact_name: updatedDeal.nome_contato,
                    columnId: updatedDeal.stage,
                    instagram: updatedDeal.instagram,
                    whatsapp: updatedDeal.whatsapp,
                    user_id: updatedDeal.created_by,
                    tags: deal.tags || []
                });

                // LOG UPDATE
                await logActivity({
                    actionType: 'UPDATE',
                    entityType: 'DEAL',
                    entityId: updatedDeal.id,
                    details: {
                        name: updatedDeal.empresa_cliente,
                        changes: {
                            column: updatedDeal.stage !== deal.columnId ? { from: deal.columnId, to: updatedDeal.stage } : undefined
                        }
                    }
                });
            }
            onClose();
        } catch (error) {
            console.error('Error updating deal:', error);
            alert('Erro ao atualizar negócio: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja apagar este negócio? Esta ação não pode ser desfeita.')) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('central_vendas')
                .delete()
                .eq('id', deal.id)
                .select();

            if (error) throw error;

            if (onDealDeleted) {
                onDealDeleted(deal.id);
                // LOG DELETE
                await logActivity({
                    actionType: 'DELETE',
                    entityType: 'DEAL',
                    entityId: deal.id,
                    details: { name: deal.title || deal.company }
                });
            }
            onClose();
        } catch (error) {
            console.error('Error deleting deal:', error);
            alert('Erro ao apagar negócio: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.75);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(8px);
                }

                .modal-content {
                    background: linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 650px;
                    height: 85vh;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
                }

                .close-btn {
                    position: absolute;
                    top: 1.25rem; right: 1.25rem;
                    color: var(--text-secondary);
                    padding: 0.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    cursor: pointer;
                    z-index: 10;
                }

                .modal-header {
                    padding: 1.75rem 2rem 0 2rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }
                .modal-header h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 1.25rem;
                }

                .tabs-nav { display: flex; gap: 2rem; }
                .tab-btn {
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid transparent;
                    color: var(--text-secondary);
                    padding-bottom: 1rem;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.9rem;
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .tab-btn.active {
                    color: #bef264;
                    border-bottom-color: #bef264;
                }

                .modal-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 2rem;
                }

                .form-group { margin-bottom: 1.5rem; }
                .form-label {
                    display: block;
                    margin-bottom: 0.625rem;
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .form-input {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    color: var(--text-primary);
                    font-size: 1rem;
                }

                .modal-footer {
                    padding: 1.5rem 2rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex;
                    justify-content: space-between;
                }

                .btn-delete {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    padding: 0.75rem 1.25rem;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex; align-items: center; gap: 0.625rem;
                    font-weight: 600;
                }

                .btn-submit {
                    padding: 0.875rem 1.75rem;
                    background: linear-gradient(135deg, #bef264 0%, #a3e635 100%);
                    color: #1a1a1a;
                    border: none;
                    border-radius: 10px;
                    font-weight: 700;
                    display: flex; align-items: center; gap: 0.625rem;
                    cursor: pointer;
                }
            `}</style>

            <div className="modal-content">
                <button className="close-btn" onClick={onClose}><X size={20} /></button>

                <div className="modal-header">
                    <h2>{formData.company || 'Negócio'}</h2>
                    <div className="tabs-nav">
                        <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                            <Layout size={16} /> Detalhes
                        </button>
                        <button className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
                            <FileText size={16} /> Notas
                        </button>
                        <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
                            <CheckSquare size={16} /> Tarefas
                        </button>
                        <button className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
                            <Paperclip size={16} /> Arquivos
                        </button>
                    </div>
                </div>

                <div className="modal-body">
                    {activeTab === 'general' && (
                        <form id="edit-deal-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">NOME DA EMPRESA</label>
                                <input className="form-input" name="company" value={formData.company} onChange={handleChange} placeholder="Ex: Empresa X" required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">NOME DO CONTATO</label>
                                <input className="form-input" name="contact_name" value={formData.contact_name} onChange={handleChange} placeholder="Ex: João Silva" />
                            </div>


                            <div className="form-group">
                                <label className="form-label">ETAPA ATUAL</label>
                                <select className="form-input" name="column_id" value={formData.column_id} onChange={handleChange}>
                                    {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label"><Instagram size={14} style={{ display: 'inline', marginRight: 4 }} /> INSTAGRAM</label>
                                    <input className="form-input" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@usuario ou link" />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label"><MessageCircle size={14} style={{ display: 'inline', marginRight: 4 }} /> WHATSAPP</label>
                                    <input className="form-input" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="(11) 99999-9999" />
                                </div>
                            </div>
                        </form>
                    )}

                    {activeTab === 'notes' && <NotesTab dealId={deal.id} />}
                    {activeTab === 'tasks' && <TasksTab dealId={deal.id} />}
                    {activeTab === 'files' && <FilesTab dealId={deal.id} />}
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-delete" onClick={handleDelete}>
                        <Trash2 size={18} /> Apagar Negócio
                    </button>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" className="btn-submit" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} onClick={onClose}>Fechar</button>
                        {activeTab === 'general' && (
                            <button type="submit" form="edit-deal-form" className="btn-submit" disabled={loading}>
                                <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditDealModal;
