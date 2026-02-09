import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Building2,
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Users,
    History,
    FileText,
    Trash2,
    Camera,
    ShieldAlert,
    Instagram
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import './ClientDetails.css';

const ClientDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Estado Local de Edição
    const [isEditing, setIsEditing] = useState(false);
    const users = ['Você']; // Mocked users list
    const [activeHistoryTab, setActiveHistoryTab] = useState('client'); // 'client', 'internal', or 'social'
    const [socialMessages, setSocialMessages] = useState([]);

    // Image Upload Ref
    const fileInputRef = useRef(null);

    // Supabase Integration
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState(null);
    const [error, setError] = useState(null);
    const { user } = useAuth(); // Assuming useAuth provides current user info

    useEffect(() => {
        fetchClientData();
    }, [id]);

    const fetchClientData = async () => {
        try {
            setLoading(true);
            // Fetch CLient
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();

            if (clientError) throw clientError;

            // Fetch History (Mocked for now as table structure might vary, but shows intent)
            // In real app: const { data: history } = await supabase.from('client_history').select('*').eq('client_id', id);

            // Fetch Contacts (if in separate table) or parse from JSONB
            // For this demo, we assume contacts are stored in client JSON column or we keep mocking strictly for the UI parts not yet backed by DB

            // Merging DB data with UI structure
            setClient({
                ...clientData,
                // Map snake_case to camelCase
                companyName: clientData.company_name || clientData.companyName || '',
                contactName: clientData.contact_name || clientData.contactName || '',
                // Ensure UI fields exist even if DB is null
                contacts: clientData.contacts || [],
                history: clientData.history || [],
                internalHistory: clientData.internal_history || [],
                // Default fallbacks for UI demo if columns missing in initial schema
                since: new Date(clientData.created_at).toLocaleDateString('pt-BR'),
                responsible: clientData.responsible || 'Você',
                address: clientData.address || '',
                notes: clientData.notes || '',
                image: clientData.image_url || null
            });

            // Fetch Social Messages (Instagram)
            try {
                const { data: convData } = await supabase
                    .from('social_conversations')
                    .select('id')
                    .eq('contact_id', id)
                    .maybeSingle();

                if (convData) {
                    const { data: messages } = await supabase
                        .from('social_messages')
                        .select('*')
                        .eq('conversation_id', convData.id)
                        .order('created_at', { ascending: false });

                    setSocialMessages(messages || []);
                }
            } catch (socialErr) {
                console.warn('Could not fetch social messages:', socialErr);
            }
        } catch (error) {
            console.error('Error fetching client:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="p-8 text-white flex flex-col items-center justify-center h-full">
                <ShieldAlert size={48} className="text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Erro ao carregar cliente</h2>
                <p className="text-zinc-400 mb-4">{error}</p>
                <button onClick={() => navigate('/clients')} className="bg-zinc-800 px-4 py-2 rounded hover:bg-zinc-700">
                    Voltar para lista
                </button>
            </div>
        );
    }

    const handleSave = async () => {
        try {
            setIsEditing(false);

            // Optimistic UI Update for internal history
            const newLog = {
                date: new Date().toLocaleDateString(),
                user: 'Você', // Replace with user.email or name
                action: 'Edição de Perfil',
                text: 'Dados do cliente atualizados manualmente.'
            };

            const updatedInternalHistory = [newLog, ...(client.internalHistory || [])];

            // Update Supabase
            const { error } = await supabase
                .from('clients')
                .update({
                    company_name: client.companyName,
                    cnpj: client.cnpj,
                    industry: client.industry,
                    responsible: client.responsible,
                    address: client.address,
                    notes: client.notes,
                    image_url: client.image,
                    contacts: client.contacts, // process JSONB
                    internal_history: updatedInternalHistory // process JSONB
                })
                .eq('id', id);

            if (error) throw error;

            setClient(prev => ({ ...prev, internalHistory: updatedInternalHistory }));
            alert('Alterações salvas com sucesso!');

        } catch (error) {
            console.error('Error saving client:', error);
            alert('Erro ao salvar alterações.');
        }
    };

    const handleInputChange = (field, value) => {
        setClient(prev => ({ ...prev, [field]: value }));
    };

    const handleContactChange = (id, field, value) => {
        setClient(prev => ({
            ...prev,
            contacts: prev.contacts.map(c => c.id === id ? { ...c, [field]: value } : c)
        }));
    };

    const addContact = () => {
        const newContact = {
            id: Date.now(),
            name: 'Novo Contato',
            role: 'Cargo',
            email: '',
            phone: ''
        };
        setClient(prev => ({ ...prev, contacts: [...prev.contacts, newContact] }));
    };

    const removeContact = (id) => {
        if (confirm('Remover este contato?')) {
            setClient(prev => ({ ...prev, contacts: prev.contacts.filter(c => c.id !== id) }));
        }
    };

    // Image Upload Handlers
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);

            const newLog = {
                date: new Date().toLocaleDateString(),
                user: 'Você',
                action: 'Upload de Foto',
                text: 'Nova foto de perfil atualizada.'
            };

            setClient(prev => ({
                ...prev,
                image: imageUrl,
                internalHistory: [newLog, ...prev.internalHistory]
            }));
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    if (loading) {
        return <div className="p-8 text-white">Carregando detalhes do cliente...</div>;
    }

    if (!client) {
        return <div className="p-8 text-white">Cliente não encontrado.</div>;
    }

    return (
        <div className="client-details-page">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageUpload}
            />

            {/* Header / Back */}
            <button
                onClick={() => navigate(-1)}
                className="back-btn"
                style={{ position: 'relative', zIndex: 10 }}
            >
                <ArrowLeft size={20} /> Voltar
            </button>

            {/* Profile Header */}
            <div className="profile-header">
                <div className="header-bg-icon">
                    <Building2 size={200} />
                </div>

                <div className="header-content">
                    <div className="company-avatar-container">
                        {client.image ? (
                            <img
                                src={client.image}
                                alt={client.companyName}
                                className="company-avatar-large"
                                style={{ objectFit: 'cover', width: '96px', height: '96px', borderRadius: '50%', border: '2px solid rgba(190, 242, 100, 0.3)' }}
                            />
                        ) : (
                            <div className="company-avatar-large">
                                {client.companyName.substring(0, 2).toUpperCase()}
                            </div>
                        )}

                        {isEditing && (
                            <div className="avatar-edit-overlay" onClick={triggerFileInput}>
                                <Camera size={24} />
                            </div>
                        )}
                    </div>

                    <div className="header-details">
                        <div className="header-top-row">
                            <div style={{ flex: 1 }}>
                                {isEditing ? (
                                    <input
                                        className="edit-input-large"
                                        value={client.companyName}
                                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                                    />
                                ) : (
                                    <h1 className="company-title">{client.companyName}</h1>
                                )}

                                <div className="meta-row">
                                    <span className="meta-item">
                                        <FileText size={14} />
                                        {isEditing ? (
                                            <input
                                                className="edit-input"
                                                style={{ width: '140px' }}
                                                value={client.cnpj}
                                                onChange={(e) => handleInputChange('cnpj', e.target.value)}
                                            />
                                        ) : client.cnpj}
                                    </span>
                                    <span className="status-badge">
                                        ● {client.status}
                                    </span>
                                </div>
                            </div>

                            <div className="edit-mode-actions">
                                {isEditing ? (
                                    <>
                                        <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancelar</button>
                                        <button className="save-btn" onClick={handleSave}>Salvar Alterações</button>
                                    </>
                                ) : (
                                    <button className="edit-btn" onClick={() => setIsEditing(true)}>
                                        Editar Perfil
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="kpi-grid">
                            <div className="kpi-item">
                                <span className="kpi-label">Segmento</span>
                                {isEditing ? (
                                    <input
                                        className="edit-input"
                                        value={client.industry}
                                        onChange={(e) => handleInputChange('industry', e.target.value)}
                                    />
                                ) : (
                                    <span className="kpi-value">{client.industry || 'Não informado'}</span>
                                )}
                            </div>
                            <div className="kpi-item">
                                <span className="kpi-label">Cliente Desde</span>
                                <span className="kpi-value">{client.since}</span>
                            </div>
                            <div className="kpi-item">
                                <span className="kpi-label">Total de Contatos</span>
                                <span className="kpi-value">{client.contacts?.length || 0} {client.contacts?.length === 1 ? 'contato' : 'contatos'}</span>
                            </div>
                            <div className="kpi-item">
                                <span className="kpi-label">Responsável</span>
                                {isEditing ? (
                                    <select
                                        className="edit-select"
                                        value={client.responsible}
                                        onChange={(e) => handleInputChange('responsible', e.target.value)}
                                    >
                                        {users.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                ) : (
                                    <div className="user-tag">
                                        <div className="user-avatar-small">{client.responsible.charAt(0)}</div>
                                        <span>{client.responsible}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-layout">
                {/* Contacts Column */}
                <div className="detail-section">
                    <h2 className="section-header">
                        <Users className="section-icon" size={20} /> Contatos
                    </h2>
                    <div className="cards-container">
                        {client.contacts.map((contact) => (
                            <div key={contact.id} className="contact-card">
                                <div className="contact-header">
                                    {isEditing ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                            <input
                                                className="edit-input"
                                                placeholder="Nome"
                                                value={contact.name}
                                                onChange={(e) => handleContactChange(contact.id, 'name', e.target.value)}
                                            />
                                            <input
                                                className="edit-input"
                                                placeholder="Cargo"
                                                value={contact.role}
                                                style={{ fontSize: '0.8rem' }}
                                                onChange={(e) => handleContactChange(contact.id, 'role', e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="contact-name">{contact.name}</h3>
                                            <span className="contact-role">{contact.role}</span>
                                        </>
                                    )}

                                    {isEditing && (
                                        <button className="remove-contact-btn" onClick={() => removeContact(contact.id)}>
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className="contact-info-row">
                                    <Mail size={14} className="section-icon" />
                                    {isEditing ? (
                                        <input
                                            className="edit-input"
                                            placeholder="E-mail"
                                            value={contact.email}
                                            onChange={(e) => handleContactChange(contact.id, 'email', e.target.value)}
                                        />
                                    ) : contact.email}
                                </div>
                                <div className="contact-info-row">
                                    <Phone size={14} className="section-icon" />
                                    {isEditing ? (
                                        <input
                                            className="edit-input"
                                            placeholder="Telefone"
                                            value={contact.phone}
                                            onChange={(e) => handleContactChange(contact.id, 'phone', e.target.value)}
                                        />
                                    ) : contact.phone}
                                </div>
                            </div>
                        ))}

                        {isEditing && (
                            <button className="add-btn" onClick={addContact}>
                                + Adicionar Contato
                            </button>
                        )}
                    </div>
                </div>

                {/* Info / Address Column */}
                <div className="detail-section">
                    <h2 className="section-header">
                        <MapPin className="section-icon" size={20} /> Endereço & Dados
                    </h2>
                    <div className="info-box">
                        <div className="info-group">
                            <h4>Endereço Principal</h4>
                            {isEditing ? (
                                <textarea
                                    className="edit-textarea"
                                    value={client.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                />
                            ) : (
                                <p className="info-text" style={{ whiteSpace: 'pre-line' }}>{client.address}</p>
                            )}
                        </div>
                        <div className="info-divider"></div>
                        <div className="info-group">
                            <h4>Observações</h4>
                            {isEditing ? (
                                <textarea
                                    className="edit-textarea"
                                    value={client.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                />
                            ) : (
                                <p className="info-text" style={{ fontStyle: 'italic' }}>{client.notes}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* History Column */}
                <div className="detail-section">
                    <h2 className="section-header">
                        <History className="section-icon" size={20} /> Histórico
                    </h2>

                    <div className="timeline-container">
                        <div className="history-tabs">
                            <button
                                className={`history-tab-btn ${activeHistoryTab === 'client' ? 'active' : ''}`}
                                onClick={() => setActiveHistoryTab('client')}
                            >
                                Atividades do Cliente
                            </button>
                            <button
                                className={`history-tab-btn ${activeHistoryTab === 'internal' ? 'active' : ''}`}
                                onClick={() => setActiveHistoryTab('internal')}
                            >
                                Auditoria Interna
                            </button>
                            <button
                                className={`history-tab-btn ${activeHistoryTab === 'social' ? 'active' : ''}`}
                                onClick={() => setActiveHistoryTab('social')}
                            >
                                <Instagram size={14} style={{ display: 'inline', marginRight: 4 }} /> Instagram
                            </button>
                        </div>

                        <div className="timeline-list">
                            <div className="timeline-line"></div>

                            {activeHistoryTab === 'client' ? (
                                client.history.map((item, i) => (
                                    <div key={i} className="timeline-item">
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content" style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className="timeline-title" style={{ color: '#fff', fontWeight: 600 }}>{item.title}</span>
                                                <span className="timeline-date">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                                <p className="timeline-desc" style={{ margin: 0 }}>{item.type}</p>
                                                <span className="timeline-user" style={{ fontSize: '0.75rem', color: '#71717a' }}>{item.user}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : activeHistoryTab === 'social' ? (
                                socialMessages.length > 0 ? (
                                    socialMessages.map((msg, i) => (
                                        <div key={i} className={`timeline-item ${msg.direction}`}>
                                            <div className="timeline-dot" style={{ borderColor: msg.direction === 'inbound' ? '#bef264' : '#3b82f6' }}></div>
                                            <div className="timeline-content" style={{
                                                flex: 1,
                                                background: msg.direction === 'outbound' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                                borderRadius: '8px',
                                                padding: '8px'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span className="timeline-title" style={{ color: '#fff', fontSize: '0.85rem' }}>
                                                        {msg.direction === 'inbound' ? 'Recebida' : 'Enviada'}
                                                    </span>
                                                    <span className="timeline-date">{new Date(msg.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                                                </div>
                                                <p className="timeline-desc" style={{ marginTop: '4px', color: '#d4d4d8' }}>
                                                    {msg.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#71717a' }}>
                                        Nenhuma conversa do Instagram vinculada a este cliente.
                                    </div>
                                )
                            ) : (
                                client.internalHistory.map((item, i) => (
                                    <div key={i} className="timeline-item">
                                        <div className="timeline-dot" style={{ borderColor: '#ef4444' }}></div>
                                        <div className="timeline-content" style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className="timeline-title" style={{ color: '#fff', fontWeight: 600 }}>{item.title}</span>
                                                <span className="timeline-date">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <p className="timeline-desc" style={{ marginTop: '4px', color: '#a1a1aa' }}>
                                                {item.details || item.text}
                                            </p>
                                            <span className="audit-user" style={{ fontSize: '0.75rem', color: '#ef4444' }}>Por: {item.user}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ClientDetails;
