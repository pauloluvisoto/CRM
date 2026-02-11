import React, { useEffect, useState } from 'react';
import { X, Mail, Phone, Calendar, Briefcase, Edit2, Save, Check, Building, Link2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import UnifiedEntityModal from '../shared/UnifiedEntityModal';

const ContactDetail = ({ contact, onClose, onUpdate }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [formData, setFormData] = useState({});
    const [linkedDeals, setLinkedDeals] = useState([]);
    const [showEntityModal, setShowEntityModal] = useState(false);

    useEffect(() => {
        if (contact) {
            setIsVisible(true);
            setFormData({
                name: contact.name,
                company: contact.company,
                role: contact.role,
                email: contact.email,
                phone: contact.phone
            });
            setIsEditing(false);
            setSaved(false);
            fetchLinkedDeals();
        }
    }, [contact]);

    const fetchLinkedDeals = async () => {
        if (!contact?.id) return;
        try {
            const { data } = await supabase
                .from('deal_contacts')
                .select(`*, deal:central_vendas(id, empresa_cliente, nome_contato, stage)`)
                .eq('contact_id', contact.id);
            setLinkedDeals(data?.map(dc => ({ ...dc.deal, role_in_deal: dc.role_in_deal })).filter(Boolean) || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSaved(false);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('contacts')
                .update({
                    name: formData.name,
                    company: formData.company,
                    role: formData.role,
                    email: formData.email,
                    phone: formData.phone
                })
                .eq('id', contact.id)
                .select();

            if (error) throw error;
            if (onUpdate && data[0]) {
                onUpdate({ ...contact, ...data[0] });
            }
            setIsEditing(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Error updating contact:', error);
            alert('Erro ao atualizar contato.');
        } finally {
            setLoading(false);
        }
    };

    if (!contact) return null;

    return (
        <>
            <div className={`cd-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}></div>
            <div className={`cd-panel ${isVisible ? 'visible' : ''}`}>
                {/* Header */}
                <div className="cd-header">
                    <div className="cd-profile">
                        <div className="cd-avatar">{contact.name?.charAt(0).toUpperCase()}</div>
                        <div className="cd-profile-text">
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="name"
                                    className="cd-edit-name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                <h2 className="cd-name">{contact.name}</h2>
                            )}
                            <span className="cd-badge">Ativo</span>
                        </div>
                    </div>
                    <div className="cd-actions">
                        {!isEditing ? (
                            <button className="cd-action-btn" onClick={() => setIsEditing(true)} title="Editar">
                                <Edit2 size={16} />
                            </button>
                        ) : (
                            <button className={`cd-action-btn primary ${saved ? 'saved' : ''}`} onClick={handleSave} disabled={loading}>
                                {saved ? <Check size={16} /> : <Save size={16} />}
                            </button>
                        )}
                        <button className="cd-action-btn" onClick={handleClose}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="cd-body">
                    {/* Contact Info */}
                    <section className="cd-section">
                        <h3 className="cd-section-title">Informações</h3>
                        <div className="cd-info-box">
                            <div className="cd-info-row">
                                <Mail size={14} className="cd-icon" />
                                {isEditing ? (
                                    <input type="email" name="email" className="cd-edit-input" value={formData.email} onChange={handleInputChange} placeholder="Email" />
                                ) : (
                                    <span>{contact.email || '—'}</span>
                                )}
                            </div>
                            <div className="cd-info-row">
                                <Phone size={14} className="cd-icon" />
                                {isEditing ? (
                                    <input type="tel" name="phone" className="cd-edit-input" value={formData.phone} onChange={handleInputChange} placeholder="Telefone" />
                                ) : (
                                    <span>{contact.phone || '—'}</span>
                                )}
                            </div>
                            <div className="cd-info-row">
                                <Briefcase size={14} className="cd-icon" />
                                {isEditing ? (
                                    <div className="cd-edit-inline">
                                        <input type="text" name="role" className="cd-edit-input" value={formData.role} onChange={handleInputChange} placeholder="Cargo" />
                                        <span className="cd-edit-sep">na</span>
                                        <input type="text" name="company" className="cd-edit-input" value={formData.company} onChange={handleInputChange} placeholder="Empresa" />
                                    </div>
                                ) : (
                                    <span>{contact.role || '—'} {contact.company ? `na ${contact.company}` : ''}</span>
                                )}
                            </div>
                            <div className="cd-info-row">
                                <Calendar size={14} className="cd-icon" />
                                <span>Último contato: {contact.lastContact ? new Date(contact.lastContact).toLocaleDateString('pt-BR') : '—'}</span>
                            </div>
                        </div>
                    </section>

                    {/* Linked Deals */}
                    <section className="cd-section">
                        <div className="cd-section-header">
                            <h3 className="cd-section-title">Negócios Vinculados</h3>
                            <button className="cd-link-add" onClick={() => setShowEntityModal(true)}>
                                <Plus size={13} /> Vincular
                            </button>
                        </div>
                        {linkedDeals.length === 0 ? (
                            <div className="cd-empty-link">
                                <Building size={20} style={{ opacity: 0.3 }} />
                                <p>Nenhum negócio vinculado</p>
                            </div>
                        ) : linkedDeals.map(d => (
                            <div key={d.id} className="cd-deal-card">
                                <div className="cd-deal-icon">
                                    <Building size={14} />
                                </div>
                                <div className="cd-deal-info">
                                    <span className="cd-deal-name">{d.empresa_cliente}</span>
                                    {d.role_in_deal && <span className="cd-deal-role">{d.role_in_deal}</span>}
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Timeline */}
                    <section className="cd-section">
                        <h3 className="cd-section-title">Histórico</h3>
                        <div className="cd-timeline">
                            <div className="cd-tl-item">
                                <div className="cd-tl-dot"></div>
                                <div className="cd-tl-content">
                                    <span className="cd-tl-date">Hoje, 14:30</span>
                                    <p>Visita a página de preços.</p>
                                </div>
                            </div>
                            <div className="cd-tl-item">
                                <div className="cd-tl-dot"></div>
                                <div className="cd-tl-content">
                                    <span className="cd-tl-date">Ontem, 09:15</span>
                                    <p>Email enviado: "Proposta Comercial v2"</p>
                                </div>
                            </div>
                            <div className="cd-tl-item">
                                <div className="cd-tl-dot"></div>
                                <div className="cd-tl-content">
                                    <span className="cd-tl-date">24 Out, 16:00</span>
                                    <p>Ligação realizada (Duração: 4m 32s)</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <UnifiedEntityModal
                isOpen={showEntityModal}
                onClose={() => setShowEntityModal(false)}
                mode="link-deal"
                contactId={contact.id}
                prefill={{ name: contact.name, company: contact.company }}
                onSuccess={(result) => {
                    fetchLinkedDeals();
                    setShowEntityModal(false);
                }}
            />

            <style>{`
                .cd-overlay {
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,0.55);
                    z-index: 40;
                    opacity: 0; pointer-events: none;
                    transition: opacity 0.3s ease;
                    backdrop-filter: blur(4px);
                }
                .cd-overlay.visible { opacity: 1; pointer-events: auto; }

                .cd-panel {
                    position: fixed; top: 0; right: 0; bottom: 0;
                    width: 440px;
                    background: linear-gradient(180deg, #18181f 0%, #111118 100%);
                    z-index: 50;
                    box-shadow: -8px 0 30px rgba(0,0,0,0.4);
                    transform: translateX(100%);
                    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
                    display: flex; flex-direction: column;
                    border-left: 1px solid rgba(255,255,255,0.06);
                }
                .cd-panel.visible { transform: translateX(0); }

                .cd-header {
                    padding: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    display: flex; justify-content: space-between; align-items: center;
                    background: rgba(0,0,0,0.15);
                }

                .cd-profile { display: flex; align-items: center; gap: 12px; }
                .cd-avatar {
                    width: 44px; height: 44px; border-radius: 50%;
                    background: linear-gradient(135deg, rgba(132,204,22,0.12), rgba(101,163,13,0.06));
                    color: #84cc16; font-size: 1.1rem; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                    border: 1.5px solid rgba(132,204,22,0.2);
                }
                .cd-name { font-size: 1.1rem; font-weight: 600; color: #fff; margin: 0 0 2px 0; }
                .cd-badge {
                    font-size: 0.68rem; font-weight: 600;
                    background: rgba(34,197,94,0.12); color: #22c55e;
                    padding: 2px 8px; border-radius: 99px;
                }

                .cd-edit-name {
                    width: 100%; padding: 4px 8px;
                    background: rgba(0,0,0,0.3); border: 1px solid rgba(132,204,22,0.3);
                    border-radius: 6px; color: #fff; font-size: 1.05rem; font-weight: 600;
                }
                .cd-edit-name:focus { outline: none; }

                .cd-actions { display: flex; gap: 6px; }
                .cd-action-btn {
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
                    color: #888; cursor: pointer; padding: 6px; border-radius: 6px;
                    transition: all 0.2s;
                }
                .cd-action-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
                .cd-action-btn.primary { color: #84cc16; border-color: rgba(132,204,22,0.2); }
                .cd-action-btn.primary:hover { background: rgba(132,204,22,0.1); }
                .cd-action-btn.saved { color: #22c55e; border-color: rgba(34,197,94,0.3); }

                .cd-body { flex: 1; overflow-y: auto; padding: 0; }

                .cd-section {
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                }
                .cd-section-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 10px;
                }
                .cd-section-title {
                    font-size: 0.72rem; font-weight: 700; color: #84cc16;
                    text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;
                }
                .cd-section-header .cd-section-title { margin-bottom: 0; }

                .cd-info-box {
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.04);
                    border-radius: 10px; padding: 4px 0;
                }
                .cd-info-row {
                    display: flex; align-items: center; gap: 10px;
                    padding: 10px 14px;
                    color: #ccc; font-size: 0.88rem;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                }
                .cd-info-row:last-child { border-bottom: none; }
                .cd-icon { color: #555; flex-shrink: 0; }

                .cd-edit-input {
                    flex: 1; padding: 4px 8px;
                    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 4px; color: #fff; font-size: 0.85rem;
                }
                .cd-edit-input:focus { outline: none; border-color: rgba(132,204,22,0.35); }
                .cd-edit-inline { display: flex; gap: 6px; align-items: center; flex: 1; }
                .cd-edit-sep { color: #555; font-size: 0.82rem; }

                /* Deal Cards */
                .cd-link-add {
                    display: flex; align-items: center; gap: 4px;
                    background: rgba(132,204,22,0.08); color: #84cc16;
                    border: 1px solid rgba(132,204,22,0.2); border-radius: 6px;
                    padding: 4px 10px; font-size: 0.75rem; font-weight: 600;
                    cursor: pointer; transition: all 0.2s;
                }
                .cd-link-add:hover { background: #84cc16; color: #000; }

                .cd-deal-card {
                    display: flex; align-items: center; gap: 10px;
                    padding: 10px 12px; background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05); border-radius: 8px;
                    margin-bottom: 6px;
                }
                .cd-deal-icon {
                    width: 30px; height: 30px; border-radius: 7px;
                    background: rgba(59,130,246,0.1); color: #60a5fa;
                    display: flex; align-items: center; justify-content: center;
                }
                .cd-deal-name { font-weight: 600; color: #fff; font-size: 0.85rem; }
                .cd-deal-role { font-size: 0.72rem; color: #84cc16; margin-top: 1px; display: block; }

                .cd-empty-link {
                    text-align: center; padding: 16px 0; color: #444; font-size: 0.82rem;
                }
                .cd-empty-link p { margin: 6px 0 0; }

                /* Timeline */
                .cd-timeline { position: relative; }
                .cd-tl-item {
                    display: flex; gap: 12px; padding-bottom: 16px; position: relative;
                }
                .cd-tl-item::before {
                    content: ''; position: absolute; left: 6px; top: 10px; bottom: 0;
                    width: 1.5px; background: rgba(255,255,255,0.06);
                }
                .cd-tl-item:last-child::before { display: none; }
                .cd-tl-dot {
                    width: 13px; height: 13px; border-radius: 50%;
                    background: #111; border: 2px solid #84cc16;
                    z-index: 1; margin-top: 3px; flex-shrink: 0;
                }
                .cd-tl-date { font-size: 0.72rem; color: #555; display: block; margin-bottom: 2px; }
                .cd-tl-content p { font-size: 0.85rem; color: #ccc; margin: 0; }
            `}</style>
        </>
    );
};

export default ContactDetail;
