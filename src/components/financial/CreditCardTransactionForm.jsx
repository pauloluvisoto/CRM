import React, { useState, useEffect } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const CreditCardTransactionForm = ({ isOpen, onClose, selectedCard, onSuccess }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [cards, setCards] = useState([]);
    const [formData, setFormData] = useState({
        cardId: selectedCard?.id || '',
        description: '',
        category: '',
        amount: '',
        transactionDate: new Date().toISOString().split('T')[0],
        installments: '1',
        isRecurring: false,
        recurrenceFrequency: 'monthly',
        recurrenceEndDate: '',
        notes: ''
    });

    useEffect(() => {
        if (user) {
            fetchCards();
        }
    }, [user]);

    useEffect(() => {
        if (selectedCard) {
            setFormData(prev => ({ ...prev, cardId: selectedCard.id }));
        }
    }, [selectedCard]);

    const fetchCards = async () => {
        try {
            const { data, error } = await supabase
                .from('credit_cards')
                .select('*')
                .eq('created_by', user.id)
                .eq('is_active', true)
                .order('card_name');

            if (error) throw error;
            setCards(data || []);
        } catch (error) {
            console.error('Error fetching cards:', error);
        }
    };

    // Reuse categories from AccountForm
    const EXPENSE_CATEGORIES = [
        'Alimentação',
        'Transporte',
        'Saúde',
        'Lazer',
        'Educação',
        'Moradia',
        'Vestuário',
        'Tecnologia',
        'Assinaturas',
        'Outros'
    ];

    const calculateStatementMonth = (transactionDate, closingDay) => {
        const date = new Date(transactionDate);
        const day = date.getDate();

        // If transaction is after closing day, it goes to next month's statement
        if (day > closingDay) {
            date.setMonth(date.getMonth() + 1);
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const selectedCardData = cards.find(c => c.id === formData.cardId);
            if (!selectedCardData) {
                throw new Error('Cartão não encontrado');
            }

            const statementMonth = calculateStatementMonth(
                formData.transactionDate,
                selectedCardData.closing_day
            );

            const totalInstallments = parseInt(formData.installments);
            const amount = parseFloat(formData.amount);
            const installmentAmount = totalInstallments > 1 ? amount / totalInstallments : amount;

            // Create transactions (one for each installment or just one)
            const transactions = [];
            const baseDate = new Date(formData.transactionDate);

            for (let i = 0; i < totalInstallments; i++) {
                const installmentDate = new Date(baseDate);
                installmentDate.setMonth(installmentDate.getMonth() + i);

                const installmentStatementMonth = calculateStatementMonth(
                    installmentDate.toISOString().split('T')[0],
                    selectedCardData.closing_day
                );

                transactions.push({
                    card_id: formData.cardId,
                    description: totalInstallments > 1
                        ? `${formData.description} (${i + 1}/${totalInstallments})`
                        : formData.description,
                    category: formData.category,
                    amount: installmentAmount,
                    transaction_date: installmentDate.toISOString().split('T')[0],
                    total_installments: totalInstallments,
                    current_installment: i + 1,
                    parent_transaction_id: i === 0 ? null : transactions[0]?.id,
                    is_recurring: formData.isRecurring,
                    recurrence_frequency: formData.isRecurring ? formData.recurrenceFrequency : null,
                    recurrence_end_date: formData.isRecurring && formData.recurrenceEndDate ? formData.recurrenceEndDate : null,
                    statement_month: installmentStatementMonth,
                    is_billed: false,
                    notes: formData.notes || null,
                    created_by: user.id
                });
            }

            // Insert first transaction to get ID
            const { data: firstTransaction, error: firstError } = await supabase
                .from('credit_card_transactions')
                .insert([transactions[0]])
                .select()
                .single();

            if (firstError) throw firstError;

            // Update first transaction reference
            transactions[0].id = firstTransaction.id;

            // Process remaining installments
            const createdTransactions = [firstTransaction];

            if (totalInstallments > 1) {
                const remainingTransactions = transactions.slice(1).map(t => ({
                    ...t,
                    parent_transaction_id: firstTransaction.id
                }));

                const { data: remainingData, error: remainingError } = await supabase
                    .from('credit_card_transactions')
                    .insert(remainingTransactions)
                    .select();

                if (remainingError) throw remainingError;
                createdTransactions.push(...(remainingData || []));
            }

            // 🆕 NOW CREATE ACCOUNTS_PAYABLE ENTRIES
            const payableEntries = [];

            for (let i = 0; i < createdTransactions.length; i++) {
                const transaction = createdTransactions[i];
                const statementMonth = transaction.statement_month;

                // Calculate due date: statement_month + due_day
                const [year, month] = statementMonth.split('-');
                const dueDate = new Date(parseInt(year), parseInt(month) - 1, selectedCardData.due_day);

                payableEntries.push({
                    description: transaction.description + ` - ${selectedCardData.card_name}`,
                    category: transaction.category,
                    amount: transaction.amount,
                    due_date: dueDate.toISOString().split('T')[0],
                    payment_method: 'Cartão de Crédito',
                    status: 'pending',
                    created_by: user.id,
                    notes: `Cartão: ${selectedCardData.card_name}\nCompra: ${new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}`,
                    linked_card_id: selectedCardData.id,
                    linked_transaction_id: transaction.id
                });
            }

            // Insert all payable entries
            const { error: payableError } = await supabase
                .from('accounts_payable')
                .insert(payableEntries);

            if (payableError) {
                console.error('Error creating accounts payable:', payableError);
                // Continue anyway, transaction was created
            }

            const installmentText = totalInstallments > 1 ? ` em ${totalInstallments}x` : '';
            alert(`✅ Transação lançada com sucesso${installmentText}!\n\n${totalInstallments} ${totalInstallments > 1 ? 'contas a pagar criadas' : 'conta a pagar criada'}.`);
            onSuccess && onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('❌ Erro ao salvar transação: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            cardId: selectedCard?.id || '',
            description: '',
            category: '',
            amount: '',
            transactionDate: new Date().toISOString().split('T')[0],
            installments: '1',
            isRecurring: false,
            recurrenceFrequency: 'monthly',
            recurrenceEndDate: '',
            notes: ''
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🛍️ Nova Transação no Cartão</h2>
                    <button onClick={handleClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Card Selection */}
                    <div className="form-group">
                        <label>Cartão *</label>
                        <select
                            value={formData.cardId}
                            onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                            required
                            disabled={!!selectedCard}
                        >
                            <option value="">Selecione...</option>
                            {cards.map(card => (
                                <option key={card.id} value={card.id}>
                                    {card.card_name} - {card.card_brand}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label>Descrição *</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ex: Netflix, Mercado, Gasolina"
                            required
                            maxLength={255}
                        />
                    </div>

                    {/* Category & Amount */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Categoria *</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            >
                                <option value="">Selecione...</option>
                                {EXPENSE_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Valor (R$) *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    {/* Transaction Date & Installments */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Data da Compra *</label>
                            <input
                                type="date"
                                value={formData.transactionDate}
                                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Parcelas</label>
                            <select
                                value={formData.installments}
                                onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                            >
                                <option value="1">À vista (1x)</option>
                                {Array.from({ length: 12 }, (_, i) => i + 2).map(num => (
                                    <option key={num} value={num}>{num}x sem juros</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Recurring Payment */}
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.isRecurring}
                                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                            />
                            <span>Cobrança Recorrente (Ex: Assinaturas)</span>
                        </label>
                    </div>

                    {formData.isRecurring && (
                        <div className="form-row">
                            <div className="form-group">
                                <label>Frequência</label>
                                <select
                                    value={formData.recurrenceFrequency}
                                    onChange={(e) => setFormData({ ...formData, recurrenceFrequency: e.target.value })}
                                >
                                    <option value="monthly">Mensal</option>
                                    <option value="yearly">Anual</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Data Final (Opcional)</label>
                                <input
                                    type="date"
                                    value={formData.recurrenceEndDate}
                                    onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                                    min={formData.transactionDate}
                                />
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="form-group">
                        <label>Observações</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Informações adicionais..."
                            rows={2}
                        />
                    </div>

                    {/* Preview */}
                    {formData.amount && formData.installments && parseInt(formData.installments) > 1 && (
                        <div className="installment-preview">
                            <strong>Resumo:</strong> {formData.installments}x de R$ {(parseFloat(formData.amount) / parseInt(formData.installments)).toFixed(2)}
                        </div>
                    )}

                    {/* Submit Actions */}
                    <div className="form-actions">
                        <button type="button" onClick={handleClose} className="btn-cancel">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="btn-submit">
                            {loading ? 'Lançando...' : 'Lançar Transação'}
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
                        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.5rem;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    }

                    .modal-header h2 {
                        font-size: 1.25rem;
                        color: var(--text-primary);
                        margin: 0;
                        font-weight: 700;
                    }

                    .close-btn {
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        border-radius: 8px;
                        color: var(--text-secondary);
                        cursor: pointer;
                        padding: 0.5rem;
                        transition: all 0.2s;
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

                    .checkbox-label {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        cursor: pointer;
                        padding: 0.75rem;
                        background: rgba(255, 255, 255, 0.02);
                        border-radius: 8px;
                        transition: all 0.2s;
                    }

                    .checkbox-label:hover {
                        background: rgba(255, 255, 255, 0.05);
                    }

                    .checkbox-label input[type="checkbox"] {
                        width: auto;
                        cursor: pointer;
                    }

                    .installment-preview {
                        padding: 1rem;
                        background: linear-gradient(135deg, rgba(190, 242, 100, 0.1) 0%, rgba(190, 242, 100, 0.05) 100%);
                        border: 1px solid rgba(190, 242, 100, 0.2);
                        border-radius: 8px;
                        color: #bef264;
                        font-size: 0.9rem;
                        margin-bottom: 1rem;
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
                    }

                    .btn-submit {
                        background: linear-gradient(135deg, #bef264 0%, #a3e635 100%);
                        color: #050a07;
                    }

                    .btn-submit:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(190, 242, 100, 0.3);
                    }

                    .btn-submit:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
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

export default CreditCardTransactionForm;
