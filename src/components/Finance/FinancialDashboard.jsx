import React, { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import FinanceHeader from './FinanceHeader';
import TotalBalanceCard from './TotalBalanceCard';
import StatCard from './StatCard';
import WalletList from './WalletList';
import ExpenseBreakdown from './ExpenseBreakdown';
import TransactionHistory from './TransactionHistory';
import RecentIncome from './RecentIncome';
import financeService from '../../services/financeService';

import NewWalletModal from './NewWalletModal';
import NewTransactionModal from './NewTransactionModal';
import BusinessPlanMetrics from './BusinessPlanMetrics';

const FinancialDashboard = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [metrics, setMetrics] = useState(null);
    const [expenseBreakdown, setExpenseBreakdown] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [transactionType, setTransactionType] = useState('income');

    const handlePrevMonth = () => {
        setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch raw data to process locally for the selected month
            // Ideally we would pass the date range to the API to filter on server side
            const [payables, receivables, walletsData] = await Promise.all([
                financeService.getPayables(),
                financeService.getReceivables(),
                financeService.getWallets()
            ]);

            // Helper to parse YYYY-MM-DD into Local Date without Timezone Shift
            const parseDate = (dateStr) => {
                if (!dateStr) return new Date();
                const [y, m, d] = dateStr.split('-').map(Number);
                return new Date(y, m - 1, d);
            };

            // Filter by Selected Month
            const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
            const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59);

            const filterByMonth = (items) => items.filter(item => {
                const date = parseDate(item.due_date);
                return date >= startOfMonth && date <= endOfMonth;
            });

            const monthlyPayables = filterByMonth(payables);
            const monthlyReceivables = filterByMonth(receivables);

            // Metrics Calculation
            const totalIncome = monthlyReceivables.reduce((sum, item) => sum + Number(item.amount), 0);
            const totalExpense = monthlyPayables.reduce((sum, item) => sum + Number(item.amount), 0);

            // "Real" Balance (Paid/Received only)
            const realIncome = monthlyReceivables.filter(i => i.status === 'received').reduce((sum, item) => sum + Number(item.amount), 0);
            const realExpense = monthlyPayables.filter(i => i.status === 'paid').reduce((sum, item) => sum + Number(item.amount), 0);
            const realBalance = realIncome - realExpense;

            // Projected Balance (All)
            const projectedBalance = totalIncome - totalExpense;

            setMetrics({
                totalIncome,
                totalExpense,
                balance: realBalance,
                projectedBalance
            });

            // Expense Breakdown (Projected)
            const breakdown = monthlyPayables.reduce((acc, item) => {
                acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
                return acc;
            }, {});

            const breakdownData = Object.entries(breakdown)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

            setExpenseBreakdown(breakdownData);

            // Recent Transactions (Combined & Sorted)
            const allTransactions = [
                ...monthlyReceivables.map(r => ({ ...r, type: 'income', date: r.due_date })),
                ...monthlyPayables.map(p => ({ ...p, type: 'expense', date: p.due_date }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            setRecentTransactions(allTransactions.slice(0, 10)); // Top 10 of the month

            // Calculate Wallet Balances (Logic from WalletView)
            const enhancedWallets = walletsData.map(w => {
                if (w.type === 'Credit') {
                    // Calculate pending expenses for this wallet (globally, not just this month)
                    // Because credit card balance is total debt
                    const pendingSum = payables
                        .filter(p => p.wallet_id === w.id && p.status === 'pending')
                        .reduce((sum, p) => sum + Number(p.amount), 0);

                    return { ...w, current_usage: pendingSum };
                }
                return w;
            });

            setWallets(enhancedWallets);

        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [selectedMonth]);

    const handleSaveWallet = async (newWallet) => {
        try {
            await financeService.createWallet(newWallet);
            await loadDashboardData(); // Reload all data to ensure sync
            setIsWalletModalOpen(false);
        } catch (error) {
            console.error("Error saving wallet:", error);
            alert("Erro ao salvar carteira.");
        }
    };

    const handleSaveTransaction = async (formData) => {
        try {
            if (formData.type === 'income') {
                await financeService.createReceivable({
                    description: formData.description,
                    amount: formData.amount,
                    due_date: formData.date,
                    status: formData.status,
                    category: 'Vendas', // Default category
                    wallet_id: formData.wallet_id
                });
            } else {
                await financeService.createPayable({
                    description: formData.description,
                    amount: formData.amount,
                    due_date: formData.date,
                    status: formData.status,
                    category: 'Operacional', // Default category
                    wallet_id: formData.wallet_id
                });
            }
            await loadDashboardData();
            setIsTransactionModalOpen(false);
        } catch (error) {
            console.error("Error saving transaction:", error);
            alert("Erro ao salvar transação.");
        }
    };

    const openTransactionModal = (type) => {
        setTransactionType(type);
        setIsTransactionModalOpen(true);
    };

    if (loading) {
        return <div className="p-8 h-full flex items-center justify-center text-white">Carregando dashboard...</div>;
    }

    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-[#141414]">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-8">
                <FinanceHeader />

                {/* Month Navigation */}
                <div className="flex items-center gap-2 bg-[#1E1E1E] border border-white/5 p-1 rounded-full shadow-lg shadow-black/20">
                    <button onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2 px-2">
                        <Calendar size={16} className="text-green-500" />
                        <span className="text-sm font-bold text-white capitalize min-w-[140px] text-center">
                            {selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <button onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            <NewWalletModal
                isOpen={isWalletModalOpen}
                onClose={() => setIsWalletModalOpen(false)}
                onSave={handleSaveWallet}
            />
            <NewTransactionModal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                onSave={handleSaveTransaction}
                initialType={transactionType}
            />

            {/* DASHBOARD GRID */}
            <div className="grid grid-cols-12 gap-8 pb-20">
                {/* LEFT COLUMN (Main Stats) - Spans 8 cols */}
                <div className="col-span-12 xl:col-span-8 flex flex-col gap-8">

                    {/* TOP ROW: Balance + Small Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[280px]">
                        {/* Big Balance Card */}
                        <TotalBalanceCard
                            balance={metrics?.projectedBalance || 0}
                            projectedBalance={metrics?.projectedBalance || 0}
                            onRequest={() => openTransactionModal('income')}
                            onTransfer={() => openTransactionModal('expense')}
                        />


                        {/* Small Chart Cards */}
                        <div className="grid grid-cols-2 gap-4 h-full">
                            <StatCard
                                title="Gasto Mensal"
                                amount={metrics?.totalExpense || 0}
                                chartColor="#EF4444"
                            />
                            <StatCard
                                title="Renda Mensal"
                                amount={metrics?.totalIncome || 0}
                                chartColor="#22C55E"
                            />
                        </div>
                    </div>



                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <ExpenseBreakdown data={expenseBreakdown} totalExpense={metrics?.totalExpense || 0} />
                    </div>
                    <TransactionHistory transactions={recentTransactions} />

                    {/* Business Plan Metrics Section */}
                    <div className="mt-8">
                        <BusinessPlanMetrics />
                    </div>

                </div>

                {/* RIGHT COLUMN (Sidebar/Details) - Spans 4 cols */}
                <div className="col-span-12 xl:col-span-4 flex flex-col gap-8">
                    <WalletList wallets={wallets} onAddWallet={() => setIsWalletModalOpen(true)} />
                    <RecentIncome transactions={recentTransactions.filter(t => t.type === 'income')} />
                </div>
            </div>
        </div>
    );
};

export default FinancialDashboard;
