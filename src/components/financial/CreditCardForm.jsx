import React, { useState, useEffect } from 'react';
import { X, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const CreditCardForm = ({ isOpen, onClose, onSuccess, editData = null }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cardName: '',
        cardBrand: '',
        lastFourDigits: '',
        creditLimit: '',
        closingDay: '',
        dueDay: '',
        color: '#6366f1',
        notes: ''
    });

    useEffect(() => {
        if (editData) {
            setFormData({
                cardName: editData.card_name || '',
                cardBrand: editData.card_brand || '',
                lastFourDigits: editData.last_four_digits || '',
                creditLimit: editData.credit_limit || '',
                closingDay: editData.closing_day || '',
                dueDay: editData.due_day || '',
                color: editData.color || '#6366f1',
                notes: editData.notes || ''
            });
        }
    }, [editData]);

    const CARD_BRANDS = [
        'Visa',
        'Mastercard',
        'Elo',
        'American Express',
        'Hipercard',
        'Diners Club',
        'Discover',
        'Outro'
    ];

    const PRESET_COLORS = [
        '#1a1a1a', // Black
        '#e5e7eb', // Platinum
        '#fbbf24', // Gold
        '#d97706', // Rose Gold
        '#6366f1', // Indigo
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#ef4444', // Red
        '#f59e0b', // Amber
        '#10b981', // Emerald
        '#06b6d4', // Cyan
        '#3b82f6'  // Blue
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                card_name: formData.cardName,
                card_brand: formData.cardBrand,
                last_four_digits: formData.lastFourDigits || null,
                credit_limit: parseFloat(formData.creditLimit),
                closing_day: parseInt(formData.closingDay),
                due_day: parseInt(formData.dueDay),
                color: formData.color,
                notes: formData.notes || null
            };

            if (!editData) {
                payload.created_by = user.id;
            }

            let result;
            if (editData) {
                result = await supabase
                    .from('credit_cards')
                    .update(payload)
                    .eq('id', editData.id)
                    .select();
            } else {
                result = await supabase
                    .from('credit_cards')
                    .insert([payload])
                    .select();
            }

            const { data, error } = result;
            if (error) throw error;

            alert(`✅ Cartão ${editData ? 'atualizado' : 'cadastrado'} com sucesso!`);
            onSuccess && onSuccess(data[0]);
            handleClose();
        } catch (error) {
            console.error('Error saving credit card:', error);
            alert('❌ Erro ao salvar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            cardName: '',
            cardBrand: '',
            lastFourDigits: '',
            creditLimit: '',
            closingDay: '',
            dueDay: '',
            color: '#6366f1',
            notes: ''
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        {editData ? '✏️ Editar Cartão de Crédito' : '💳 Novo Cartão de Crédito'}
                    </h2>
                    <button onClick={handleClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Card Name */}
                    <div className="form-group">
                        <label>Nome do Cartão *</label>
                        <input
                            type="text"
                            value={formData.cardName}
                            onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                            placeholder="Ex: Nubank Platinum, Itaú Black"
                            required
                            maxLength={100}
                        />
                    </div>

                    {/* Brand & Last 4 Digits */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Bandeira *</label>
                            <select
                                value={formData.cardBrand}
                                onChange={(e) => setFormData({ ...formData, cardBrand: e.target.value })}
                                required
                            >
                                <option value="">Selecione...</option>
                                {CARD_BRANDS.map(brand => (
                                    <option key={brand} value={brand}>{brand}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Últimos 4 Dígitos</label>
                            <input
                                type="text"
                                value={formData.lastFourDigits}
                                onChange={(e) => setFormData({ ...formData, lastFourDigits: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                placeholder="1234"
                                maxLength={4}
                                pattern="[0-9]{4}"
                            />
                        </div>
                    </div>

                    {/* Credit Limit */}
                    <div className="form-group">
                        <label>Limite de Crédito (R$) *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.creditLimit}
                            onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                            placeholder="5000.00"
                            required
                        />
                    </div>

                    {/* Closing & Due Day */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Dia de Fechamento *</label>
                            <select
                                value={formData.closingDay}
                                onChange={(e) => setFormData({ ...formData, closingDay: e.target.value })}
                                required
                            >
                                <option value="">Selecione...</option>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                            <small>Dia em que a fatura fecha</small>
                        </div>
                        <div className="form-group">
                            <label>Dia de Vencimento *</label>
                            <select
                                value={formData.dueDay}
                                onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                                required
                            >
                                <option value="">Selecione...</option>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                            <small>Dia do vencimento da fatura</small>
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div className="form-group">
                        <label>Cor do Cartão</label>
                        <div className="color-picker-container">
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`color-option ${formData.color === color ? 'selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setFormData({ ...formData, color })}
                                    title={color}
                                />
                            ))}
                            <input
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                className="color-input"
                                title="Escolher cor personalizada"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                        <label>Observações</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Informações adicionais sobre o cartão..."
                            rows={3}
                        />
                    </div>

                    {/* Submit Actions */}
                    <div className="form-actions">
                        <button type="button" onClick={handleClose} className="btn-cancel">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="btn-submit">
                            {loading ? (editData ? 'Salvando...' : 'Cadastrando...') : (editData ? 'Salvar' : 'Cadastrar')}
                        </button>
                    </div>
                </form>

                <style>{`
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(4px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        padding: 1rem;
                    }

                    .modal-content {
                        background: linear-gradient(135deg, var(--bg-secondary) 0%, #000000 100%);
                        border-radius: 16px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        max-width: 600px;
                        width: 100%;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.5rem;
                        background: linear-gradient(to right, rgba(255, 255, 255, 0.03), transparent);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    }

                    .modal-header h2 {
                        font-size: 1.25rem;
                        color: var(--text-primary);
                        margin: 0;
                        font-weight: 700;
                        letter-spacing: -0.02em;
                    }

                    .close-btn {
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        border-radius: 8px;
                        color: var(--text-secondary);
                        cursor: pointer;
                        padding: 0.5rem;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .close-btn:hover {
                        background: rgba(255, 255, 255, 0.1);
                        color: var(--text-primary);
                    }

                    .modal-form {
                        padding: 1.5rem;
                    }

                    .form-group {
                        margin-bottom: 1.25rem;
                    }

                    .form-group label {
                        display: block;
                        margin-bottom: 0.5rem;
                        font-size: 0.85rem;
                        font-weight: 500;
                        color: var(--text-secondary);
                    }

                    .form-group small {
                        display: block;
                        margin-top: 0.25rem;
                        font-size: 0.75rem;
                        color: var(--text-muted);
                    }

                    .form-group input,
                    .form-group select,
                    .form-group textarea {
                        width: 100%;
                        padding: 0.75rem 1rem;
                        background-color: rgba(0, 0, 0, 0.3);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 8px;
                        color: var(--text-primary);
                        font-size: 0.9rem;
                        transition: all 0.2s;
                    }

                    .form-group input:focus,
                    .form-group select:focus,
                    .form-group textarea:focus {
                        outline: none;
                        border-color: #bef264;
                        box-shadow: 0 0 0 3px rgba(190, 242, 100, 0.1);
                        background-color: rgba(0, 0, 0, 0.5);
                    }

                    .form-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                    }

                    .color-picker-container {
                        display: flex;
                        gap: 0.5rem;
                        align-items: center;
                        flex-wrap: wrap;
                    }

                    .color-option {
                        width: 40px;
                        height: 40px;
                        border-radius: 8px;
                        border: 2px solid transparent;
                        cursor: pointer;
                        transition: all 0.2s;
                        position: relative;
                    }

                    .color-option:hover {
                        transform: scale(1.1);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    }

                    .color-option.selected {
                        border-color: #bef264;
                        box-shadow: 0 0 0 3px rgba(190, 242, 100, 0.2);
                        transform: scale(1.15);
                    }

                    .color-input {
                        width: 40px;
                        height: 40px;
                        border-radius: 8px;
                        border: 2px solid rgba(255, 255, 255, 0.2);
                        cursor: pointer;
                        padding: 0;
                    }

                    .form-actions {
                        display: flex;
                        gap: 1rem;
                        justify-content: flex-end;
                        margin-top: 2rem;
                        padding-top: 1.5rem;
                        border-top: 1px solid rgba(255, 255, 255, 0.05);
                    }

                    .btn-cancel,
                    .btn-submit {
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 0.9rem;
                        cursor: pointer;
                        transition: all 0.2s;
                        border: none;
                    }

                    .btn-cancel {
                        background-color: transparent;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        color: var(--text-secondary);
                    }

                    .btn-cancel:hover {
                        background-color: rgba(255, 255, 255, 0.05);
                        color: var(--text-primary);
                        border-color: rgba(255, 255, 255, 0.2);
                    }

                    .btn-submit {
                        background: linear-gradient(135deg, #bef264 0%, #a3e635 100%);
                        color: #050a07;
                        border: 1px solid transparent;
                    }

                    .btn-submit:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(190, 242, 100, 0.3);
                        filter: brightness(1.1);
                    }

                    .btn-submit:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                        filter: grayscale(1);
                    }

                    @media (max-width: 640px) {
                        .form-row {
                            grid-template-columns: 1fr;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default CreditCardForm;
