import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import NewTransactionModal from './NewTransactionModal';

const FinanceDashboard = () => {
    const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0 });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('expense');
    const [currentGoal, setCurrentGoal] = useState(null);

    useEffect(() => {
        fetchFinanceData();
        fetchCurrentGoal();
    }, []);

    const handleOpenModal = (type) => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleTransactionCreated = () => {
        fetchFinanceData(); // Refresh dashboard data
    };

    const fetchCurrentGoal = async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        try {
            const { data, error } = await supabase
                .from('financial_goals')
                .select('*')
                .eq('year', year)
                .eq('month', month)
                .single();

            if (!error && data) {
                setCurrentGoal(data);
            }
        } catch (err) {
            console.log('No goal set for current month');
        }
    };

    const fetchFinanceData = async () => {
        try {
            // Fetch Transactions
            const { data: txs, error } = await supabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setTransactions(txs || []);

            // Calculate Summary for CURRENT MONTH only
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            const { data: monthTxs } = await supabase
                .from('transactions')
                .select('amount, type, status')
                .gte('due_date', startOfMonth.toISOString().split('T')[0])
                .lte('due_date', endOfMonth.toISOString().split('T')[0]);

            if (monthTxs) {
                let inc = 0, exp = 0;
                monthTxs.forEach(t => {
                    if (t.status === 'paid') {
                        if (t.type === 'income') inc += t.amount;
                        if (t.type === 'expense') exp += t.amount;
                    }
                });
                setSummary({
                    balance: inc - exp,
                    income: inc,
                    expense: exp
                });
            }

        } catch (err) {
            console.error('Error fetching finance:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const calculateAchievement = (actual, target) => {
        if (!target || target === 0) return null;
        return ((actual / target) * 100).toFixed(1);
    };

    return (
        <div className="finance-container">
            <div className="finance-header">
                <div>
                    <h1 className="page-title">Financeiro</h1>
                    <p className="page-subtitle">Fluxo de Caixa e Conciliação</p>
                </div>
                <div className="header-actions">
                    <Link to="/finance/goals" className="btn-action goals">
                        📊 Metas
                    </Link>
                    <Link to="/finance/settings" className="btn-action settings">
                        Configurações
                    </Link>
                    <button className="btn-action expense" onClick={() => handleOpenModal('expense')}>
                        <ArrowDownLeft size={16} /> Nova Despesa
                    </button>
                    <button className="btn-action income" onClick={() => handleOpenModal('income')}>
                        <ArrowUpRight size={16} /> Nova Receita
                    </button>
                </div>
            </div>

            <NewTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleTransactionCreated}
                initialType={modalType}
            />

            {/* KPI Cards with Goals */}
            <div className="kpi-grid">
                <div className="kpi-card balance">
                    <div className="kpi-icon"><Wallet size={24} /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Saldo Atual (Mês)</span>
                        <span className="kpi-value">{formatCurrency(summary.balance)}</span>
                        {currentGoal && currentGoal.target_net_profit > 0 && (
                            <span className="goal-badge">
                                Meta: {formatCurrency(currentGoal.target_net_profit)}
                                <span className={`achievement ${summary.balance >= currentGoal.target_net_profit ? 'positive' : 'negative'}`}>
                                    ({calculateAchievement(summary.balance, currentGoal.target_net_profit)}%)
                                </span>
                            </span>
                        )}
                    </div>
                </div>
                <div className="kpi-card income">
                    <div className="kpi-icon"><TrendingUp size={24} /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Receitas (Mês)</span>
                        <span className="kpi-value">{formatCurrency(summary.income)}</span>
                        {currentGoal && currentGoal.target_revenue > 0 && (
                            <span className="goal-badge">
                                Meta: {formatCurrency(currentGoal.target_revenue)}
                                <span className={`achievement ${summary.income >= currentGoal.target_revenue ? 'positive' : 'negative'}`}>
                                    ({calculateAchievement(summary.income, currentGoal.target_revenue)}%)
                                </span>
                            </span>
                        )}
                    </div>
                </div>
                <div className="kpi-card expense">
                    <div className="kpi-icon"><TrendingDown size={24} /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Despesas (Mês)</span>
                        <span className="kpi-value">{formatCurrency(summary.expense)}</span>
                        {currentGoal && currentGoal.target_opex > 0 && (
                            <span className="goal-badge">
                                Meta: {formatCurrency(currentGoal.target_opex)}
                                <span className={`achievement ${summary.expense <= currentGoal.target_opex ? 'positive' : 'negative'}`}>
                                    ({calculateAchievement(summary.expense, currentGoal.target_opex)}%)
                                </span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="transactions-section">
                <div className="section-header">
                    <h2>Últimas Transações</h2>
                    <Link to="/finance/transactions" className="view-all">Ver Todas</Link>
                </div>

                <div className="transactions-list">
                    {loading ? <p>Carregando...</p> : transactions.length === 0 ? (
                        <p className="empty-state">Nenhuma transação registrada.</p>
                    ) : (
                        transactions.map(t => (
                            <div key={t.id} className="transaction-row">
                                <div className={`tx-icon ${t.type}`}>
                                    {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                </div>
                                <div className="tx-details">
                                    <span className="tx-desc">{t.description}</span>
                                    <span className="tx-meta">{new Date(t.created_at).toLocaleDateString()} • {t.status}</span>
                                </div>
                                <span className={`tx-amount ${t.type}`}>
                                    {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
                .finance-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
                .finance-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 2rem;
                }
                .page-title { font-size: 1.8rem; font-weight: 700; color: var(--text-primary); }
                .page-subtitle { color: var(--text-secondary); margin-top: 4px; }
                
                .header-actions { display: flex; gap: 1rem; }
                .btn-action {
                    display: flex; align-items: center; gap: 8px;
                    padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer;
                    transition: transform 0.1s;
                }
                .btn-action:active { transform: scale(0.98); }
                .btn-action.income { background: var(--primary); color: black; }
                .btn-action.expense { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
                .btn-action.settings { background: var(--bg-hover); color: var(--text-primary); text-decoration: none; border: 1px solid var(--border-color); }
                .btn-action.goals { background: rgba(99, 102, 241, 0.2); color: #818cf8; text-decoration: none; border: 1px solid rgba(99, 102, 241, 0.3); }

                .kpi-grid {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem; margin-bottom: 3rem;
                }
                .kpi-card {
                    background: var(--bg-secondary); border: 1px solid var(--border-color);
                    padding: 1.5rem; border-radius: 12px;
                    display: flex; align-items: center; gap: 1.5rem;
                }
                .kpi-icon {
                    width: 50px; height: 50px; border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                }
                .balance .kpi-icon { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
                .income .kpi-icon { background: rgba(132, 204, 22, 0.1); color: #84cc16; }
                .expense .kpi-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

                .kpi-info { display: flex; flex-direction: column; }
                .kpi-label { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 4px; }
                .kpi-value { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
                
                .goal-badge { 
                    margin-top: 8px; 
                    font-size: 0.75rem; 
                    color: var(--text-secondary); 
                    display: flex; 
                    gap: 6px; 
                    align-items: center; 
                }
                .achievement { 
                    font-weight: 600; 
                    padding: 2px 6px; 
                    border-radius: 4px; 
                }
                .achievement.positive { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
                .achievement.negative { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

                .transactions-section {
                    background: var(--bg-secondary); border: 1px solid var(--border-color);
                    border-radius: 12px; padding: 1.5rem;
                }
                .section-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;
                }
                .section-header h2 { font-size: 1.2rem; margin: 0; }
                .view-all { color: var(--primary); text-decoration: none; font-size: 0.9rem; }
                
                .transaction-row {
                    display: flex; align-items: center; padding: 1rem 0;
                    border-bottom: 1px solid var(--border-color);
                }
                .transaction-row:last-child { border-bottom: none; }
                
                .tx-icon {
                    width: 40px; height: 40px; border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    margin-right: 1rem;
                }
                .tx-icon.income { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
                .tx-icon.expense { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                
                .tx-details { flex: 1; display: flex; flex-direction: column; }
                .tx-desc { font-weight: 500; color: var(--text-primary); }
                .tx-meta { font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; text-transform: capitalize; }
                
                .tx-amount { font-weight: 600; font-size: 1rem; }
                .tx-amount.income { color: #22c55e; }
                .tx-amount.expense { color: #ef4444; }
                
                .empty-state { text-align: center; padding: 2rem; color: var(--text-secondary); font-style: italic; }
            `}</style>
        </div>
    );
};

export default FinanceDashboard;
