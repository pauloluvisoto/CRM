import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit2, Trash2, TrendingUp, AlertCircle, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import CreditCardForm from './CreditCardForm';
import CreditCardTransactionForm from './CreditCardTransactionForm';
import CreditCardStatement from './CreditCardStatement';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

const CreditCardList = ({ onSelectCard }) => {
    const { user } = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [cardUsage, setCardUsage] = useState({});
    const [currentInvoice, setCurrentInvoice] = useState({});
    const [cardAlerts, setCardAlerts] = useState({}); // { cardId: 'danger' | 'warning' | null }
    const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
    const [selectedCardForTransaction, setSelectedCardForTransaction] = useState(null);
    const [selectedCardForStatement, setSelectedCardForStatement] = useState(null);
    const [statementMonth, setStatementMonth] = useState(null);

    useEffect(() => {
        if (user) {
            fetchCards();
        }
    }, [user]);

    const fetchCards = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('credit_cards')
                .select('*')
                .eq('created_by', user.id)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setCards(data || []);

            // Fetch usage for each card
            if (data && data.length > 0) {
                await fetchCardUsage(data);
            }
        } catch (error) {
            console.error('Error fetching cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCardUsage = async (cardsList) => {
        try {
            const usage = {};
            const invoices = {};
            const alerts = {};
            const today = new Date().toISOString().split('T')[0];
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(new Date().getDate() + 3);
            const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

            for (const card of cardsList) {
                // Calculate current and next statement months
                const currentStatementMonth = calculateCurrentStatement(card.closing_day);
                const nextStatementMonth = calculateNextStatement(card.closing_day);

                // Get current invoice transactions
                const { data: invoiceData, error: invoiceError } = await supabase
                    .from('credit_card_transactions')
                    .select('amount')
                    .eq('card_id', card.id)
                    .eq('statement_month', currentStatementMonth);

                if (!invoiceError && invoiceData) {
                    const invoiceTotal = invoiceData.reduce((sum, t) => sum + parseFloat(t.amount), 0);
                    invoices[card.id] = invoiceTotal;
                }

                // Get NEXT invoice transactions (only next month, not all unbilled)
                const { data: nextInvoiceData, error: nextInvoiceError } = await supabase
                    .from('credit_card_transactions')
                    .select('amount')
                    .eq('card_id', card.id)
                    .eq('statement_month', nextStatementMonth);

                if (!nextInvoiceError && nextInvoiceData) {
                    const nextTotal = nextInvoiceData.reduce((sum, t) => sum + parseFloat(t.amount), 0);
                    usage[card.id] = nextTotal;
                }

                // Check for ALERTS (Overdue or Due Soon invoices in Accounts Payable)
                const { data: alertData, error: alertError } = await supabase
                    .from('accounts_payable')
                    .select('due_date')
                    .eq('linked_card_id', card.id)
                    .eq('status', 'pending')
                    .lte('due_date', threeDaysStr) // Due today, past, or next 3 days
                    .order('due_date', { ascending: true })
                    .limit(1);

                if (!alertError && alertData && alertData.length > 0) {
                    const dueDate = alertData[0].due_date;
                    if (dueDate < today) {
                        alerts[card.id] = 'danger'; // Overdue
                    } else {
                        alerts[card.id] = 'warning'; // Due soon
                    }
                }
            }

            setCardUsage(usage);
            setCurrentInvoice(invoices);
            setCardAlerts(alerts);
        } catch (error) {
            console.error('Error fetching card usage:', error);
        }
    };

    const calculateCurrentStatement = (closingDay) => {
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // If today is after closing day, statement is for next month
        if (currentDay > closingDay) {
            const nextMonth = new Date(currentYear, currentMonth + 1, 1);
            return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
        } else {
            // Statement is for current month
            return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        }
    };

    const calculateNextStatement = (closingDay) => {
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Next statement is always one month after current statement
        if (currentDay > closingDay) {
            // Current statement is next month, so next is month after that
            const twoMonthsAhead = new Date(currentYear, currentMonth + 2, 1);
            return `${twoMonthsAhead.getFullYear()}-${String(twoMonthsAhead.getMonth() + 1).padStart(2, '0')}`;
        } else {
            // Current statement is this month, so next is next month
            const nextMonth = new Date(currentYear, currentMonth + 1, 1);
            return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
        }
    };

    const handleAddCard = () => {
        setEditingCard(null);
        setIsFormOpen(true);
    };

    const handleEditCard = (card) => {
        setEditingCard(card);
        setIsFormOpen(true);
    };

    const handleDeleteCard = async (card) => {
        if (!window.confirm(`Tem certeza que deseja excluir o cartão "${card.card_name}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('credit_cards')
                .update({ is_active: false })
                .eq('id', card.id);

            if (error) throw error;

            alert('✅ Cartão excluído com sucesso!');
            fetchCards();
        } catch (error) {
            console.error('Error deleting card:', error);
            alert('❌ Erro ao excluir cartão: ' + error.message);
        }
    };

    const handleFormSuccess = () => {
        fetchCards();
    };

    const handleAddTransaction = (card = null) => {
        setSelectedCardForTransaction(card);
        setIsTransactionFormOpen(true);
    };

    const handleTransactionSuccess = () => {
        fetchCards(); // Refresh to update usage
    };

    const handleCardClick = (card) => {
        // Calculate current statement month for this card
        const currentStatement = calculateCurrentStatement(card.closing_day);
        setSelectedCardForStatement(card);
        setStatementMonth(currentStatement);

        // If onSelectCard callback is provided, call it
        if (onSelectCard) {
            onSelectCard(card);
        }
    };

    const calculateAvailable = (card) => {
        const used = cardUsage[card.id] || 0;
        return card.credit_limit - used;
    };

    const calculateUsagePercentage = (card) => {
        const used = cardUsage[card.id] || 0;
        return (used / card.credit_limit) * 100;
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                Carregando cartões...
            </div>
        );
    }

    return (
        <div className="credit-cards-container">
            {/* Header */}
            <div className="cards-header">
                <div>
                    <h2>Cartões de Crédito</h2>
                    <p>Gerencie seus cartões e acompanhe o uso do limite</p>
                </div>
                <div className="header-actions">
                    <button onClick={() => handleAddTransaction()} className="btn-add-transaction">
                        <ShoppingBag size={20} />
                        Nova Compra
                    </button>
                    <button onClick={handleAddCard} className="btn-add-card">
                        <Plus size={20} />
                        Novo Cartão
                    </button>
                </div>
            </div>

            {/* Cards Grid */}
            {cards.length === 0 ? (
                <div className="empty-state">
                    <CreditCard size={48} />
                    <h3>Nenhum cartão cadastrado</h3>
                    <p>Adicione seu primeiro cartão de crédito para começar a gerenciar suas compras</p>
                    <button onClick={handleAddCard} className="btn-add-card-empty">
                        <Plus size={20} />
                        Adicionar Cartão
                    </button>
                </div>
            ) : (
                <div className="cards-grid">
                    {cards.map(card => {
                        const used = cardUsage[card.id] || 0;
                        const available = calculateAvailable(card);
                        const usagePercent = calculateUsagePercentage(card);
                        const isHighUsage = usagePercent > 80;

                        return (
                            <div
                                key={card.id}
                                className="card-item"
                                style={{
                                    '--card-color': card.color,
                                    borderColor: `${card.color}40`
                                }}
                                onClick={() => handleCardClick(card)}
                            >
                                {/* Card Header */}
                                <div className="card-item-header">
                                    <div className="card-brand-info">
                                        <CreditCard size={24} style={{ color: card.color }} />
                                        <div>
                                            <h3>{card.card_name}</h3>
                                            <span className="card-brand">{card.card_brand}</span>
                                            {card.last_four_digits && (
                                                <span className="card-number"> •••• {card.last_four_digits}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleEditCard(card)}
                                            className="icon-btn"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCard(card)}
                                            className="icon-btn danger"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Usage Bar */}
                                <div className="usage-section">
                                    <div className="usage-bar-container">
                                        <div
                                            className={`usage-bar ${isHighUsage ? 'high' : ''}`}
                                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                        />
                                    </div>
                                    <div className="card-spacer" />

                                    {/* Alert Indicator */}
                                    {cardAlerts[card.id] && (
                                        <div className={`card-alert ${cardAlerts[card.id]}`} title={cardAlerts[card.id] === 'danger' ? 'Fatura Vencida!' : 'Fatura Vence em Breve'}>
                                            <AlertCircle size={16} />
                                            <span>{cardAlerts[card.id] === 'danger' ? 'Vencida' : 'Vence logo'}</span>
                                        </div>
                                    )}

                                    <div className="card-chip">
                                        <div className="chip-line"></div>
                                        <div className="chip-line"></div>
                                        <div className="chip-line"></div>
                                    </div>
                                    <div className="usage-stats">
                                        <div className="stat">
                                            <span className="label">Fatura Atual</span>
                                            <span className="value invoice">{formatCurrency(currentInvoice[card.id] || 0)}</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Próxima Fatura</span>
                                            <span className="value">{formatCurrency(used)}</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Disponível</span>
                                            <span className="value available">{formatCurrency(available)}</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Limite</span>
                                            <span className="value">{formatCurrency(card.credit_limit)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Billing Info */}
                                <div className="billing-info">
                                    <div className="billing-item">
                                        <span className="label">Fechamento</span>
                                        <span className="value">Dia {card.closing_day}</span>
                                    </div>
                                    <div className="billing-item">
                                        <span className="label">Vencimento</span>
                                        <span className="value">Dia {card.due_day}</span>
                                    </div>
                                </div>

                                {/* High Usage Alert */}
                                {isHighUsage && (
                                    <div className="usage-alert">
                                        <AlertCircle size={16} />
                                        <span>Atenção: Uso acima de 80% do limite</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Form Modal */}
            <CreditCardForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingCard(null);
                }}
                onSuccess={handleFormSuccess}
                editData={editingCard}
            />

            {/* Transaction Form Modal */}
            <CreditCardTransactionForm
                isOpen={isTransactionFormOpen}
                onClose={() => {
                    setIsTransactionFormOpen(false);
                    setSelectedCardForTransaction(null);
                }}
                selectedCard={selectedCardForTransaction}
                onSuccess={handleTransactionSuccess}
            />

            {/* Statement Modal */}
            {selectedCardForStatement && (
                <CreditCardStatement
                    card={selectedCardForStatement}
                    statementMonth={statementMonth}
                    onClose={() => {
                        setSelectedCardForStatement(null);
                        setStatementMonth(null);
                    }}
                    onInvoiceClosed={() => {
                        fetchCards();
                    }}
                />
            )}

            <style>{`
                .credit-cards-container {
                    padding: 1.5rem;
                }

                .cards-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                    gap: 1rem;
                }

                .header-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .cards-header h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0 0 0.25rem 0;
                }

                .cards-header p {
                    color: var(--text-muted);
                    margin: 0;
                    font-size: 0.9rem;
                }

                .btn-add-transaction {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
                }

                .btn-add-transaction:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
                    filter: brightness(1.1);
                }

                .btn-add-card {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, #bef264 0%, #a3e635 100%);
                    color: #050a07;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(190, 242, 100, 0.2);
                }

                .btn-add-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(190, 242, 100, 0.3);
                    filter: brightness(1.1);
                }

                .cards-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 1.5rem;
                }

                .card-item {
                    background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.8) 100%);
                    border: 1px solid;
                    border-radius: 16px;
                    padding: 1.5rem;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                }

                .card-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, var(--card-color) 0%, transparent 100%);
                }

                .card-item::after {
                    content: 'Click para ver fatura';
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .card-item:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
                    border-color: var(--card-color) !important;
                }

                .card-item:hover::after {
                    opacity: 1;
                }

                .card-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1.5rem;
                }

                .card-brand-info {
                    display: flex;
                    gap: 0.75rem;
                    align-items: flex-start;
                    flex: 1;
                }

                .card-brand-info h3 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0 0 0.25rem 0;
                }

                .card-brand {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }

                .card-number {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-left: 0.5rem;
                }

                .card-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .icon-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 6px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .icon-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                    transform: scale(1.1);
                }

                .icon-btn.danger:hover {
                    background: rgba(239, 68, 68, 0.15);
                    border-color: rgba(239, 68, 68, 0.3);
                    color: #f87171;
                }

                .usage-section {
                    margin-bottom: 1.5rem;
                }

                .usage-bar-container {
                    height: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 1rem;
                }

                .usage-bar {
                    height: 100%;
                    background: linear-gradient(90deg, var(--card-color) 0%, var(--card-color) 100%);
                    border-radius: 4px;
                    transition: width 0.3s ease;
                    box-shadow: 0 0 10px var(--card-color);
                }

                .usage-bar.high {
                    background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
                    box-shadow: 0 0 10px #ef4444;
                }


                .card-spacer {
                    flex: 1;
                }

                .card-alert {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 8px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                    align-self: flex-start;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    backdrop-filter: blur(4px);
                }

                .card-alert.danger {
                    background: rgba(239, 68, 68, 0.9);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    animation: pulse-danger 2s infinite;
                }

                .card-alert.warning {
                    background: rgba(234, 179, 8, 0.9);
                    color: black;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                @keyframes pulse-danger {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }

                .usage-stats {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                }

                .usage-stats .stat {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .usage-stats .label {
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .usage-stats .value {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .usage-stats .value.invoice {
                    color: #f59e0b;
                    font-size: 1rem;
                }

                .usage-stats .value.available {
                    color: #10b981;
                }

                .billing-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .billing-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .billing-item .label {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .billing-item .value {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .usage-alert {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 8px;
                    color: #f87171;
                    font-size: 0.85rem;
                    font-weight: 500;
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: rgba(30, 30, 40, 0.3);
                    border: 1px dashed rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    color: var(--text-muted);
                }

                .empty-state svg {
                    color: var(--text-muted);
                    margin-bottom: 1rem;
                }

                .empty-state h3 {
                    font-size: 1.25rem;
                    color: var(--text-primary);
                    margin: 0 0 0.5rem 0;
                }

                .empty-state p {
                    margin: 0 0 1.5rem 0;
                }

                .btn-add-card-empty {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, #bef264 0%, #a3e635 100%);
                    color: #050a07;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-add-card-empty:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(190, 242, 100, 0.3);
                }

                @media (max-width: 768px) {
                    .cards-header {
                        flex-direction: column;
                    }

                    .header-actions {
                        flex-direction: column;
                        width: 100%;
                    }

                    .cards-grid {
                        grid-template-columns: 1fr;
                    }

                    .btn-add-card,
                    .btn-add-transaction {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default CreditCardList;
