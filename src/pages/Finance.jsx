import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Target, Settings, List, ArrowUpCircle, ArrowDownCircle, ArrowLeft, ArrowRight, CreditCard } from 'lucide-react';
import FinancialDashboard from '../components/dashboard/FinancialDashboard';
import AccountsReceivable from '../components/financial/AccountsReceivable';
import AccountsPayable from '../components/financial/AccountsPayable';
import CreditCardList from '../components/financial/CreditCardList';
import ErrorBoundary from '../components/ErrorBoundary';
import { supabase } from '../lib/supabaseClient';

const formatCurrency = (value) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const Finance = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [accountFilter, setAccountFilter] = useState('all');

    // State for the Transactions tab toggle
    const [transactionType, setTransactionType] = useState('receivable'); // 'receivable' | 'payable'

    // Monthly Metrics State
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
    const [monthlyStats, setMonthlyStats] = useState({
        receivables: 0,
        payables: 0
    });

    const fetchMonthlyStats = async () => {
        try {
            const [year, month] = currentMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];

            // Fetch Monthly Receivables Sum
            const { data: recData } = await supabase
                .from('accounts_receivable')
                .select('amount')
                .gte('due_date', startDate)
                .lte('due_date', endDate);

            const recTotal = recData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

            // Fetch Monthly Payables Sum
            const { data: payData } = await supabase
                .from('accounts_payable')
                .select('amount')
                .gte('due_date', startDate)
                .lte('due_date', endDate);

            const payTotal = payData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

            setMonthlyStats({
                receivables: recTotal,
                payables: payTotal
            });
        } catch (error) {
            console.error('Error fetching monthly stats:', error);
        }
    };

    // Global Metrics State
    const [globalMetrics, setGlobalMetrics] = useState({
        receivables: { total: 0, overdue: 0, count: 0, overdueCount: 0 },
        payables: { total: 0, overdue: 0, count: 0, overdueCount: 0 }
    });

    const fetchGlobalMetrics = async () => {
        try {
            // Fetch Receivables (Pending + Overdue)
            const { data: recData } = await supabase
                .from('accounts_receivable')
                .select('*')
                .neq('status', 'received'); // Get all not received

            const recTotal = recData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
            const recCount = recData?.length || 0;

            const recOverdue = recData?.filter(item => item.status === 'overdue') || [];
            const recOverdueTotal = recOverdue.reduce((sum, item) => sum + Number(item.amount), 0);
            const recOverdueCount = recOverdue.length;

            // Fetch Payables (Pending + Overdue)
            const { data: payData } = await supabase
                .from('accounts_payable')
                .select('*')
                .neq('status', 'paid'); // Get all not paid

            const payTotal = payData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
            const payCount = payData?.length || 0;

            const payOverdue = payData?.filter(item => {
                // Check override status or calculate date
                if (item.status === 'overdue') return true;
                if (item.status === 'pending') {
                    return new Date(item.due_date) < new Date(new Date().setHours(0, 0, 0, 0));
                }
                return false;
            }) || [];

            const payOverdueTotal = payOverdue.reduce((sum, item) => sum + Number(item.amount), 0);
            const payOverdueCount = payOverdue.length;

            setGlobalMetrics({
                receivables: { total: recTotal, count: recCount, overdue: recOverdueTotal, overdueCount: recOverdueCount },
                payables: { total: payTotal, count: payCount, overdue: payOverdueTotal, overdueCount: payOverdueCount }
            });

        } catch (error) {
            console.error('Error fetching global finance metrics:', error);
        }
    };

    // Read URL query params on mount and location change
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tab = searchParams.get('tab');
        const filter = searchParams.get('filter');
        const type = searchParams.get('type'); // New param for transaction type

        if (tab) {
            setActiveTab(tab);
        } else {
            // If no tab param, default to dashboard (fixes sidebar link issue)
            setActiveTab('dashboard');
        }

        if (filter) {
            setAccountFilter(filter);
        }

        if (type && (type === 'receivable' || type === 'payable')) {
            setTransactionType(type);
        }

        // Fetch globals if on transactions tab
        if (tab === 'transactions' || !tab) {
            fetchGlobalMetrics();
        }
    }, [location]); // Update on any location change

    // Fetch Monthly stats when month changes
    useEffect(() => {
        fetchMonthlyStats();
    }, [currentMonth]);

    // Also fetch on mount
    useEffect(() => {
        fetchGlobalMetrics();
    }, []);

    const handleBadgeClick = (type) => {
        // When badge is clicked, navigate to transactions tab with appropriate type and filter
        navigate(`/finance?tab=transactions&type=${type}&filter=overdue`);
    };

    const toggleTransactionType = (type) => {
        setTransactionType(type);
        // Update URL to reflect change without reloading
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('type', type);
        // navigate is safer to update URL
        navigate(`/finance?tab=transactions&type=${type}&filter=${accountFilter}`, { replace: true });
    };

    const handleUpdate = () => {
        fetchGlobalMetrics();
        fetchMonthlyStats();
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <FinancialDashboard stats={{}} trends={{}} onBadgeClick={handleBadgeClick} />;
            case 'transactions':
                return (
                    <div className="transactions-container">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <button
                                onClick={() => navigate('/finance?tab=dashboard')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'none',
                                    border: 'none',
                                    color: '#9ca3af',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    padding: '0'
                                }}
                            >
                                <ArrowLeft size={18} />
                                Voltar ao Dashboard
                            </button>
                        </div>

                        {/* GLOBAL SUMMARY CARDS */}
                        <div className="global-summary-container">
                            {/* Receivables Global */}
                            <div className="global-card receivable">
                                <div className="card-row main">
                                    <div className="label">Total a Receber (Global)</div>
                                    <div className="value">{formatCurrency(globalMetrics.receivables.total)}</div>
                                    <div className="count">{globalMetrics.receivables.count} contas</div>
                                </div>
                                {globalMetrics.receivables.overdue > 0 && (
                                    <div className="card-row overdue">
                                        <div className="label">🔴 Vencidas</div>
                                        <div className="value">{formatCurrency(globalMetrics.receivables.overdue)}</div>
                                        <div className="count">{globalMetrics.receivables.overdueCount} contas</div>
                                    </div>
                                )}
                            </div>

                            {/* Payables Global */}
                            <div className="global-card payable">
                                <div className="card-row main">
                                    <div className="label">Total a Pagar (Global)</div>
                                    <div className="value">{formatCurrency(globalMetrics.payables.total)}</div>
                                    <div className="count">{globalMetrics.payables.count} contas</div>
                                </div>
                                {globalMetrics.payables.overdue > 0 && (
                                    <div className="card-row overdue">
                                        <div className="label">🔴 Vencidas</div>
                                        <div className="value">{formatCurrency(globalMetrics.payables.overdue)}</div>
                                        <div className="count">{globalMetrics.payables.overdueCount} contas</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="type-toggle">
                            <button
                                className={`type-btn receivable ${transactionType === 'receivable' ? 'active' : ''}`}
                                onClick={() => toggleTransactionType('receivable')}
                            >
                                <ArrowUpCircle size={18} />
                                Contas a Receber
                            </button>
                            <button
                                className={`type-btn payable ${transactionType === 'payable' ? 'active' : ''}`}
                                onClick={() => toggleTransactionType('payable')}
                            >
                                <ArrowDownCircle size={18} />
                                Contas a Pagar
                            </button>
                        </div>

                        {transactionType === 'receivable' ? (
                            <AccountsReceivable
                                initialFilter={accountFilter}
                                onUpdate={handleUpdate}
                                selectedMonth={currentMonth}
                                onMonthChange={setCurrentMonth}
                                monthlyStats={monthlyStats}
                            />
                        ) : (
                            <AccountsPayable
                                initialFilter={accountFilter}
                                onUpdate={handleUpdate}
                                selectedMonth={currentMonth}
                                onMonthChange={setCurrentMonth}
                                monthlyStats={monthlyStats}
                            />
                        )}
                    </div>
                );
            case 'cards':
                return (
                    <ErrorBoundary>
                        <CreditCardList />
                    </ErrorBoundary>
                );
            case 'goals':
                return (
                    <div className="placeholder-section">
                        <h2>Metas Financeiras</h2>
                        <p>Em breve: Definição e acompanhamento de metas financeiras</p>
                    </div>
                );
            case 'settings':
                return (
                    <div className="placeholder-section">
                        <h2>Configurações Financeiras</h2>
                        <p>Em breve: Categorias, formas de pagamento, e outras configurações</p>
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <div className="page-container finance-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{ margin: 0 }}>
                    {activeTab === 'transactions' ? 'Lançamentos - Contas a Pagar e Receber' :
                        activeTab === 'cards' ? 'Cartões de Crédito' :
                            'Dashboard Financeiro'}
                </h1>

                <div className="header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {activeTab === 'dashboard' && (
                        <button
                            className="header-btn primary"
                            onClick={() => navigate('/finance?tab=transactions')}
                        >
                            Lançamentos - Contas a Pagar e Receber <ArrowRight size={16} />
                        </button>
                    )}

                    <button
                        className={`header-btn ${activeTab === 'cards' ? 'active' : ''}`}
                        onClick={() => navigate('/finance?tab=cards')}
                        title="Cartões de Crédito"
                    >
                        <CreditCard size={18} />
                        <span>Cartões</span>
                    </button>

                    <button
                        className={`header-btn ${activeTab === 'goals' ? 'active' : ''}`}
                        onClick={() => navigate('/finance?tab=goals')}
                        title="Metas"
                    >
                        <Target size={18} />
                        <span>Metas</span>
                    </button>

                    <button
                        className={`header-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => navigate('/finance?tab=settings')}
                        title="Configurações"
                    >
                        <Settings size={18} />
                        <span>Configurações</span>
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="tab-content">
                <ErrorBoundary>
                    {renderContent()}
                </ErrorBoundary>
            </div>

            <style>{`
                .finance-page {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .header-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    background: rgba(30, 30, 40, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(8px);
                }

                .header-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    color: var(--text-primary);
                }

                .header-btn.active {
                    background: linear-gradient(135deg, rgba(190, 242, 100, 0.15) 0%, rgba(190, 242, 100, 0.05) 100%);
                    color: #bef264;
                    border-color: rgba(190, 242, 100, 0.4);
                    box-shadow: 0 0 15px rgba(190, 242, 100, 0.15);
                }

                .header-btn.primary {
                    background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
                    color: #fff;
                    border: none;
                    font-weight: 600;
                    box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
                }

                .header-btn.primary:hover {
                    filter: brightness(1.1);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(251, 191, 36, 0.4);
                }

                .tab-content {
                    /* minimal padding */
                }

                .transactions-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .global-summary-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 0.5rem;
                }

                /* Global Card styles managed in previous step, kept consistent */
                .global-card {
                    background: linear-gradient(135deg, rgba(30, 30, 40, 0.7) 0%, rgba(20, 20, 30, 0.95) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    backdrop-filter: blur(10px);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                
                .global-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.3);
                }

                .global-card.receivable {
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.05);
                }
                
                .global-card.receivable:hover {
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%);
                    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.15);
                }

                .global-card.payable {
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.05);
                }

                .global-card.payable:hover {
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%);
                    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.15);
                }

                .card-row {
                    display: flex;
                    flex-direction: column;
                }

                .card-row.overdue {
                    padding-top: 1rem;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    margin-top: 0.5rem;
                }

                .card-row .label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    color: var(--text-secondary);
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                    letter-spacing: 0.5px;
                }

                .card-row .value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    letter-spacing: -0.5px;
                }

                .global-card.receivable .value { color: #34d399; text-shadow: 0 0 20px rgba(52, 211, 153, 0.2); }
                .global-card.payable .value { color: #f87171; text-shadow: 0 0 20px rgba(248, 113, 113, 0.2); }

                .card-row .count {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }

                .type-toggle {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                    background: rgba(30, 30, 40, 0.5);
                    padding: 0.5rem;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .type-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    border: 1px solid transparent;
                    background-color: transparent;
                    color: var(--text-secondary);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    flex: 1;
                    justify-content: center;
                    font-size: 0.95rem;
                }

                .type-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .type-btn.receivable.active {
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%);
                    border-color: rgba(16, 185, 129, 0.5);
                    color: #34d399;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
                    text-shadow: 0 0 10px rgba(52, 211, 153, 0.3);
                }

                .type-btn.payable.active {
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%);
                    border-color: rgba(239, 68, 68, 0.5);
                    color: #f87171;
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
                    text-shadow: 0 0 10px rgba(248, 113, 113, 0.3);
                }

                .placeholder-section {
                    background: linear-gradient(135deg, rgba(30, 30, 40, 0.7) 0%, rgba(20, 20, 30, 0.9) 100%);
                    padding: 4rem;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    text-align: center;
                    backdrop-filter: blur(10px);
                }

                .placeholder-section h2 {
                    font-size: 1.75rem;
                    margin-bottom: 0.75rem;
                    color: var(--text-primary);
                    background: linear-gradient(90deg, #fff, #9ca3af);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .placeholder-section p {
                    color: var(--text-secondary);
                    font-size: 1rem;
                }

                @media (max-width: 768px) {
                    .header-actions {
                        flex-wrap: wrap;
                    }

                    .type-toggle {
                        flex-direction: column;
                        gap: 0.5rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Finance;
