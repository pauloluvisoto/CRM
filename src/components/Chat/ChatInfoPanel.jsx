import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, FileText, Globe, Instagram, Save, Briefcase, MapPin, Plus, Check, Link2, Building, ChevronRight, Star, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import UnifiedEntityModal from '../shared/UnifiedEntityModal';

export default function ChatInfoPanel({ conversation, onClose }) {
    const [loading, setLoading] = useState(false);
    const [showEntityModal, setShowEntityModal] = useState(false);
    const [entityModalMode, setEntityModalMode] = useState('link-deal');
    const [linkedDeal, setLinkedDeal] = useState(null);
    const [linkedContact, setLinkedContact] = useState(null);
    const [saved, setSaved] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        notes: '',
        instagram: '',
        bio: '',
        website: '',
        company_name: '',
        position: '',
        contact_name: ''
    });

    useEffect(() => {
        if (conversation) {
            setFormData({
                name: conversation.contact_name || conversation.name || 'Sem nome',
                phone: conversation.metadata?.phone || (conversation.platform === 'whatsapp' ? conversation.external_id : '') || '',
                email: conversation.metadata?.email || '',
                notes: conversation.metadata?.notes || '',
                instagram: conversation.metadata?.username || (conversation.platform === 'instagram' ? conversation.external_id : '') || '',
                bio: conversation.metadata?.biography || '',
                website: conversation.metadata?.website || '',
                company_name: conversation.metadata?.company_name || '',
                position: conversation.metadata?.position || '',
                contact_name: conversation.metadata?.contact_name || conversation.contact_name || ''
            });
            setSaved(false);

            // Check if conversation has linked deal or contact
            if (conversation.metadata?.linked_deal_id) {
                fetchLinkedDeal(conversation.metadata.linked_deal_id);
            } else {
                setLinkedDeal(null);
            }
            if (conversation.metadata?.linked_contact_id) {
                fetchLinkedContact(conversation.metadata.linked_contact_id);
            } else {
                setLinkedContact(null);
            }
        }
    }, [conversation]);

    const fetchLinkedDeal = async (dealId) => {
        const { data } = await supabase.from('central_vendas').select('id, empresa_cliente, nome_contato, stage').eq('id', dealId).single();
        setLinkedDeal(data);
    };

    const fetchLinkedContact = async (contactId) => {
        const { data } = await supabase.from('contacts').select('*').eq('id', contactId).single();
        setLinkedContact(data);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSaved(false);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const newMetadata = {
                ...conversation.metadata,
                phone: formData.phone,
                email: formData.email,
                notes: formData.notes,
                username: formData.instagram,
                biography: formData.bio,
                website: formData.website,
                company_name: formData.company_name,
                position: formData.position,
                contact_name: formData.contact_name
            };

            const { error } = await supabase
                .from('social_conversations')
                .update({
                    contact_name: formData.name,
                    metadata: newMetadata
                })
                .eq('id', conversation.id);

            if (error) throw error;
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Erro ao salvar informações.');
        } finally {
            setLoading(false);
        }
    };

    const handleEntitySuccess = async (result) => {
        // Update conversation metadata with linked entity
        const metaUpdate = { ...conversation.metadata };

        if (result.type === 'deal-linked' || result.type === 'deal-created') {
            metaUpdate.linked_deal_id = result.data.id;
            metaUpdate.company_name = result.data.empresa_cliente || result.data.company;
            setLinkedDeal(result.data);
            setFormData(prev => ({ ...prev, company_name: result.data.empresa_cliente || result.data.company || prev.company_name }));
        }
        if (result.type === 'contact-linked' || result.type === 'contact-created') {
            metaUpdate.linked_contact_id = result.data.id;
            setLinkedContact(result.data);
            if (result.data.name) setFormData(prev => ({ ...prev, contact_name: result.data.name }));
            if (result.data.phone) setFormData(prev => ({ ...prev, phone: result.data.phone }));
            if (result.data.email) setFormData(prev => ({ ...prev, email: result.data.email }));
        }

        await supabase
            .from('social_conversations')
            .update({ metadata: metaUpdate })
            .eq('id', conversation.id);
    };

    if (!conversation) return null;

    return (
        <>
            <div className="cip-panel">
                <div className="cip-header">
                    <span className="cip-title">Dados do contato</span>
                    <button onClick={onClose} className="cip-close">
                        <X size={18} />
                    </button>
                </div>

                <div className="cip-scroll">
                    {/* Profile */}
                    <div className="cip-profile">
                        <div className="cip-avatar">
                            {conversation.picture_url ? (
                                <img src={conversation.picture_url} alt={conversation.name} />
                            ) : (
                                <User size={36} />
                            )}
                        </div>
                        <h2 className="cip-name">{formData.name}</h2>
                        <span className="cip-source">
                            {conversation.platform === 'instagram' && <Instagram size={13} />}
                            {formData.instagram || conversation.external_id}
                        </span>
                    </div>

                    {/* Bio */}
                    {formData.bio && (
                        <div className="cip-section">
                            <div className="cip-bio">{formData.bio}</div>
                            {formData.website && (
                                <a href={formData.website} target="_blank" rel="noopener noreferrer" className="cip-website">
                                    <Globe size={13} /> {formData.website}
                                </a>
                            )}
                        </div>
                    )}

                    {/* Linked Entities */}
                    <div className="cip-section">
                        <h3 className="cip-section-title">Vinculações</h3>

                        {linkedDeal ? (
                            <div className="cip-linked-card">
                                <div className="cip-linked-icon biz">
                                    <Building size={16} />
                                </div>
                                <div className="cip-linked-info">
                                    <span className="cip-linked-label">Negócio</span>
                                    <span className="cip-linked-name">{linkedDeal.empresa_cliente}</span>
                                </div>
                                <button className="cip-linked-remove" onClick={async () => {
                                    const meta = { ...conversation.metadata };
                                    delete meta.linked_deal_id;
                                    await supabase.from('social_conversations').update({ metadata: meta }).eq('id', conversation.id);
                                    setLinkedDeal(null);
                                }}>
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button className="cip-link-btn" onClick={() => { setEntityModalMode('link-deal'); setShowEntityModal(true); }}>
                                <Building size={14} />
                                Vincular a um Negócio
                                <ChevronRight size={14} className="cip-btn-arrow" />
                            </button>
                        )}

                        {linkedContact ? (
                            <div className="cip-linked-card">
                                <div className="cip-linked-icon">
                                    <User size={16} />
                                </div>
                                <div className="cip-linked-info">
                                    <span className="cip-linked-label">Contato</span>
                                    <span className="cip-linked-name">{linkedContact.name}</span>
                                </div>
                                <button className="cip-linked-remove" onClick={async () => {
                                    const meta = { ...conversation.metadata };
                                    delete meta.linked_contact_id;
                                    await supabase.from('social_conversations').update({ metadata: meta }).eq('id', conversation.id);
                                    setLinkedContact(null);
                                }}>
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button className="cip-link-btn" onClick={() => { setEntityModalMode('link-contact'); setShowEntityModal(true); }}>
                                <User size={14} />
                                Vincular a um Contato
                                <ChevronRight size={14} className="cip-btn-arrow" />
                            </button>
                        )}
                    </div>

                    {/* Editable Fields */}
                    <div className="cip-section">
                        <h3 className="cip-section-title">Informações</h3>

                        <div className="cip-field">
                            <label><Briefcase size={13} /> Empresa</label>
                            <input name="company_name" value={formData.company_name} onChange={handleChange} placeholder="Nome da empresa" />
                        </div>
                        <div className="cip-field">
                            <label><User size={13} /> Nome do Contato</label>
                            <input name="contact_name" value={formData.contact_name} onChange={handleChange} placeholder="Nome completo" />
                        </div>
                        <div className="cip-field">
                            <label><MapPin size={13} /> Cargo</label>
                            <input name="position" value={formData.position} onChange={handleChange} placeholder="Ex: Gerente" />
                        </div>
                    </div>

                    <div className="cip-section">
                        <h3 className="cip-section-title">Contato & Notas</h3>

                        <div className="cip-field">
                            <label><Instagram size={13} /> Instagram</label>
                            <input name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@usuario" />
                        </div>
                        <div className="cip-field">
                            <label><Phone size={13} /> Telefone</label>
                            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+55..." />
                        </div>
                        <div className="cip-field">
                            <label><Mail size={13} /> Email</label>
                            <input name="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" />
                        </div>
                        <div className="cip-field">
                            <label><FileText size={13} /> Anotações</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Observações..." rows={3} />
                        </div>

                        <button className={`cip-save-btn ${saved ? 'saved' : ''}`} onClick={handleSave} disabled={loading}>
                            {saved ? <><Check size={16} /> Salvo!</> : <><Save size={16} /> {loading ? 'Salvando...' : 'Salvar Alterações'}</>}
                        </button>
                    </div>
                </div>

                <style>{`
                .cip-panel {
                    width: 340px;
                    background: linear-gradient(180deg, #16161e 0%, #111118 100%);
                    border-left: 1px solid rgba(255,255,255,0.06);
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    flex-shrink: 0;
                    animation: cipSlide 0.25s cubic-bezier(0.16,1,0.3,1);
                }

                @keyframes cipSlide {
                    from { width: 0; opacity: 0; }
                    to { width: 340px; opacity: 1; }
                }

                .cip-header {
                    padding: 14px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    background: rgba(0,0,0,0.2);
                }
                .cip-title { font-weight: 600; font-size: 0.9rem; color: #fff; }
                .cip-close {
                    background: transparent; border: none; color: #666;
                    cursor: pointer; padding: 4px; border-radius: 6px; transition: all 0.2s;
                }
                .cip-close:hover { color: #fff; background: rgba(255,255,255,0.05); }

                .cip-scroll {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0;
                }

                .cip-profile {
                    display: flex; flex-direction: column; align-items: center;
                    padding: 24px 16px 20px; text-align: center;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                }
                .cip-avatar {
                    width: 80px; height: 80px; border-radius: 50%;
                    overflow: hidden; background: rgba(255,255,255,0.04);
                    display: flex; align-items: center; justify-content: center;
                    color: #555; margin-bottom: 12px;
                    border: 2px solid rgba(255,255,255,0.06);
                }
                .cip-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .cip-name { font-size: 1.1rem; font-weight: 600; color: #fff; margin: 0 0 4px 0; }
                .cip-source { font-size: 0.8rem; color: #666; display: flex; align-items: center; gap: 4px; }

                .cip-section {
                    padding: 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                }
                .cip-section-title {
                    font-size: 0.72rem; font-weight: 700; color: #84cc16;
                    text-transform: uppercase; letter-spacing: 0.5px;
                    margin: 0 0 12px 0;
                }

                .cip-bio {
                    background: rgba(255,255,255,0.02); padding: 10px 12px; border-radius: 8px;
                    font-size: 0.82rem; color: #999; line-height: 1.5;
                }
                .cip-website {
                    display: flex; align-items: center; gap: 4px;
                    color: #84cc16; font-size: 0.8rem; text-decoration: none; margin-top: 6px;
                }
                .cip-website:hover { text-decoration: underline; }

                /* Linked entities */
                .cip-linked-card {
                    display: flex; align-items: center; gap: 10px;
                    padding: 10px 12px; background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;
                    margin-bottom: 8px;
                }
                .cip-linked-icon {
                    width: 34px; height: 34px; border-radius: 8px;
                    background: linear-gradient(135deg, rgba(132,204,22,0.12), rgba(101,163,13,0.06));
                    color: #84cc16;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .cip-linked-icon.biz {
                    background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(37,99,235,0.06));
                    color: #60a5fa;
                }
                .cip-linked-info { flex: 1; min-width: 0; }
                .cip-linked-label { font-size: 0.68rem; color: #555; text-transform: uppercase; font-weight: 600; display: block; }
                .cip-linked-name { font-size: 0.85rem; color: #fff; font-weight: 600; }
                .cip-linked-remove {
                    background: transparent; border: none; color: #555;
                    cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.2s;
                }
                .cip-linked-remove:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

                .cip-link-btn {
                    width: 100%; display: flex; align-items: center; gap: 8px;
                    padding: 10px 12px; background: transparent;
                    border: 1px dashed rgba(255,255,255,0.1); border-radius: 10px;
                    color: #777; font-size: 0.82rem; font-weight: 500;
                    cursor: pointer; transition: all 0.2s; margin-bottom: 8px;
                }
                .cip-link-btn:hover {
                    border-color: rgba(132,204,22,0.3); color: #84cc16;
                    background: rgba(132,204,22,0.04);
                }
                .cip-btn-arrow { margin-left: auto; opacity: 0.4; }
                .cip-link-btn:hover .cip-btn-arrow { opacity: 1; }

                /* Form Fields */
                .cip-field { margin-bottom: 10px; }
                .cip-field label {
                    display: flex; align-items: center; gap: 5px;
                    font-size: 0.72rem; color: #555; font-weight: 600;
                    margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px;
                }
                .cip-field input, .cip-field textarea {
                    width: 100%; padding: 8px 10px;
                    background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 8px; color: #fff; font-size: 0.85rem;
                    font-family: inherit; transition: border-color 0.2s;
                }
                .cip-field input:focus, .cip-field textarea:focus {
                    outline: none; border-color: rgba(132,204,22,0.35);
                }

                .cip-save-btn {
                    width: 100%; padding: 10px;
                    background: linear-gradient(135deg, #84cc16, #65a30d);
                    color: #000; border: none; border-radius: 8px;
                    font-weight: 700; font-size: 0.85rem;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
                    margin-top: 12px; transition: all 0.2s;
                }
                .cip-save-btn:hover { opacity: 0.9; }
                .cip-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .cip-save-btn.saved {
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                }
            `}</style>
            </div>

            <UnifiedEntityModal
                isOpen={showEntityModal}
                onClose={() => setShowEntityModal(false)}
                mode={entityModalMode}
                contactId={linkedContact?.id}
                prefill={{
                    name: formData.contact_name || formData.name,
                    company: formData.company_name,
                    phone: formData.phone,
                    email: formData.email,
                    instagram: formData.instagram,
                    conversationId: conversation?.id,
                    linkedContactId: linkedContact?.id,
                    linkedContactName: linkedContact?.name || formData.contact_name || formData.name,
                    linkedContactEmail: linkedContact?.email || formData.email,
                    linkedContactPhone: linkedContact?.phone || formData.phone
                }}
                onSuccess={(result) => {
                    handleEntitySuccess(result);
                    setShowEntityModal(false);
                }}
            />
        </>
    );
}
