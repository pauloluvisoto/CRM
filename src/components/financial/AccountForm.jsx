import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const AccountForm = ({ isOpen, onClose, type, onSuccess, editData = null }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        category: '',
        amount: '',
        dueDate: '',
        paymentMethod: '',
        notes: '',
        dealId: null
    });

    // Populate form when editing
    useEffect(() => {
        if (editData) {
            setFormData({
                description: editData.description || '',
                category: editData.category || '',
                amount: editData.amount || '',
                dueDate: editData.due_date || '',
                paymentMethod: editData.payment_method || '',
                notes: editData.notes || '',
                dealId: editData.deal_id || null
            });
        }
    }, [editData]);

    // Categories from user's spreadsheet
    const RECEIVABLE_CATEGORIES = [
        'Receita Fixa - Mensalidade',
        'Receita Variável - Comissão sobre Vendas Recuperadas'
    ];

    const PAYABLE_CATEGORIES = [
        // Custo das Vendas
        'Custos Gerais',
        'Taxas de Checkout',
        'Servidor',
        'API Oficial Whatsapp',
        'Tokens GPT',
        'Telefone',
        'Custos de Pessoal (Mão de Obra Direta)',
        // Folha de Pagamento
        'Pró Labore - CEO',
        'Pró Labore - Operacional',
        'Auxiliar de Serviços Gerais',
        'Desenvolvedor',
        'Gestor de Tráfego',
        'Designer / Editor de Vídeo',
        'Vendedores',
        'Customer Success',
        // Despesas Fixas
        'CRM',
        'Internet / Telefonia',
        'Contabilidade',
        'Condomínio',
        'Energia Elétrica',
        'Aluguel',
        'Google Workspace',
        'Notion',
        'Treinamentos Udemy',
        'Jurídico',
        // Despesas Variáveis
        'Pagamento Multiplo Diego AM Engenharia',
        'Anúncios Online',
        'Dívida inadimplente',
        'Amortização do Ativo Circulante'
    ];

    const categories = type === 'receivable' ? RECEIVABLE_CATEGORIES : PAYABLE_CATEGORIES;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const tableName = type === 'receivable' ? 'accounts_receivable' : 'accounts_payable';

            const payload = {
                description: formData.description,
                category: formData.category,
                amount: parseFloat(formData.amount),
                due_date: formData.dueDate,
                payment_method: formData.paymentMethod || null,
                notes: formData.notes || null
            };

            // Add deal_id only for receivables
            if (type === 'receivable' && formData.dealId) {
                payload.deal_id = formData.dealId;
            }

            // Add created_by only on create
            if (!editData) {
                payload.created_by = user.id;
            }

            let result;
            if (editData) {
                // UPDATE
                result = await supabase
                    .from(tableName)
                    .update(payload)
                    .eq('id', editData.id)
                    .select();
            } else {
                // INSERT
                result = await supabase
                    .from(tableName)
                    .insert([payload])
                    .select();
            }

            const { data, error } = result;
            if (error) throw error;

            alert(`✅ ${type === 'receivable' ? 'Conta a Receber' : 'Conta a Pagar'} ${editData ? 'atualizada' : 'cadastrada'} com sucesso!`);
            onSuccess && onSuccess(data[0]);
            handleClose();

        } catch (error) {
            console.error('Error saving account:', error);
            alert('❌ Erro ao salvar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            description: '',
            category: '',
            amount: '',
            dueDate: '',
            paymentMethod: '',
            notes: '',
            dealId: null
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        {editData
                            ? (type === 'receivable' ? '✏️ Editar Conta a Receber' : '✏️ Editar Conta a Pagar')
                            : (type === 'receivable' ? '📈 Nova Conta a Receber' : '📉 Nova Conta a Pagar')
                        }
                    </h2>
                    <button onClick={handleClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Description */}
                    <div className="form-group">
                        <label>Descrição *</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={type === 'receivable' ? 'Ex: Cliente XYZ - Janeiro 2026' : 'Ex: Google Workspace - Janeiro'}
                            required
                        />
                    </div>

                    {/* Category */}
                    <div className="form-group">
                        <label>Categoria *</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            required
                        >
                            <option value="">Selecione...</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Amount & Due Date */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Valor (R$) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0,00"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Data de Vencimento *</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="form-group">
                        <label>Forma de Pagamento</label>
                        <select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        >
                            <option value="">Selecione...</option>
                            <option value="pix">PIX</option>
                            <option value="transfer">Transferência</option>
                            <option value="card">Cartão</option>
                            <option value="cash">Dinheiro</option>
                            <option value="boleto">Boleto</option>
                        </select>
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                        <label>Observações</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Informações adicionais..."
                            rows={3}
                        />
                    </div>

                    {/* Attachment Upload (Placeholder) */}
                    <div className="form-group">
                        <label>Anexo (Comprovante) - Em breve</label>
                        <div className="upload-placeholder">
                            <Upload size={20} />
                            <span>Upload de arquivos será implementado em breve</span>
                        </div>
                    </div>

                    {/* Submit */}
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

                    .upload-placeholder {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        padding: 1rem;
                        background-color: rgba(255, 255, 255, 0.02);
                        border: 1px dashed rgba(255, 255, 255, 0.1);
                        border-radius: 8px;
                        color: var(--text-muted);
                        font-size: 0.875rem;
                        transition: all 0.2s;
                    }
                    
                    .upload-placeholder:hover {
                        border-color: rgba(255, 255, 255, 0.2);
                        background-color: rgba(255, 255, 255, 0.04);
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

export default AccountForm;
