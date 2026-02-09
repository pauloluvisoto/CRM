
import React, { useState } from 'react';
import { X, Save, User, Building, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const NewContactModal = ({ isOpen, onClose, onContactCreated }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        role: '',
        email: '',
        phone: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('contacts')
                .insert([
                    {
                        name: formData.name,
                        company: formData.company,
                        role: formData.role,
                        email: formData.email,
                        phone: formData.phone,
                        user_id: user?.id,
                        last_contact: new Date().toISOString()
                    }
                ])
                .select();

            if (error) throw error;

            if (onContactCreated) {
                const newContact = data[0];
                onContactCreated({
                    ...newContact,
                    lastContact: newContact.last_contact
                });
            }

            // Reset and close
            setFormData({
                name: '',
                company: '',
                role: '',
                email: '',
                phone: ''
            });
            onClose();

        } catch (error) {
            console.error('Error creating contact:', error);
            alert('Erro ao criar contato. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }

                .modal-content {
                    background-color: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    width: 100%;
                    max-width: 500px;
                    padding: 2rem;
                    position: relative;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .close-btn {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    color: var(--text-secondary);
                    padding: 0.5rem;
                    border-radius: 50%;
                    transition: all 0.2s;
                    background: transparent;
                }

                .close-btn:hover {
                    background-color: var(--bg-hover);
                    color: var(--text-primary);
                }

                .modal-header h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    color: var(--text-primary);
                }
                
                .form-group {
                    margin-bottom: 1.25rem;
                }

                .form-label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }

                .form-input {
                    width: 100%;
                    padding: 0.75rem;
                    background-color: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-size: 1rem;
                }

                .form-input:focus {
                    outline: none;
                    border-color: var(--primary);
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 2rem;
                }

                .btn-cancel {
                    padding: 0.75rem 1.5rem;
                    background: transparent;
                    color: var(--text-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    font-weight: 600;
                }
                
                .btn-cancel:hover {
                    background-color: var(--bg-hover);
                    color: var(--text-primary);
                }

                .btn-submit {
                    padding: 0.75rem 1.5rem;
                    background-color: var(--primary);
                    color: var(--primary-text);
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .btn-submit:hover {
                    background-color: var(--primary-hover);
                }
            `}</style>

            <div className="modal-content">
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-header">
                    <h2>Novo Contato</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nome Completo</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder="Ex: João Silva"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Empresa</label>
                        <div style={{ position: 'relative' }}>
                            <Building size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                            <input
                                type="text"
                                name="company"
                                className="form-input"
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder="Ex: Acme Corp"
                                value={formData.company}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Cargo</label>
                        <input
                            type="text"
                            name="role"
                            className="form-input"
                            placeholder="Ex: Gerente de Marketing"
                            value={formData.role}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder="joao@exemplo.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Telefone</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                            <input
                                type="tel"
                                name="phone"
                                className="form-input"
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder="(11) 99999-9999"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Salvando...' : (
                                <>
                                    <Save size={18} /> Salvar Contato
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewContactModal;
