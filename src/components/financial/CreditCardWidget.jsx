import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, TrendingUp, AlertTriangle, ArrowRight, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

const CreditCardWidget = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [cards, setCards] = useState([]);
    const [upcomingPayments, setUpcomingPayments] = useState([]);
    const [totalUsage, setTotalUsage] = useState(0);
    const [totalLimit, setTotalLimit] = useState(0);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            // Fetch cards
            const { data: cardsData, error: cardsError } = await supabase
                .from('credit_cards')
                .select('*')
                .eq('created_by', user.id)
                .eq('is_active', true);

            if (cardsError) throw cardsError;

            setCards(cardsData || []);

            // Calculate totals
            const limit = (cardsData || []).reduce((sum, card) => sum + parseFloat(card.credit_limit), 0);
            setTotalLimit(limit);

            // Fetch upcoming card payments (next 30 days from accounts_payable)
            const today = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(today.getDate() + 30);

            const { data: paymentsData, error: paymentsError } = await supabase
                .from('accounts_payable')
                .select('*, credit_cards!linked_card_id(card_name, color)')
                .not('linked_card_id', 'is', null)
                .eq('status', 'pending')
                .gte('due_date', today.toISOString().split('T')[0])
                .lte('due_date', thirtyDaysFromNow.toISOString().split('T')[0])
                .order('due_date', { ascending: true })
                .limit(5);

            // Fetch OVERDUE payments
            const { data: overdueData, error: overdueError } = await supabase
                .from('accounts_payable')
                .select('*, credit_cards!linked_card_id(card_name, color)')
                .not('linked_card_id', 'is', null)
                .eq('status', 'pending')
                .lt('due_date', today.toISOString().split('T')[0])
                .order('due_date', { ascending: true });

            if (!paymentsError && !overdueError) {
                const overdue = overdueData || [];
                const upcoming = paymentsData || [];

                // Combine: Overdue first, then upcoming
                setUpcomingPayments([...overdue, ...upcoming]);

                // Calculate total usage from pending payments (including overdue)
                const allPayments = [...overdue, ...upcoming];
                const usage = allPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
                setTotalUsage(usage);
            }

        } catch (error) {
            console.error('Error fetching credit card data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const getDaysUnknown = (dateString) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dateString);
        due.setHours(0, 0, 0, 0);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const usagePercent = totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0;
    const isHighUsage = usagePercent > 80;

    if (loading) {
        return <div className="widget-loading">Carregando cartões...</div>;
    }

    if (cards.length === 0) {
        return (
            <div className="credit-card-widget empty">
                <div className="widget-header">
                    <div className="header-title">
                        <CreditCard size={20} />
                        <h3>Cartões de Crédito</h3>
                    </div>
                </div>
                <div className="empty-state">
                    <p>Nenhum cartão cadastrado</p>
                    <button onClick={() => navigate('/finance?tab=cards')} className="btn-add">
                        Adicionar Cartão
                    </button>
                </div>

                <style>{widgetStyles}</style>
            </div>
        );
    }

    return (
        <div className="credit-card-widget">
            <div className="widget-header">
                <div className="header-title">
                    <CreditCard size={20} />
                    <h3>Cartões de Crédito</h3>
                </div>
                <button onClick={() => navigate('/finance?tab=cards')} className="view-all-btn">
                    Ver tudo
                    <ArrowRight size={16} />
                </button>
            </div>

            {/* Summary */}
            <div className="summary-section">
                <div className="summary-card">
                    <span className="label">Total em Uso</span>
                    <span className="value">{formatCurrency(totalUsage)}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Limite Total</span>
                    <span className="value">{formatCurrency(totalLimit)}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Cartões Ativos</span>
                    <span className="value">{cards.length}</span>
                </div>
            </div>

            {/* Usage Bar */}
            <div className="usage-section">
                <div className="usage-header">
                    <span className="usage-label">Uso Total</span>
                    <span className="usage-percent">{usagePercent.toFixed(1)}%</span>
                </div>
                <div className="usage-bar-container">
                    <div
                        className={`usage-bar ${isHighUsage ? 'high' : ''}`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                </div>
                {isHighUsage && (
                    <div className="usage-alert">
                        <AlertTriangle size={14} />
                        <span>Uso acima de 80%</span>
                    </div>
                )}
            </div>

            {/* Upcoming Payments */}
            {upcomingPayments.length > 0 && (
                <div className="payments-section">
                    <h4>
                        <Calendar size={16} />
                        Próximos Vencimentos
                    </h4>
                    <div className="payments-list">
                        {upcomingPayments.slice(0, 5).map(payment => { // Increased limit
                            const daysUntil = getDaysUnknown(payment.due_date);
                            const isOverdue = daysUntil < 0;
                            const isDueSoon = daysUntil >= 0 && daysUntil <= 3;

                            return (
                                <div key={payment.id} className="payment-item" style={{
                                    borderColor: isOverdue ? 'rgba(239, 68, 68, 0.4)' : isDueSoon ? 'rgba(234, 179, 8, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                                    background: isOverdue ? 'rgba(239, 68, 68, 0.1)' : isDueSoon ? 'rgba(234, 179, 8, 0.1)' : 'rgba(255, 255, 255, 0.02)'
                                }}>
                                    <div
                                        className="payment-dot"
                                        style={{
                                            backgroundColor: payment.credit_cards?.color || '#6366f1',
                                            boxShadow: isOverdue ? '0 0 8px rgba(239,68,68,0.5)' : 'none'
                                        }}
                                    />
                                    <div className="payment-info">
                                        <span className="payment-desc">
                                            {payment.description}
                                            {isOverdue && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginLeft: '6px', fontWeight: 'bold' }}>VENCIDO</span>}
                                            {isDueSoon && !isOverdue && <span style={{ color: '#eab308', fontSize: '0.7rem', marginLeft: '6px', fontWeight: 'bold' }}>VENCE EM {daysUntil === 0 ? 'HOJE' : `${daysUntil}D`}</span>}
                                        </span>
                                        <span className="payment-date" style={{ color: isOverdue ? '#fca5a5' : 'var(--text-muted)' }}>
                                            {formatDate(payment.due_date)}
                                        </span>
                                    </div>
                                    <span className="payment-amount" style={{ color: isOverdue ? '#ef4444' : 'var(--text-primary)' }}>
                                        {formatCurrency(payment.amount)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    {upcomingPayments.length > 3 && (
                        <div className="more-payments">
                            +{upcomingPayments.length - 3} mais
                        </div>
                    )}
                </div>
            )}

            <style>{widgetStyles}</style>
        </div>
    );
};

const widgetStyles = `
    .credit-card-widget {
        background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.8) 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.5rem;
        backdrop-filter: blur(10px);
    }

    .credit-card-widget.empty {
        text-align: center;
    }

    .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .header-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: var(--text-primary);
    }

    .header-title h3 {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0;
    }

    .view-all-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(99, 102, 241, 0.2);
        border: 1px solid rgba(99, 102, 241, 0.3);
        color: #818cf8;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 600;
        transition: all 0.2s;
    }

    .view-all-btn:hover {
        background: rgba(99, 102, 241, 0.3);
        transform: translateX(2px);
    }

    .summary-section {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .summary-card {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
    }

    .summary-card .label {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .summary-card .value {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .usage-section {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
    }

    .usage-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }

    .usage-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        font-weight: 600;
    }

    .usage-percent {
        font-size: 0.875rem;
        color: var(--text-primary);
        font-weight: 700;
    }

    .usage-bar-container {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
    }

    .usage-bar {
        height: 100%;
        background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    .usage-bar.high {
        background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
    }

    .usage-alert {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.75rem;
        padding: 0.5rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 6px;
        color: #ef4444;
        font-size: 0.8rem;
        font-weight: 600;
    }

    .payments-section {
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .payments-section h4 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin: 0 0 1rem 0;
    }

    .payments-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .payment-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        transition: all 0.2s;
    }

    .payment-item:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .payment-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .payment-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;
    }

    .payment-desc {
        font-size: 0.85rem;
        color: var(--text-primary);
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .payment-date {
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .payment-amount {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--text-primary);
        flex-shrink: 0;
    }

    .more-payments {
        margin-top: 0.5rem;
        text-align: center;
        font-size: 0.8rem;
        color: var(--text-muted);
        font-style: italic;
    }

    .empty-state {
        padding: 2rem 1rem;
        text-align: center;
    }

    .empty-state p {
        color: var(--text-muted);
        margin-bottom: 1rem;
    }

    .btn-add {
        background: linear-gradient(135deg, #bef264 0%, #a3e635 100%);
        color: #050a07;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-add:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(190, 242, 100, 0.3);
    }

    .widget-loading {
        padding: 2rem;
        text-align: center;
        color: var(--text-muted);
    }

    @media (max-width: 768px) {
        .summary-section {
            grid-template-columns: 1fr;
        }
    }
`;

export default CreditCardWidget;
