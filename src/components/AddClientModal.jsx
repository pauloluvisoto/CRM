import React, { useState } from 'react';
import { X, User, Building2, Phone, Mail, Calendar, Check } from 'lucide-react';
import './AddClientModal.css';

const AddClientModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        startDate: new Date().toISOString().split('T')[0]
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
        // Reset form
        setFormData({
            companyName: '',
            contactName: '',
            email: '',
            phone: '',
            startDate: new Date().toISOString().split('T')[0]
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Novo Cliente</h2>
                    <button onClick={onClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label><Building2 size={16} /> Nome da Empresa</label>
                        <input
                            required
                            placeholder="Ex: ACME Ltda"
                            value={formData.companyName}
                            onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label><User size={16} /> Contato Principal</label>
                        <input
                            required
                            placeholder="Ex: João Silva"
                            value={formData.contactName}
                            onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label><Mail size={16} /> E-mail</label>
                            <input
                                type="email"
                                placeholder="joao@acme.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label><Phone size={16} /> Telefone</label>
                            <input
                                placeholder="(11) 99999-9999"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label><Calendar size={16} /> Data de Início</label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
                        <button type="submit" className="btn-save">
                            <Check size={18} /> Cadastrar Cliente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddClientModal;
