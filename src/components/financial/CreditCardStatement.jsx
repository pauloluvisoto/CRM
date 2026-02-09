import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, CheckCircle, AlertCircle, CreditCard, ArrowRight, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
};

const CATEGORY_COLORS = {
    'Alimentação': '#f59e0b', // Amber
    'Transporte': '#3b82f6', // Blue
    'Saúde': '#ef4444', // Red
    'Educação': '#8b5cf6', // Violet
    'Lazer': '#ec4899', // Pink
    'Compras': '#10b981', // Emerald
    'Assinaturas': '#6366f1', // Indigo
    'Viagens': '#06b6d4', // Cyan
    'Tecnologia': '#84cc16', // Lime
    'Outros': '#9ca3af' // Gray
};

const CategoryChart = ({ transactions }) => {
    if (!transactions.length) return null;

    // 1. Group by category
    const categoryTotals = transactions.reduce((acc, t) => {
        const cat = t.category || 'Outros';
        acc[cat] = (acc[cat] || 0) + parseFloat(t.amount);
        return acc;
    }, {});

    // 2. Convert to array and sort
    const totalAmount = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const data = Object.entries(categoryTotals)
        .map(([name, value]) => ({
            name,
            value,
            percent: (value / totalAmount) * 100,
            color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Outros']
        }))
        .sort((a, b) => b.value - a.value);

    // 3. Calculate SVG paths (Donut segments)
    let cumulativePercent = 0;
    const size = 120; // Reduced size
    const strokeWidth = 16;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    const segments = data.map((item, index) => {
        const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
        const strokeDashoffset = -1 * (cumulativePercent / 100) * circumference;
        cumulativePercent += item.percent;

        return (
            <circle
                key={item.name}
                r={radius}
                cx={center}
                cy={center}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'all 0.3s ease' }}
                transform={`rotate(-90 ${center} ${center})`}
            />
        );
    });

    return (
        <div className="category-chart-section">
            <div className="chart-container">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {segments}
                    {/* Inner text */}
                    <text x="50%" y="45%" textAnchor="middle" dy="0.3em" fill="white" fontSize="1rem" fontWeight="bold">
                        {data.length}
                    </text>
                    <text x="50%" y="45%" textAnchor="middle" dy="1.4em" fill="#a1a1aa" fontSize="0.6rem">
                        Cats
                    </text>
                </svg>
            </div>
            <div className="chart-legend">
                {data.map(item => (
                    <div key={item.name} className="legend-item">
                        <div className="legend-indicator" style={{ backgroundColor: item.color }} />
                        <div className="legend-info">
                            <span className="legend-name">{item.name}</span>
                            <span className="legend-percent">{item.percent.toFixed(1)}%</span>
                        </div>
                        <span className="legend-value">{formatCurrency(item.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CreditCardStatement = ({ card, statementMonth, onClose, onInvoiceClosed }) => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [closing, setClosing] = useState(false);
    const [showChart, setShowChart] = useState(false); // Collapsed by default

    useEffect(() => {
        if (card && statementMonth) {
            fetchTransactions();
        }
    }, [card, statementMonth]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('credit_card_transactions')
                .select('*')
                .eq('card_id', card.id)
                .eq('statement_month', statementMonth)
                .order('transaction_date', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            alert('❌ Erro ao buscar transações: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        return transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    };

    const handleCloseInvoice = async () => {
        if (!window.confirm(
            `Tem certeza que deseja fechar a fatura de ${formatStatementMonth()}?\n\n` +
            `Valor total: ${formatCurrency(calculateTotal())}\n\n` +
            `Isso criará uma conta a pagar com vencimento no dia ${card.due_day}.`
        )) {
            return;
        }

        try {
            setClosing(true);

            const total = calculateTotal();
            const [year, month] = statementMonth.split('-');

            // Calculate due date
            const dueDate = new Date(parseInt(year), parseInt(month) - 1, card.due_day);

            // If due day already passed this month, set to next month
            const now = new Date();
            if (dueDate < now) {
                dueDate.setMonth(dueDate.getMonth() + 1);
            }

            // Create accounts_payable entry
            const { data: payableData, error: payableError } = await supabase
                .from('accounts_payable')
                .insert([{
                    description: `Fatura ${card.card_name} - ${formatStatementMonth()}`,
                    category: 'Cartão de Crédito',
                    amount: total,
                    due_date: dueDate.toISOString().split('T')[0],
                    payment_method: 'Débito Automático',
                    status: 'pending',
                    created_by: user.id,
                    notes: `Fatura fechada automaticamente. ${transactions.length} transações.`
                }])
                .select();

            if (payableError) throw payableError;

            // Mark all transactions as billed
            const transactionIds = transactions.map(t => t.id);
            const { error: updateError } = await supabase
                .from('credit_card_transactions')
                .update({ is_billed: true })
                .in('id', transactionIds);

            if (updateError) throw updateError;

            alert(`✅ Fatura fechada com sucesso!\n\nCriada conta a pagar de ${formatCurrency(total)} com vencimento em ${formatDate(dueDate.toISOString())}`);

            onInvoiceClosed && onInvoiceClosed();
            onClose();
        } catch (error) {
            console.error('Error closing invoice:', error);
            alert('❌ Erro ao fechar fatura: ' + error.message);
        } finally {
            setClosing(false);
        }
    };

    const formatStatementMonth = () => {
        if (!statementMonth) return '';
        const [year, month] = statementMonth.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${monthNames[parseInt(month) - 1]}/${year}`;
    };

    const getCategoryIcon = (category) => {
        const icons = {
            'Alimentação': '🍽️',
            'Transporte': '🚗',
            'Saúde': '🏥',
            'Educação': '📚',
            'Lazer': '🎮',
            'Compras': '🛍️',
            'Assinaturas': '📱',
            'Viagens': '✈️',
            'Tecnologia': '💻',
            'Outros': '📦'
        };
        return icons[category] || '💳';
    };

    if (!card) return null;

    const total = calculateTotal();
    const isBilled = transactions.length > 0 && transactions.every(t => t.is_billed);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content statement-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="header-info">
                        <div className="card-icon" style={{ color: card.color }}>
                            <CreditCard size={28} />
                        </div>
                        <div>
                            <h2>Fatura {card.card_name}</h2>
                            <p className="statement-period">{formatStatementMonth()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>

                {/* Summary */}
                <div className="statement-summary">
                    <div className="summary-card total">
                        <span className="label">Valor Total</span>
                        <span className="value">{formatCurrency(total)}</span>
                    </div>
                    <div className="summary-card">
                        <span className="label">Vencimento</span>
                        <span className="value">Dia {card.due_day}</span>
                    </div>
                    <div className="summary-card">
                        <span className="label">Transações</span>
                        <span className="value">{transactions.length}</span>
                    </div>
                    {isBilled && (
                        <div className="summary-card billed">
                            <CheckCircle size={20} />
                            <span className="label">Fatura Fechada</span>
                        </div>
                    )}
                </div>

                {/* Categories Chart Toggle */}
                {transactions.length > 0 && (
                    <div className="chart-toggle-section">
                        <button
                            className={`btn-toggle-chart ${showChart ? 'active' : ''}`}
                            onClick={() => setShowChart(!showChart)}
                        >
                            <div className="toggle-content">
                                <span className="toggle-label">Análise de Gastos</span>
                                <span className="toggle-sub">
                                    {showChart ? 'Ocultar gráfico' : 'Ver distribuição por categoria'}
                                </span>
                            </div>
                            {showChart ? <TrendingUp size={18} color="#bef264" /> : <TrendingUp size={18} />}
                        </button>

                        {showChart && (
                            <div className="chart-wrapper slide-down">
                                <CategoryChart transactions={transactions} />
                            </div>
                        )}
                    </div>
                )}

                {/* Transactions List */}
                <div className="transactions-section">
                    <h3>Transações</h3>
                    {loading ? (
                        <div className="loading-state">Carregando transações...</div>
                    ) : transactions.length === 0 ? (
                        <div className="empty-state">
                            <AlertCircle size={32} />
                            <p>Nenhuma transação neste período</p>
                        </div>
                    ) : (
                        <div className="transactions-list">
                            {transactions.map(transaction => (
                                <div key={transaction.id} className="transaction-item">
                                    <div className="transaction-icon">
                                        {getCategoryIcon(transaction.category)}
                                    </div>
                                    <div className="transaction-info">
                                        <h4>{transaction.description}</h4>
                                        <div className="transaction-meta">
                                            <span className="category">{transaction.category}</span>
                                            <span className="date">{formatDate(transaction.transaction_date)}</span>
                                            {transaction.total_installments > 1 && (
                                                <span className="installment">
                                                    {transaction.current_installment}/{transaction.total_installments}
                                                </span>
                                            )}
                                            {transaction.is_recurring && (
                                                <span className="recurring">🔄 Recorrente</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="transaction-amount">
                                        {formatCurrency(transaction.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                {!isBilled && transactions.length > 0 && (
                    <div className="statement-actions">
                        <button onClick={onClose} className="btn-cancel">
                            Voltar
                        </button>
                        <button
                            onClick={handleCloseInvoice}
                            disabled={closing}
                            className="btn-close-invoice"
                        >
                            {closing ? 'Fechando...' : (
                                <>
                                    Fechar Fatura
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                )}

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

                    .statement-modal {
                        background: linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(10, 10, 20, 0.98) 100%);
                        border-radius: 16px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        max-width: 700px;
                        width: 100%;
                        max-height: 90vh;
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.5rem;
                        background: linear-gradient(to right, rgba(255, 255, 255, 0.03), transparent);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    }

                    .header-info {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                    }

                    .card-icon {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .modal-header h2 {
                        font-size: 1.25rem;
                        color: var(--text-primary);
                        margin: 0;
                        font-weight: 700;
                    }

                    .statement-period {
                        font-size: 0.9rem;
                        color: var(--text-muted);
                        margin: 0.25rem 0 0 0;
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
                    }

                    .close-btn:hover {
                        background: rgba(255, 255, 255, 0.1);
                        color: var(--text-primary);
                    }

                    .statement-summary {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 1rem;
                        padding: 1.5rem;
                        background: rgba(0, 0, 0, 0.2);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    }

                    .summary-card {
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        border-radius: 12px;
                    }

                    .summary-card.total {
                        background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%);
                        border-color: rgba(251, 191, 36, 0.2);
                    }

                    .summary-card.billed {
                        flex-direction: row;
                        align-items: center;
                        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%);
                        border-color: rgba(16, 185, 129, 0.2);
                        color: #10b981;
                    }

                    .summary-card .label {
                        font-size: 0.75rem;
                        color: var(--text-muted);
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .summary-card .value {
                        font-size: 1.25rem;
                        font-weight: 700;
                        color: var(--text-primary);
                    }

                    .summary-card.total .value {
                        color: #fbbf24;
                        font-size: 1.5rem;
                    }

                    .summary-card.total .value {
                        color: #fbbf24;
                        font-size: 1.5rem;
                    }

                    .summary-card.total .value {
                        color: #fbbf24;
                        font-size: 1.5rem;
                    }

                    .chart-toggle-section {
                        padding: 0 1.5rem;
                        margin-bottom: 1rem;
                    }

                    .btn-toggle-chart {
                        width: 100%;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        padding: 0.75rem 1rem;
                        border-radius: 12px;
                        cursor: pointer;
                        color: var(--text-secondary);
                        transition: all 0.2s;
                        text-align: left;
                    }

                    .btn-toggle-chart:hover {
                        background: rgba(255, 255, 255, 0.05);
                        color: var(--text-primary);
                    }

                    .btn-toggle-chart.active {
                        background: rgba(190, 242, 100, 0.05);
                        border-color: rgba(190, 242, 100, 0.2);
                        color: #bef264;
                    }

                    .toggle-content {
                        display: flex;
                        flex-direction: column;
                    }

                    .toggle-label {
                        font-size: 0.9rem;
                        font-weight: 600;
                    }

                    .toggle-sub {
                        font-size: 0.75rem;
                        opacity: 0.7;
                    }

                    .chart-wrapper {
                        margin-top: 1rem;
                        border-radius: 12px;
                        overflow: hidden;
                        animation: slideDown 0.3s ease-out;
                    }

                    @keyframes slideDown {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    .category-chart-section {
                        display: flex;
                        gap: 1.5rem;
                        padding: 1rem;
                        background: rgba(0, 0, 0, 0.2);
                        align-items: center;
                        border-radius: 12px;
                    }

                    .chart-container {
                        flex-shrink: 0;
                        position: relative;
                        padding: 0.5rem;
                        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
                    }

                    .chart-legend {
                        flex: 1;
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                        gap: 0.75rem;
                        max-height: 180px;
                        overflow-y: auto;
                        padding-right: 0.5rem;
                    }

                    .legend-item {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-size: 0.8rem;
                        padding: 0.4rem;
                        background: rgba(255, 255, 255, 0.02);
                        border-radius: 6px;
                    }

                    .legend-indicator {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        flex-shrink: 0;
                        box-shadow: 0 0 5px currentColor;
                    }

                    .legend-info {
                        display: flex;
                        flex-direction: column;
                        flex: 1;
                        min-width: 0;
                    }

                    .legend-name {
                        color: var(--text-primary);
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        font-weight: 500;
                    }

                    .legend-percent {
                        color: var(--text-muted);
                        font-size: 0.7rem;
                    }

                    .legend-value {
                        color: var(--text-primary);
                        font-weight: 600;
                        font-size: 0.75rem;
                    }

                    .transactions-section {
                        flex: 1;
                        overflow-y: auto;
                        padding: 1.5rem;
                    }

                    .transactions-section h3 {
                        font-size: 1rem;
                        color: var(--text-primary);
                        margin: 0 0 1rem 0;
                        font-weight: 600;
                    }

                    .transactions-list {
                        display: flex;
                        flex-direction: column;
                        gap: 0.75rem;
                    }

                    .transaction-item {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        border-radius: 12px;
                        transition: all 0.2s;
                    }

                    .transaction-item:hover {
                        background: rgba(255, 255, 255, 0.05);
                        border-color: rgba(255, 255, 255, 0.1);
                    }

                    .transaction-icon {
                        font-size: 1.5rem;
                        flex-shrink: 0;
                    }

                    .transaction-info {
                        flex: 1;
                        min-width: 0;
                    }

                    .transaction-info h4 {
                        font-size: 0.95rem;
                        color: var(--text-primary);
                        margin: 0 0 0.25rem 0;
                        font-weight: 600;
                    }

                    .transaction-meta {
                        display: flex;
                        gap: 0.75rem;
                        flex-wrap: wrap;
                        font-size: 0.75rem;
                    }

                    .transaction-meta span {
                        color: var(--text-muted);
                    }

                    .transaction-meta .installment,
                    .transaction-meta .recurring {
                        background: rgba(99, 102, 241, 0.2);
                        color: #818cf8;
                        padding: 0.15rem 0.5rem;
                        border-radius: 4px;
                        font-weight: 500;
                    }

                    .transaction-amount {
                        font-size: 1rem;
                        font-weight: 700;
                        color: var(--text-primary);
                        flex-shrink: 0;
                    }

                    .loading-state,
                    .empty-state {
                        text-align: center;
                        padding: 3rem 1rem;
                        color: var(--text-muted);
                    }

                    .empty-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 1rem;
                    }

                    .statement-actions {
                        display: flex;
                        gap: 1rem;
                        padding: 1.5rem;
                        border-top: 1px solid rgba(255, 255, 255, 0.05);
                        background: rgba(0, 0, 0, 0.2);
                    }

                    .btn-cancel,
                    .btn-close-invoice {
                        flex: 1;
                        padding: 0.875rem 1.5rem;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 0.9rem;
                        cursor: pointer;
                        transition: all 0.2s;
                        border: none;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                    }

                    .btn-cancel {
                        background: transparent;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        color: var(--text-secondary);
                    }

                    .btn-cancel:hover {
                        background: rgba(255, 255, 255, 0.05);
                        color: var(--text-primary);
                    }

                    .btn-close-invoice {
                        background: linear-gradient(135deg, #bef264 0%, #a3e635 100%);
                        color: #050a07;
                    }

                    .btn-close-invoice:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(190, 242, 100, 0.3);
                    }

                    .btn-close-invoice:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    @media (max-width: 640px) {
                        .statement-summary {
                            grid-template-columns: 1fr;
                        }

                        .statement-actions {
                            flex-direction: column;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default CreditCardStatement;
