import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, FileText, Globe, Instagram, Save, Briefcase, MapPin, Plus, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function ChatInfoPanel({ conversation, onClose }) {
    const [loading, setLoading] = useState(false);
    const [pipelines, setPipelines] = useState([]);
    const [stages, setStages] = useState([]);
    const [selectedPipeline, setSelectedPipeline] = useState('');
    const [selectedStage, setSelectedStage] = useState('');
    const [showCrmForm, setShowCrmForm] = useState(false);

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
        contact_name: '' // Distinct from the chat name if needed
    });

    // Initialize Data
    useEffect(() => {
        if (conversation) {
            setFormData({
                name: conversation.contact_name || conversation.name || 'Sem nome', // Prioritize contact_name
                phone: conversation.metadata?.phone || '',
                email: conversation.metadata?.email || '',
                notes: conversation.metadata?.notes || '',
                instagram: conversation.metadata?.username || conversation.external_id || '', // Try to match Instagram logic
                bio: conversation.metadata?.biography || '',
                website: conversation.metadata?.website || '',
                company_name: conversation.metadata?.company_name || '',
                position: conversation.metadata?.position || '',
                contact_name: conversation.metadata?.contact_name || conversation.contact_name || ''
            });
        }
    }, [conversation]);

    // Fetch Pipelines on Mount
    useEffect(() => {
        const fetchPipelines = async () => {
            const { data, error } = await supabase.from('pipelines').select('id, name');
            if (data) {
                setPipelines(data);
                if (data.length > 0) setSelectedPipeline(data[0].id);
            }
        };
        fetchPipelines();
    }, []);

    // Fetch Stages when Pipeline Changes
    useEffect(() => {
        if (!selectedPipeline) return;
        const fetchStages = async () => {
            const { data } = await supabase
                .from('pipeline_stages')
                .select('id, name')
                .eq('pipeline_id', selectedPipeline)
                .order('position');

            if (data) {
                setStages(data);
                if (data.length > 0) setSelectedStage(data[0].id);
            }
        };
        fetchStages();
    }, [selectedPipeline]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                    contact_name: formData.name, // Update displaying name
                    metadata: newMetadata
                })
                .eq('id', conversation.id);

            if (error) throw error;
            alert('Dados salvos com sucesso!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Erro ao salvar informações.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCrm = async () => {
        if (!selectedStage) return alert('Selecione uma fase do pipeline.');

        try {
            const { error } = await supabase
                .from('central_vendas')
                .insert({
                    empresa_cliente: formData.company_name || formData.name,
                    nome_contato: formData.contact_name || formData.name,
                    stage: selectedStage,
                    origem: 'Chat',
                    status_contrato: 'Identificado',
                    faturamento_mensal: 0, // Default
                    tipo_pipeline: pipelines.find(p => p.id === selectedPipeline)?.name === 'Ativo' ? 'Ativo_Diagnostico' : 'Receptivo' // Heuristic mapping
                });

            if (error) throw error;
            alert('Lead adicionado ao CRM com sucesso!');
            setShowCrmForm(false);
        } catch (err) {
            console.error('Error adding to CRM:', err);
            alert('Erro ao adicionar ao CRM.');
        }
    };

    if (!conversation) return null;

    return (
        <div className="chat-info-panel">
            <div className="panel-header">
                <span className="panel-title">Dados do contato</span>
                <button onClick={onClose} className="close-btn">
                    <X size={20} />
                </button>
            </div>

            <div className="panel-content">
                {/* Profile Header */}
                <div className="profile-section">
                    <div className="profile-image-large">
                        {conversation.picture_url ? (
                            <img src={conversation.picture_url} alt={conversation.name} />
                        ) : (
                            <div className="avatar-placeholder-large">
                                <User size={40} />
                            </div>
                        )}
                    </div>
                    <div className="profile-header-info">
                        <h2 className="profile-name-display">{formData.name}</h2>
                        <span className="profile-source">
                            {conversation.platform === 'instagram' && <Instagram size={14} style={{ marginRight: 4 }} />}
                            {formData.instagram || '@usuario_instagram'}
                        </span>
                    </div>
                </div>

                {/* Bio / About */}
                <div className="info-group">
                    <label>Sobre</label>
                    <div className="info-display-box">
                        {formData.bio || 'Sem biografia disponível.'}
                    </div>
                    {formData.website && (
                        <a href={formData.website} target="_blank" rel="noopener noreferrer" className="website-link">
                            <Globe size={14} />
                            {formData.website}
                        </a>
                    )}
                </div>

                {/* CRM Actions */}
                <div className="crm-actions-section">
                    {!showCrmForm ? (
                        <button className="add-crm-btn" onClick={() => setShowCrmForm(true)}>
                            <Plus size={16} />
                            Adicionar ao CRM
                        </button>
                    ) : (
                        <div className="crm-form-box">
                            <h4 className="crm-form-title">Adicionar Negócio</h4>
                            <div className="input-group">
                                <label>Pipeline</label>
                                <select
                                    value={selectedPipeline}
                                    onChange={(e) => setSelectedPipeline(e.target.value)}
                                >
                                    {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Fase / Lista</label>
                                <select
                                    value={selectedStage}
                                    onChange={(e) => setSelectedStage(e.target.value)}
                                >
                                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="crm-form-actions">
                                <button className="cancel-mini-btn" onClick={() => setShowCrmForm(false)}>Cancelar</button>
                                <button className="confirm-mini-btn" onClick={handleAddToCrm}>
                                    <Check size={14} /> Confirmar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Editable Fields */}
                <div className="edit-section">
                    <h3 className="section-title">Informações do Negócio</h3>

                    <div className="input-group">
                        <label><Briefcase size={14} /> Nome da Empresa</label>
                        <input
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                            placeholder="Ex: Recupera.ia"
                        />
                    </div>

                    <div className="input-group">
                        <label><User size={14} /> Nome do Contato</label>
                        <input
                            name="contact_name"
                            value={formData.contact_name}
                            onChange={handleChange}
                            placeholder="Nome Completo"
                        />
                    </div>

                    <div className="input-group">
                        <label><MapPin size={14} /> Cargo / Posição</label>
                        <input
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            placeholder="Ex: Gerente de Vendas"
                        />
                    </div>

                    <h3 className="section-title" style={{ marginTop: '1.5rem' }}>Contato & Notas</h3>

                    <div className="input-group">
                        <label><Instagram size={14} /> Instagram (@)</label>
                        <input
                            name="instagram"
                            value={formData.instagram}
                            onChange={handleChange}
                            placeholder="@usuario"
                        />
                    </div>

                    <div className="input-group">
                        <label><Phone size={14} /> Telefone</label>
                        <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+55..."
                        />
                    </div>

                    <div className="input-group">
                        <label><Mail size={14} /> Email</label>
                        <input
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="email@exemplo.com"
                        />
                    </div>

                    <div className="input-group full-width">
                        <label><FileText size={14} /> Anotações</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Tarefas, observações, histórico..."
                            rows={4}
                        />
                    </div>

                    <button
                        className="save-btn"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        <Save size={16} />
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>

            <style>
                {`
                .chat-info-panel {
                    width: 360px;
                    background: var(--bg-secondary);
                    border-left: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    overflow-y: auto;
                    flex-shrink: 0;
                    animation: slideIn 0.2s ease-out;
                }

                @keyframes slideIn {
                    from { width: 0; opacity: 0; }
                    to { width: 360px; opacity: 1; }
                }

                .panel-header {
                    padding: 1rem 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid var(--border-color);
                    background: var(--bg-surface);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .panel-title { font-weight: 600; font-size: 1rem; color: white; }

                .close-btn {
                    background: transparent; border: none; color: var(--text-muted);
                    cursor: pointer; padding: 4px; border-radius: 4px; transition: color 0.2s;
                }
                .close-btn:hover { color: white; background: rgba(255,255,255,0.05); }

                .panel-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }

                .profile-section {
                    display: flex; flex-direction: column; align-items: center; text-align: center;
                    gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-color);
                }

                .profile-image-large {
                    width: 90px; height: 90px;
                    border-radius: 50%; overflow: hidden;
                    background: var(--bg-primary);
                    border: 2px solid var(--border-color);
                    display: flex; align-items: center; justify-content: center;
                }
                
                .profile-image-large img { width: 100%; height: 100%; object-fit: cover; }

                .avatar-placeholder-large {
                    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
                    color: var(--text-muted);
                }

                .profile-name-display { font-size: 1.1rem; font-weight: 600; color: white; margin: 0; }
                .profile-source { font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; }

                .section-title {
                    font-size: 0.8rem; font-weight: 700; color: var(--primary);
                    margin: 0 0 1rem 0; text-transform: uppercase; letter-spacing: 0.5px;
                }

                .info-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .info-group label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }

                .info-display-box {
                    background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: 8px;
                    font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;
                }

                .website-link {
                    display: flex; align-items: center; gap: 6px; color: var(--primary);
                    font-size: 0.85rem; text-decoration: none; margin-top: 4px;
                }
                .website-link:hover { text-decoration: underline; }

                .input-group { margin-bottom: 1rem; }
                .input-group label {
                    display: flex; align-items: center; gap: 6px;
                    font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px;
                }
                
                .input-group input, .input-group textarea, .input-group select {
                    width: 100%; padding: 0.6rem 0.8rem;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    color: white;
                    font-family: inherit; font-size: 0.9rem;
                    transition: border-color 0.2s;
                }
                .input-group select { appearance: none; cursor: pointer; }
                
                .input-group input:focus, .input-group textarea:focus, .input-group select:focus {
                    outline: none; border-color: var(--primary);
                }

                .crm-actions-section {
                    background: rgba(var(--primary-rgb), 0.05);
                    padding: 1rem; border-radius: 8px; border: 1px solid rgba(var(--primary-rgb), 0.1);
                }

                .add-crm-btn {
                    width: 100%; padding: 0.7rem;
                    background: transparent; color: var(--primary);
                    border: 1px dashed var(--primary); border-radius: 6px;
                    font-weight: 600; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: all 0.2s;
                }
                .add-crm-btn:hover { background: var(--primary); color: black; border-style: solid; }

                .crm-form-box { animation: fadeIn 0.3s ease; }
                .crm-form-title { color: white; margin: 0 0 1rem 0; font-size: 0.95rem; }
                
                .crm-form-actions { display: flex; gap: 8px; margin-top: 1rem; }
                .confirm-mini-btn, .cancel-mini-btn {
                    flex: 1; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; cursor: pointer; border: none;
                }
                .confirm-mini-btn { background: var(--primary); color: black; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px; }
                .cancel-mini-btn { background: rgba(255,255,255,0.1); color: white; }
                .cancel-mini-btn:hover { background: rgba(255,255,255,0.2); }

                .save-btn {
                    width: 100%; padding: 0.8rem;
                    background: var(--primary); color: black;
                    border: none; border-radius: 8px; font-weight: 600;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
                    margin-top: 1rem; transition: opacity 0.2s;
                }
                .save-btn:hover { opacity: 0.9; }
                .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            `}
            </style>
        </div>
    );
}
