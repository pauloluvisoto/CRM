import React, { useEffect, useState } from 'react';
import { X, Mail, Phone, Calendar, Briefcase, Edit2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const ContactDetail = ({ contact, onClose, onUpdate }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({});

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
            setIsEditing(false); // Reset edit mode on new contact open
        }
    }, [contact]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                onUpdate({
                    ...contact,
                    ...data[0],
                    // Keep existing frontend fields if needed, or rely on mapper from parent
                });
            }
            setIsEditing(false);
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
            <div className={`overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}></div>
            <div className={`slide-over ${isVisible ? 'visible' : ''}`}>
                <div className="header">
                    <div className="user-profile-large">
                        <div className="avatar-large">{contact.name.charAt(0)}</div>
                        <div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="name"
                                    className="edit-input-large"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Nome do Contato"
                                />
                            ) : (
                                <h2>{contact.name}</h2>
                            )}
                            <div className="status-badge">Ativo</div>
                        </div>
                    </div>
                    <div className="header-actions">
                        {!isEditing ? (
                            <button className="icon-btn" onClick={() => setIsEditing(true)} title="Editar">
                                <Edit2 size={20} />
                            </button>
                        ) : (
                            <button className="icon-btn primary-icon" onClick={handleSave} disabled={loading} title="Salvar">
                                <Save size={20} />
                            </button>
                        )}
                        <button className="close-btn" onClick={handleClose}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="content">
                    <section className="info-section">
                        <h3>Informações de Contato</h3>

                        <div className="info-row">
                            <Mail size={16} className="icon" />
                            {isEditing ? (
                                <input
                                    type="email"
                                    name="email"
                                    className="edit-input"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                <span>{contact.email}</span>
                            )}
                        </div>
                        <div className="info-row">
                            <Phone size={16} className="icon" />
                            {isEditing ? (
                                <input
                                    type="tel"
                                    name="phone"
                                    className="edit-input"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                <span>{contact.phone}</span>
                            )}
                        </div>
                        <div className="info-row">
                            <Briefcase size={16} className="icon" />
                            {isEditing ? (
                                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                    <input
                                        type="text"
                                        name="role"
                                        className="edit-input"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        placeholder="Cargo"
                                    />
                                    <span style={{ alignSelf: 'center' }}>na</span>
                                    <input
                                        type="text"
                                        name="company"
                                        className="edit-input"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        placeholder="Empresa"
                                    />
                                </div>
                            ) : (
                                <span>{contact.role} na {contact.company}</span>
                            )}
                        </div>
                        <div className="info-row">
                            <Calendar size={16} className="icon" />
                            <span>Último contato: {new Date(contact.lastContact).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </section>

                    <section className="timeline-section">
                        <h3>Histórico</h3>
                        <div className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <p className="timeline-date">Hoje, 14:30</p>
                                <p>Visita a página de preços.</p>
                            </div>
                        </div>
                        <div className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <p className="timeline-date">Ontem, 09:15</p>
                                <p>Email enviado: "Proposta Comercial v2"</p>
                            </div>
                        </div>
                        <div className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <p className="timeline-date">24 Out, 16:00</p>
                                <p>Ligação realizada (Duração: 4m 32s)</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <style>{`
        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          z-index: 40;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .overlay.visible {
          opacity: 1;
          pointer-events: auto;
        }

        .slide-over {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 450px;
          background-color: var(--bg-secondary);
          z-index: 50;
          box-shadow: -5px 0 25px rgba(0, 0, 0, 0.5);
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--border-color);
        }

        .slide-over.visible {
          transform: translateX(0);
        }

        .header {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--bg-secondary);
        }

        .user-profile-large {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
        }

        .header-actions {
            display: flex;
            gap: var(--spacing-sm);
        }

        .icon-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: all 0.2s;
        }

        .icon-btn:hover {
            background-color: var(--bg-hover);
            color: var(--text-primary);
        }

        .primary-icon {
            color: var(--primary);
        }

        .edit-input {
            width: 100%;
            padding: 4px 8px;
            background-color: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            color: var(--text-primary);
            font-size: 0.9rem;
        }
        
        .edit-input-large {
            width: 100%;
            padding: 4px 8px;
            background-color: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            color: var(--text-primary);
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 2px;
        }

        .edit-input:focus, .edit-input-large:focus {
            outline: none;
            border-color: var(--primary);
        }

        .avatar-large {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: var(--bg-hover);
            color: var(--primary);
            font-size: 1.25rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--border-color);
        }

        .header h2 {
            font-size: 1.2rem;
            margin-bottom: 2px;
            color: var(--text-primary);
        }

        .status-badge {
            font-size: 0.75rem;
            background-color: rgba(16, 185, 129, 0.2);
            color: #34d399;
            padding: 2px 8px;
            border-radius: 99px;
            display: inline-block;
        }

        .close-btn {
          color: var(--text-secondary);
          padding: 4px;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .close-btn:hover {
          background-color: var(--bg-hover);
          color: var(--text-primary);
        }

        .content {
            padding: var(--spacing-lg);
            overflow-y: auto;
            flex: 1;
            color: var(--text-primary);
        }

        .info-section {
            margin-bottom: var(--spacing-xl);
            background-color: var(--bg-primary);
            padding: var(--spacing-md);
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }

        h3 {
            font-size: 0.9rem;
            text-transform: uppercase;
            color: var(--text-secondary);
            margin-bottom: var(--spacing-md);
            letter-spacing: 0.05em;
        }

        .info-row {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            padding: 8px 0;
            color: var(--text-primary);
            font-size: 0.95rem;
        }

        .icon {
            color: var(--text-secondary);
        }
        
        .timeline-section {
            position: relative;
        }

        .timeline-item {
            display: flex;
            gap: var(--spacing-md);
            padding-bottom: var(--spacing-lg);
            position: relative;
        }
        
        .timeline-item::before {
             content: '';
             position: absolute;
             left: 7px;
             top: 8px;
             bottom: 0;
             width: 2px;
             background-color: var(--border-color);
        }

        .timeline-item:last-child::before {
            display: none;
        }

        .timeline-dot {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: var(--bg-secondary);
            border: 2px solid var(--primary);
            z-index: 1;
            margin-top: 4px;
        }

        .timeline-date {
            font-size: 0.8rem;
            color: var(--text-secondary);
            margin-bottom: 4px;
        }
        
        .timeline-content p {
             font-size: 0.9rem;
             color: var(--text-primary);
        }

      `}</style>
        </>
    );
};

export default ContactDetail;
