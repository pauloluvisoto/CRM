
import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Instagram, MessageCircle, FileText, CheckSquare, Paperclip, Layout, Users, Plus, Star, Mail, Phone, Link2, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { logActivity } from '../../utils/logger';
import NotesTab from './Tabs/NotesTab';
import TasksTab from './Tabs/TasksTab';
import FilesTab from './Tabs/FilesTab';
import UnifiedEntityModal from '../shared/UnifiedEntityModal';

const EditDealModal = ({ isOpen, onClose, deal, columns, onDealUpdated, onDealDeleted }) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [linkedContacts, setLinkedContacts] = useState([]);
    const [showEntityModal, setShowEntityModal] = useState(false);

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
                instagram: deal.instagram_username || deal.instagram || '',
                whatsapp: deal.whatsapp || ''
            });
            setActiveTab('general');
            fetchLinkedContacts();
        }
    }, [deal, isOpen]);

    const fetchLinkedContacts = async () => {
        if (!deal?.id) return;
        try {
            const { data } = await supabase
                .from('deal_contacts')
                .select(`*, contact:contacts(*)`)
                .eq('deal_id', deal.id);
            setLinkedContacts(data?.map(dc => ({ ...dc.contact, role_in_deal: dc.role_in_deal, is_primary: dc.is_primary, link_id: dc.id })) || []);
        } catch (err) {
            console.error('Error fetching linked contacts:', err);
        }
    };

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
                    instagram_username: formData.instagram,
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
                    instagram: updatedDeal.instagram_username || updatedDeal.instagram,
                    whatsapp: updatedDeal.whatsapp,
                    user_id: updatedDeal.created_by,
                    tags: deal.tags || []
                });

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

    const handleUnlinkContact = async (contactId) => {
        try {
            await supabase.from('deal_contacts').delete().eq('deal_id', deal.id).eq('contact_id', contactId);
            fetchLinkedContacts();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSetPrimary = async (contactId) => {
        try {
            await supabase.from('deal_contacts').update({ is_primary: false }).eq('deal_id', deal.id);
            await supabase.from('deal_contacts').update({ is_primary: true }).eq('deal_id', deal.id).eq('contact_id', contactId);
            fetchLinkedContacts();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <div className="edm-overlay">
                <style>{`
                .edm-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(8px);
                }

                .edm-modal {
                    background: linear-gradient(160deg, #1a1a24 0%, #12121a 100%);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    width: 100%;
                    max-width: 680px;
                    height: 85vh;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
                    overflow: hidden;
                }

                .edm-close {
                    position: absolute;
                    top: 1.25rem; right: 1.25rem;
                    color: #888;
                    padding: 6px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 8px;
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.2s;
                }
                .edm-close:hover { color: #ff6b6b; background: rgba(255,80,80,0.1); border-color: rgba(255,80,80,0.3); }

                .edm-header {
                    padding: 1.75rem 2rem 0 2rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }
                .edm-header h2 {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 1.25rem 0;
                }

                .edm-tabs { display: flex; gap: 0; }
                .edm-tab-btn {
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid transparent;
                    color: #777;
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.85rem;
                    display: flex; align-items: center; gap: 6px;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .edm-tab-btn:hover { color: #ccc; }
                .edm-tab-btn.active {
                    color: #84cc16;
                    border-bottom-color: #84cc16;
                }

                .edm-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem 2rem;
                }

                .edm-field { margin-bottom: 1.25rem; }
                .edm-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 6px;
                    color: #777;
                    font-size: 0.78rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.4px;
                }
                .edm-input {
                    width: 100%;
                    padding: 10px 12px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    color: #fff;
                    font-size: 0.95rem;
                    transition: border-color 0.2s;
                    font-family: inherit;
                }
                .edm-input:focus { outline: none; border-color: rgba(132, 204, 22, 0.4); }

                .edm-row { display: flex; gap: 12px; }
                .edm-row > .edm-field { flex: 1; }

                .edm-footer {
                    padding: 1rem 2rem 1.25rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .edm-btn-delete {
                    background: rgba(239, 68, 68, 0.08);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    padding: 8px 16px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex; align-items: center; gap: 6px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    transition: all 0.2s;
                }
                .edm-btn-delete:hover { background: rgba(239,68,68,0.15); }

                .edm-btn-save {
                    padding: 10px 24px;
                    background: linear-gradient(135deg, #84cc16, #65a30d);
                    color: #000;
                    border: none;
                    border-radius: 10px;
                    font-weight: 700;
                    display: flex; align-items: center; gap: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(132, 204, 22, 0.25);
                }
                .edm-btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(132,204,22,0.35); }

                .edm-btn-ghost {
                    padding: 10px 20px;
                    background: rgba(255,255,255,0.05);
                    color: #ccc;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }
                .edm-btn-ghost:hover { background: rgba(255,255,255,0.08); }

                /* Contacts tab */
                .edm-contacts-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .edm-contacts-header h3 {
                    color: #fff;
                    font-size: 1rem;
                    margin: 0;
                }
                .edm-add-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 14px;
                    background: rgba(132, 204, 22, 0.1);
                    color: #84cc16;
                    border: 1px solid rgba(132, 204, 22, 0.25);
                    border-radius: 8px;
                    font-size: 0.82rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .edm-add-btn:hover { background: #84cc16; color: #000; }

                .edm-contact-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 14px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 12px;
                    margin-bottom: 8px;
                    transition: all 0.2s;
                }
                .edm-contact-card:hover { background: rgba(255,255,255,0.04); }
                .edm-contact-card.primary { border-color: rgba(251, 191, 36, 0.3); }

                .edm-contact-avatar {
                    width: 40px; height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, rgba(132,204,22,0.15), rgba(101,163,13,0.08));
                    color: #84cc16;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; font-size: 1rem;
                    flex-shrink: 0;
                    border: 1.5px solid rgba(132,204,22,0.2);
                }

                .edm-contact-info { flex: 1; min-width: 0; }
                .edm-contact-name {
                    display: flex; align-items: center; gap: 6px;
                    font-weight: 600; color: #fff; font-size: 0.9rem;
                }
                .edm-contact-role {
                    font-size: 0.78rem; color: #84cc16; margin-top: 2px;
                }
                .edm-contact-meta {
                    display: flex; gap: 12px; margin-top: 4px; font-size: 0.75rem; color: #666;
                }
                .edm-contact-meta span { display: flex; align-items: center; gap: 4px; }

                .edm-contact-actions {
                    display: flex; gap: 4px;
                }
                .edm-contact-actions button {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.06);
                    color: #888;
                    padding: 6px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .edm-contact-actions button:hover {
                    background: rgba(132,204,22,0.1);
                    border-color: rgba(132,204,22,0.25);
                    color: #84cc16;
                }
                .edm-contact-actions button.danger:hover {
                    background: rgba(239,68,68,0.1);
                    border-color: rgba(239,68,68,0.25);
                    color: #ef4444;
                }

                .edm-empty-contacts {
                    text-align: center;
                    padding: 2.5rem 1rem;
                    color: #555;
                }
                .edm-empty-contacts p { margin-bottom: 0.75rem; font-size: 0.9rem; }

                .edm-primary-star { color: #fbbf24; }
            `}</style>

                <div className="edm-modal">
                    <button className="edm-close" onClick={onClose}><X size={20} /></button>

                    <div className="edm-header">
                        <h2>{formData.company || 'Negócio'}</h2>
                        <div className="edm-tabs">
                            <button className={`edm-tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                                <Layout size={15} /> Detalhes
                            </button>
                            <button className={`edm-tab-btn ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>
                                <Users size={15} /> Contatos
                                {linkedContacts.length > 0 && <span style={{ background: 'rgba(132,204,22,0.15)', color: '#84cc16', padding: '1px 6px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700 }}>{linkedContacts.length}</span>}
                            </button>
                            <button className={`edm-tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
                                <FileText size={15} /> Notas
                            </button>
                            <button className={`edm-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
                                <CheckSquare size={15} /> Tarefas
                            </button>
                            <button className={`edm-tab-btn ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
                                <Paperclip size={15} /> Arquivos
                            </button>
                        </div>
                    </div>

                    <div className="edm-body">
                        {activeTab === 'general' && (
                            <form id="edit-deal-form" onSubmit={handleSubmit}>
                                <div className="edm-field">
                                    <label className="edm-label">Nome da Empresa</label>
                                    <input className="edm-input" name="company" value={formData.company} onChange={handleChange} placeholder="Ex: Empresa X" required />
                                </div>

                                <div className="edm-field">
                                    <label className="edm-label">Nome do Contato</label>
                                    <input className="edm-input" name="contact_name" value={formData.contact_name} onChange={handleChange} placeholder="Ex: João Silva" />
                                </div>

                                <div className="edm-field">
                                    <label className="edm-label">Etapa Atual</label>
                                    <select className="edm-input" name="column_id" value={formData.column_id} onChange={handleChange}>
                                        {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
                                    </select>
                                </div>

                                <div className="edm-row">
                                    <div className="edm-field">
                                        <label className="edm-label"><Instagram size={13} /> Instagram</label>
                                        <input className="edm-input" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@usuario ou link" />
                                    </div>
                                    <div className="edm-field">
                                        <label className="edm-label"><MessageCircle size={13} /> WhatsApp</label>
                                        <input className="edm-input" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="(11) 99999-9999" />
                                    </div>
                                </div>
                            </form>
                        )}

                        {activeTab === 'contacts' && (
                            <div>
                                <div className="edm-contacts-header">
                                    <h3>Contatos Vinculados</h3>
                                    <button className="edm-add-btn" onClick={() => setShowEntityModal(true)}>
                                        <Plus size={14} /> Vincular Contato
                                    </button>
                                </div>

                                {linkedContacts.length === 0 ? (
                                    <div className="edm-empty-contacts">
                                        <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                        <p>Nenhum contato vinculado</p>
                                        <button className="edm-add-btn" onClick={() => setShowEntityModal(true)}>
                                            <Plus size={14} /> Vincular ou criar contato
                                        </button>
                                    </div>
                                ) : (
                                    linkedContacts.map(c => (
                                        <div key={c.id} className={`edm-contact-card ${c.is_primary ? 'primary' : ''}`}>
                                            <div className="edm-contact-avatar">
                                                {c.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="edm-contact-info">
                                                <div className="edm-contact-name">
                                                    {c.name}
                                                    {c.is_primary && <Star size={13} className="edm-primary-star" fill="#fbbf24" />}
                                                </div>
                                                <div className="edm-contact-role">{c.role_in_deal || c.role || 'Contato'}</div>
                                                <div className="edm-contact-meta">
                                                    {c.email && <span><Mail size={11} /> {c.email}</span>}
                                                    {c.phone && <span><Phone size={11} /> {c.phone}</span>}
                                                </div>
                                            </div>
                                            <div className="edm-contact-actions">
                                                {!c.is_primary && (
                                                    <button onClick={() => handleSetPrimary(c.id)} title="Definir como principal">
                                                        <Star size={14} />
                                                    </button>
                                                )}
                                                <button className="danger" onClick={() => handleUnlinkContact(c.id)} title="Desvincular">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'notes' && <NotesTab dealId={deal.id} />}
                        {activeTab === 'tasks' && <TasksTab dealId={deal.id} />}
                        {activeTab === 'files' && <FilesTab dealId={deal.id} />}
                    </div>

                    <div className="edm-footer">
                        <button type="button" className="edm-btn-delete" onClick={handleDelete}>
                            <Trash2 size={16} /> Apagar
                        </button>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className="edm-btn-ghost" onClick={onClose}>Fechar</button>
                            {activeTab === 'general' && (
                                <button type="submit" form="edit-deal-form" className="edm-btn-save" disabled={loading}>
                                    <Save size={16} /> {loading ? 'Salvando...' : 'Salvar'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <UnifiedEntityModal
                isOpen={showEntityModal}
                onClose={() => setShowEntityModal(false)}
                mode="link-contact"
                dealId={deal.id}
                prefill={{ company: formData.company }}
                onSuccess={(result) => {
                    fetchLinkedContacts();
                    setShowEntityModal(false);
                }}
            />
        </>
    );
};

export default EditDealModal;
