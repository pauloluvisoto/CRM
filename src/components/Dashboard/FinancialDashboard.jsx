import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Briefcase, TrendingUp, TrendingDown, AlertCircle, Plus, CreditCard, Receipt } from 'lucide-react';
import StatCard from './StatCard';
import AccountForm from '../financial/AccountForm';
import UpcomingPayments from '../financial/UpcomingPayments';
import CreditCardWidget from '../financial/CreditCardWidget';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const FinancialDashboard = ({ stats, trends = {}, onBadgeClick }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [financialStats, setFinancialStats] = useState({
        balance: 0,
        pendingReceivables: 0,
        overdueReceivables: 0,
        pendingPayables: 0,
        overduePayables: 0,
        projectedCashFlow: 0
    });
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null); // 'receivable' or 'payable'

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    useEffect(() => {
        fetchFinancialData();
    }, []);

    const fetchFinancialData = async () => {
        try {
            // Fetch receivables
            const { data: receivables } = await supabase
                .from('accounts_receivable')
                .select('*');

            // Fetch payables
            const { data: payables } = await supabase
                .from('accounts_payable')
                .select('*');

            const today = new Date().toISOString().split('T')[0];

            // Calculate receivables
            const totalReceived = (receivables || [])
                .filter(r => r.status === 'received')
                .reduce((sum, r) => sum + Number(r.amount), 0);

            const pendingRec = (receivables || [])
                .filter(r => r.status === 'pending')
                .reduce((sum, r) => sum + Number(r.amount), 0);

            const overdueRec = (receivables || [])
                .filter(r => r.status === 'overdue')
                .length;

            // Calculate payables
            const totalPaid = (payables || [])
                .filter(p => p.status === 'paid')
                .reduce((sum, p) => sum + Number(p.amount), 0);

            const pendingPay = (payables || [])
                .filter(p => p.status === 'pending')
                .reduce((sum, p) => sum + Number(p.amount), 0);

            const overduePay = (payables || [])
                .filter(p => p.status === 'overdue')
                .length;

            // Balance = received - paid
            const balance = totalReceived - totalPaid;

            // Projected 30d = current balance + pending receivables - pending payables
            const projected = balance + pendingRec - pendingPay;

            setFinancialStats({
                balance,
                pendingReceivables: pendingRec,
                overdueReceivables: overdueRec,
                pendingPayables: pendingPay,
                overduePayables: overduePay,
                projectedCashFlow: projected
            });

        } catch (error) {
            console.error('Error fetching financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearAllData = async () => {
        if (!confirm('🛑 ATENÇÃO: Deseja apagar TODOS os lançamentos financeiros (contas a pagar e receber)?\n\nEssa ação é irreversível.')) return;

        try {
            setLoading(true);
            const { error: err1 } = await supabase.from('accounts_receivable').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Safety hack for "all"
            const { error: err2 } = await supabase.from('accounts_payable').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            if (err1) throw err1;
            if (err2) throw err2;

            alert('✅ Dados apagados com sucesso!');
            fetchFinancialData();
            window.location.reload(); // Force refresh to clear sub-components
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('Erro ao apagar dados: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ color: 'white', padding: '2rem' }}>Carregando dados financeiros...</div>;
    }

    return (
        <div className="dashboard-grid">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                <button
                    onClick={clearAllData}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                    }}
                >
                    <AlertCircle size={14} />
                    Limpar Simulação
                </button>
            </div>

            {/* TOP ROW: 4 FINANCIAL KPI CARDS */}
            <div className="stats-row">
                <StatCard
                    title="Saldo Disponível"
                    value={formatCurrency(financialStats.balance)}
                    icon={financialStats.balance >= 0 ? TrendingUp : TrendingDown}
                    trend="neutral"
                    trendValue="--"
                    color={financialStats.balance >= 0 ? "text-green-400" : "text-red-400"}
                />
                <StatCard
                    title="A Receber"
                    value={formatCurrency(financialStats.pendingReceivables)}
                    icon={TrendingUp}
                    trend="neutral"
                    trendValue="--"
                    badge={financialStats.overdueReceivables > 0 ? {
                        text: `${financialStats.overdueReceivables} vencida${financialStats.overdueReceivables > 1 ? 's' : ''}`,
                        color: 'warning'
                    } : null}
                    color="text-green-400"
                    onBadgeClick={financialStats.overdueReceivables > 0 ? () => navigate('/finance?tab=transactions&type=receivable&filter=overdue') : null}
                />
                <StatCard
                    title="A Pagar"
                    value={formatCurrency(financialStats.pendingPayables)}
                    icon={TrendingDown}
                    trend="neutral"
                    trendValue="--"
                    badge={financialStats.overduePayables > 0 ? {
                        text: `${financialStats.overduePayables} vencida${financialStats.overduePayables > 1 ? 's' : ''}`,
                        color: 'danger'
                    } : null}
                    color="text-red-400"
                    onBadgeClick={financialStats.overduePayables > 0 ? () => navigate('/finance?tab=transactions&type=payable&filter=overdue') : null}
                />
                <StatCard
                    title="Fluxo Projetado 30d"
                    value={formatCurrency(financialStats.projectedCashFlow)}
                    icon={Briefcase}
                    trend="neutral"
                    trendValue="--"
                    color="text-lime-400"
                />
            </div>

            {/* BOTTOM ROW: CRM REVENUE CARDS (from commercial deals) */}
            <div className="stats-row secondary-row">
                <StatCard
                    title="Receita Realizada (CRM)"
                    value={formatCurrency(stats.totalRevenue || 0)}
                    icon={DollarSign}
                    trend={trends.totalRevenue?.direction || 'neutral'}
                    trendValue={trends.totalRevenue?.value || '--'}
                />
                <StatCard
                    title="Ticket Médio"
                    value={formatCurrency(stats.avgTicket || 0)}
                    icon={TrendingUp}
                    trend={trends.avgTicket?.direction || 'neutral'}
                    trendValue={trends.avgTicket?.value || '--'}
                />
                <StatCard
                    title="Previsão (Pipeline)"
                    value={formatCurrency(stats.forecast || 0)}
                    icon={Briefcase}
                    trend={trends.forecast?.direction || 'neutral'}
                    trendValue={trends.forecast?.value || '--'}
                />
            </div>

            {/* UPCOMING PAYMENTS TIMELINE */}
            <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.5rem', marginTop: '1rem' }}>Próximos Vencimentos</h3>
                <UpcomingPayments />
            </div>

            {/* CREDIT CARDS WIDGET */}
            <div>
                <CreditCardWidget />
            </div>

            {/* ACCOUNT FORM MODAL */}
            <AccountForm
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setModalType(null); }}
                type={modalType}
                onSuccess={() => fetchFinancialData()} // Refresh data after create
            />

            <style>{`
                .dashboard-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                }
                .secondary-row {
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                }
                
                .finance-actions {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                
                .widget {
                    background-color: var(--bg-secondary);
                    padding: 1.5rem;
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .widget h3 {
                    margin-bottom: 1rem;
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
            `}</style>
        </div>
    );
};

export default FinancialDashboard;
