import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import financeService from '../../services/financeService';
import { Search, Filter, Download, Plus, ArrowUpRight, ArrowDownLeft, MoreHorizontal, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

import NewTransactionModal from './NewTransactionModal';
import { useAuth } from '../../contexts/AuthContext';

const FinanceTransactions = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [filter, setFilter] = useState('all');
    const [walletFilter, setWalletFilter] = useState(null);

    useEffect(() => {
        if (location.state?.filterWalletId) {
            setWalletFilter(location.state.filterWalletId);
            setViewMode('all');
        }
    }, [location.state]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState('month');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('expense'); // 'expense' or 'income'
    const [showTypeMenu, setShowTypeMenu] = useState(false);

    const [wallets, setWallets] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [payables, receivables, walletsData] = await Promise.all([
                financeService.getPayables(),
                financeService.getReceivables(),
                financeService.getWallets()
            ]);

            setWallets(walletsData);

            // Helper to get wallet name
            const getWalletName = (id) => {
                const w = walletsData.find(w => w.id === id);
                return w ? `${w.holder_name} (${w.provider})` : 'N/A';
            };

            // Helper to parse YYYY-MM-DD into Local Date without Timezone Shift
            const parseDate = (dateStr) => {
                if (!dateStr) return new Date();
                const [y, m, d] = dateStr.split('-').map(Number);
                return new Date(y, m - 1, d);
            };

            // Normalizing data structure
            const normalizedPayables = payables.map(p => {
                const dateObj = parseDate(p.due_date);
                return {
                    id: p.id,
                    description: p.description,
                    category: p.category,
                    amount: Number(p.amount),
                    type: 'expense',
                    date: dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
                    rawDate: dateObj,
                    status: p.status === 'paid' ? 'completed' : 'pending',
                    account: getWalletName(p.wallet_id),
                    wallet_id: p.wallet_id,
                    recurrence_id: p.recurrence_id
                };
            });

            const normalizedReceivables = receivables.map(r => {
                const dateObj = parseDate(r.due_date);
                return {
                    id: r.id,
                    description: r.description,
                    category: r.category,
                    amount: Number(r.amount),
                    type: 'income',
                    date: dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
                    rawDate: dateObj,
                    status: r.status === 'received' ? 'completed' : 'pending',
                    account: getWalletName(r.wallet_id),
                    wallet_id: r.wallet_id,
                    recurrence_id: r.recurrence_id
                };
            });

            const allTransactions = [...normalizedReceivables, ...normalizedPayables].sort((a, b) => b.rawDate - a.rawDate);
            setTransactions(allTransactions);
        } catch (error) {
            console.error("Failed to load transactions", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, []);

    // Derived State for Metrics
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpenses;

    // Monthly Metrics Calculation
    const monthlyTransactions = transactions.filter(t => {
        const tDate = new Date(t.rawDate);
        return tDate.getMonth() === selectedMonth.getMonth() &&
            tDate.getFullYear() === selectedMonth.getFullYear();
    });

    const monthlyProjectedIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const monthlyRealizedIncome = monthlyTransactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0);

    const monthlyProjectedExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const monthlyRealizedExpenses = monthlyTransactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0);

    const monthlyProjectedBalance = monthlyProjectedIncome - monthlyProjectedExpenses;
    const monthlyRealizedBalance = monthlyRealizedIncome - monthlyRealizedExpenses;

    // All Time Metrics
    const allTimeProjectedIncome = totalIncome;
    const allTimeRealizedIncome = transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0);
    const allTimeProjectedExpenses = totalExpenses;
    const allTimeRealizedExpenses = transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0);

    const allTimeProjectedBalance = allTimeProjectedIncome - allTimeProjectedExpenses;
    const allTimeRealizedBalance = allTimeRealizedIncome - allTimeRealizedExpenses;

    // Display Variables
    const displayProjectedIncome = viewMode === 'month' ? monthlyProjectedIncome : allTimeProjectedIncome;
    const displayRealizedIncome = viewMode === 'month' ? monthlyRealizedIncome : allTimeRealizedIncome;
    const displayProjectedExpenses = viewMode === 'month' ? monthlyProjectedExpenses : allTimeProjectedExpenses;
    const displayRealizedExpenses = viewMode === 'month' ? monthlyRealizedExpenses : allTimeRealizedExpenses;
    const displayProjectedBalance = viewMode === 'month' ? monthlyProjectedBalance : allTimeProjectedBalance;
    const displayRealizedBalance = viewMode === 'month' ? monthlyRealizedBalance : allTimeRealizedBalance;

    const handlePrevMonth = () => {
        setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
        setViewMode('month');
    };

    const handleNextMonth = () => {
        setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
        setViewMode('month');
    };

    // Filter Logic
    const filteredTransactions = transactions.filter(t => {
        // Text Search
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            t.description.toLowerCase().includes(searchLower) ||
            t.category.toLowerCase().includes(searchLower) ||
            t.id.toLowerCase().includes(searchLower) ||
            t.account.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;

        // Type Filter (Main Tabs)
        if (filter === 'receitas' && t.type !== 'income') return false;
        if (filter === 'despesas' && t.type !== 'expense') return false;
        if (filter === 'pendente' && t.status === 'completed') return false;

        if (walletFilter && t.wallet_id !== walletFilter) return false;

        // Date Range Filter (Custom or Month Selection)
        if (dateRange.start || dateRange.end) {
            // Custom Range priority
            if (dateRange.start) {
                const start = new Date(dateRange.start);
                start.setHours(0, 0, 0, 0);
                const tDate = new Date(t.rawDate);
                tDate.setHours(0, 0, 0, 0);
                if (tDate < start) return false;
            }
            if (dateRange.end) {
                const end = new Date(dateRange.end);
                end.setHours(23, 59, 59, 999);
                const tDate = new Date(t.rawDate);
                if (tDate > end) return false;
            }
        } else if (viewMode === 'month') {
            // Month Selection Filter (Default)
            const tDate = new Date(t.rawDate);
            if (
                tDate.getMonth() !== selectedMonth.getMonth() ||
                tDate.getFullYear() !== selectedMonth.getFullYear()
            ) {
                return false;
            }
        }

        if (filter === 'all' || filter === 'todos') return true;
        if (filter === 'receitas') return t.type === 'income';
        if (filter === 'despesas') return t.type === 'expense';
        if (filter === 'pendente') return t.status === 'pending';
        return true;
    });

    const [openMenuId, setOpenMenuId] = useState(null);

    const toggleMenu = (id, e) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === id ? null : id);
    };

    const handleDeleteTransaction = async (transaction) => {
        let deleteFuture = false;

        if (transaction.recurrence_id) {
            const userChoseAll = confirm('Esta transação faz parte de uma série (parcelada ou recorrente).\n\nDeseja excluir TUDO daqui para frente (OK)?\nOu apenas esta (Cancelar)?');
            if (userChoseAll) {
                deleteFuture = true;
            } else {
                if (!confirm('Confirmar exclusão APENAS desta transação?')) return;
            }
        } else {
            if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
        }

        try {
            if (deleteFuture) {
                const dateIso = transaction.rawDate.toISOString().split('T')[0];
                if (transaction.type === 'expense') {
                    await financeService.deleteRecurringPayable(transaction.recurrence_id, dateIso);
                } else {
                    await financeService.deleteRecurringReceivable(transaction.recurrence_id, dateIso);
                }
            } else {
                if (transaction.type === 'expense') {
                    await financeService.deletePayable(transaction.id);
                } else {
                    await financeService.deleteReceivable(transaction.id);
                }
            }
            loadData();
            setOpenMenuId(null);
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Erro ao excluir transação.");
        }
    };

    const [transactionToEdit, setTransactionToEdit] = useState(null);

    const handleEditTransaction = (trx) => {
        setTransactionToEdit(trx);
        setModalType(trx.type);
        setOpenMenuId(null);
        setIsModalOpen(true);
    };

    const handleSaveTransaction = async (formData) => {
        if (!user) return alert("Login necessário");

        try {
            const isPaid = formData.status === 'paid';
            let baseStatus = isPaid ? (formData.type === 'income' ? 'received' : 'paid') : 'pending';

            // Helper function to create/update a single entry
            const saveEntry = async (entryDate, entryAmount, entryDescription, entryStatus, isFirst, isRecurringItem, recurrenceId = null) => {
                const payload = {
                    description: entryDescription,
                    amount: entryAmount,
                    due_date: entryDate,
                    status: entryStatus,
                    wallet_id: formData.wallet_id || null,
                    category: transactionToEdit?.category || (formData.type === 'income' ? 'Vendas' : 'Operacional'),
                    is_recurring: isRecurringItem,
                    recurrence_id: recurrenceId,
                    ...(formData.type === 'income' && entryStatus === 'received' ? { received_date: entryDate } : {}),
                    ...(formData.type === 'expense' && entryStatus === 'paid' ? { paid_date: entryDate } : {}),
                    ...(formData.type === 'income' && entryStatus === 'pending' ? { received_date: null } : {}),
                    ...(formData.type === 'expense' && entryStatus === 'pending' ? { paid_date: null } : {})
                };

                // Add creator only on insert
                if (!transactionToEdit) {
                    payload.created_by = user.id;
                }

                if (transactionToEdit && isFirst) {
                    // Update existing
                    if (formData.type === 'income') {
                        await financeService.updateReceivable(transactionToEdit.id, payload);
                    } else {
                        await financeService.updatePayable(transactionToEdit.id, payload);
                    }
                } else {
                    // Create new
                    if (formData.type === 'income') {
                        await financeService.createReceivable(payload);
                    } else {
                        await financeService.createPayable(payload);
                    }
                }
            };

            const recurrence = formData.recurrence || 'none';
            let count = Number(formData.installments);

            // Recurrence Logic Configuration
            let isAutoRecursive = false;

            if (recurrence === 'none') {
                count = 1;
            } else if (recurrence === 'recurring') {
                if (count === 0) {
                    // Auto-Renew: Create 6 months buffer upfront
                    count = 6;
                    isAutoRecursive = true;
                }
            }
            if (!count) count = 1;

            // --- EDIT RECURRENCE LOGIC ---
            if (transactionToEdit && transactionToEdit.recurrence_id) {
                // Ask user if they want to update the series
                const updateSeries = confirm('Este item faz parte de uma série/recorrência.\nDeseja aplicar as alterações para TODOS os itens futuros dessa série?\n\nOK = Sim, atualizar todos os futuros.\nCancelar = Não, atualizar apenas este.');

                if (updateSeries) {
                    // Prepare Bulk Payload (Excluding Date to prevent overwriting all dates to today)
                    const bulkPayload = {
                        description: formData.description,
                        amount: formData.amount,
                        category: transactionToEdit.category || (formData.type === 'income' ? 'Vendas' : 'Operacional'),
                        wallet_id: formData.wallet_id || null
                    };

                    const fromDate = transactionToEdit.rawDate.toISOString().split('T')[0];

                    if (formData.type === 'income') {
                        await financeService.updateRecurringReceivable(transactionToEdit.recurrence_id, fromDate, bulkPayload);
                    } else {
                        await financeService.updateRecurringPayable(transactionToEdit.recurrence_id, fromDate, bulkPayload);
                    }

                    loadData();
                    setIsModalOpen(false);
                    setTransactionToEdit(null);
                    return; // Stop execution here
                }
            }

            let baseDate = new Date(formData.date);

            // --- CREDIT CARD LOGIC ---
            // If it's a Credit Card expense, we map the Purchase Date -> Bill Due Date
            const selectedWallet = wallets.find(w => w.id === formData.wallet_id);
            if (selectedWallet && selectedWallet.type === 'Credit' && formData.type === 'expense') {
                // User Requirement: "Devem ser lançados como em aberto" (Pending)
                // Even if user clicked "Confirm Payment" (Paid), for Credit Card it is Pending until Bill Payment.
                baseStatus = 'pending';

                const closingDay = Number(selectedWallet.closing_day);
                const dueDay = Number(selectedWallet.due_day);

                if (closingDay && dueDay) {
                    // Parse input date safely as local date
                    const [y, m, d] = formData.date.split('-').map(Number);

                    // Logic: If Purchase Day > Closing Day, it falls in NEXT month's bill
                    // Otherwise, it falls in CURRENT month's bill (relative to purchase month)
                    // Note: Usually Closing Day (e.g. 5) is before Due Day (e.g. 15).

                    let targetMonthIndex = m - 1; // 0-indexed
                    if (d > closingDay) {
                        targetMonthIndex += 1;
                    }

                    // However, we also need to check if the Due Date for that month has passed? 
                    // No, usually we just assign to the specific bill cycle.

                    // Create the Base Due Date
                    // We set the date to the Due Day of the target month
                    // JS Date automatically handles month overflow (e.g. month 12 -> Jan next year)
                    baseDate = new Date(y, targetMonthIndex, dueDay);
                }
            }

            // Generate Recurrence ID for new batches
            const batchRecurrenceId = (recurrence !== 'none' || isAutoRecursive) ? crypto.randomUUID() : null;

            if (recurrence === 'none' || (transactionToEdit && !isAutoRecursive)) {
                // Single Save or Edit (Recurrence edits not fully supported in batch yet, safe fallback)
                await saveEntry(baseDate.toISOString().split('T')[0], formData.amount, formData.description, baseStatus, true, false, batchRecurrenceId);
            } else {
                // Batch Creation (Installments or Auto-Renew Buffer)
                const promises = [];
                for (let i = 0; i < count; i++) {
                    const nextDate = new Date(baseDate);
                    nextDate.setMonth(baseDate.getMonth() + i);

                    let amount = Number(formData.amount);
                    let description = formData.description;
                    let status = 'pending';
                    // If Auto-Recursive, ALL items are marked is_recurring=true so each triggers the +6 month rule
                    // If Installments, usually FALSE because they end? 
                    // Wait, if Installment, is_recurring should be FALSE (default).
                    let isRecurringItem = isAutoRecursive;

                    // First Item Logic
                    if (i === 0) {
                        status = baseStatus;
                    }

                    if (recurrence === 'installment') {
                        amount = amount / count;
                        description = `${description} (${i + 1}/${count})`;
                    } else if (recurrence === 'recurring' && !isAutoRecursive) {
                        // Fixed period recurrent
                        description = `${description} (${i + 1}/${count})`;
                    }
                    // For Auto-Recursive, keep Description clean? Or add Month? 
                    // User usually wants clean for recurring. "Aluguel".
                    // But ID differentiates.

                    promises.push(saveEntry(nextDate.toISOString().split('T')[0], amount, description, status, i === 0, isRecurringItem, batchRecurrenceId));
                }

                await Promise.all(promises);
            }

            loadData();
            setIsModalOpen(false);
            setTransactionToEdit(null);
        } catch (error) {
            console.error("Error saving:", error);
            alert("Erro ao salvar: " + (error.message || error));
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto min-h-screen pb-24" onClick={() => { setShowTypeMenu(false); setOpenMenuId(null); }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Transações</h1>
                    <p className="text-gray-400 text-sm">Gerencie todas as entradas e saídas financeiras.</p>
                </div>

                {/* Current Month Indicator */}
                <div className="hidden md:flex items-center gap-2 bg-[#1E1E1E] border border-white/5 p-1 rounded-full shadow-lg shadow-black/20">
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
                <div className="flex items-center gap-3 relative">
                    <button className="bg-[#1E1E1E] text-white hover:bg-[#2A2A2A] px-4 py-2.5 rounded-xl border border-white/5 flex items-center gap-2 text-sm font-medium transition-colors">
                        <Download size={18} /> Exportar
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowTypeMenu(!showTypeMenu);
                        }}
                        className="bg-[#22C55E] text-black hover:bg-[#16a34a] px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-500/20 active:scale-95"
                    >
                        <Plus size={20} /> Nova Transação
                    </button>

                    {/* Type Selection Menu */}
                    {showTypeMenu && (
                        <div className="absolute right-0 top-14 z-50 w-48 bg-[#1E1E1E] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <button
                                onClick={() => {
                                    setModalType('income');
                                    setIsModalOpen(true);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-green-400 hover:bg-white/5 font-bold flex items-center gap-2 transition-colors"
                            >
                                <ArrowUpRight size={16} /> Nova Receita
                            </button>
                            <button
                                onClick={() => {
                                    setModalType('expense');
                                    setIsModalOpen(true);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 font-bold flex items-center gap-2 transition-colors"
                            >
                                <ArrowDownLeft size={16} /> Nova Despesa
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics Section with Toggle */}
            <div className="flex flex-col gap-4 mb-2">
                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 ml-1">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {viewMode === 'month'
                            ? `Resumo Mensal: ${selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
                            : 'Resumo Geral: Todo o Período'}
                    </h3>

                    {/* View Toggle */}
                    <div className="bg-[#1E1E1E] p-1 rounded-xl border border-white/5 flex">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            Mensal
                        </button>
                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'all' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            Histórico Geral
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Income Card */}
                    <div className="bg-[#1E1E1E] border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                                <ArrowUpRight size={16} />
                            </div>
                            <h4 className="font-bold text-white">{viewMode === 'month' ? 'Receitas do Mês' : 'Receitas Totais'}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase">Previsto / Cadastrado</p>
                                <p className="text-lg font-bold text-white">
                                    {displayProjectedIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase">Realizado / Baixado</p>
                                <p className="text-lg font-bold text-green-500">
                                    {displayRealizedIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Expenses Card */}
                    <div className="bg-[#1E1E1E] border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                                <ArrowDownLeft size={16} />
                            </div>
                            <h4 className="font-bold text-white">{viewMode === 'month' ? 'Despesas do Mês' : 'Despesas Totais'}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase">Previsto / Cadastrado</p>
                                <p className="text-lg font-bold text-white">
                                    {displayProjectedExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase">Realizado / Baixado</p>
                                <p className="text-lg font-bold text-red-500">
                                    {displayRealizedExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Balance Card */}
                    <div className="bg-[#1E1E1E] border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center">
                                <Calendar size={16} />
                            </div>
                            <h4 className="font-bold text-white">{viewMode === 'month' ? 'Saldo do Mês' : 'Saldo Geral'}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase">Saldo Previsto</p>
                                <p className={`text-lg font-bold ${displayProjectedBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {displayProjectedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase">Saldo Realizado</p>
                                <p className={`text-lg font-bold ${displayRealizedBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {displayRealizedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-[#1E1E1E] border border-white/5 rounded-[32px] flex flex-col">
                {/* Filters */}
                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por descrição, categoria ou ID..."
                            className="w-full bg-[#141414] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
                        {['Todos', 'Receitas', 'Despesas', 'Pendente'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f.toLowerCase())}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${(filter === 'all' && f === 'Todos') || filter === f.toLowerCase()
                                    ? 'bg-white text-black'
                                    : 'bg-[#141414] text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-green-500 text-black' : 'bg-[#141414] text-gray-400 hover:text-white hover:bg-[#2A2A2A]'}`}
                            title="Filtrar por data"
                        >
                            <Filter size={18} />
                        </button>
                        {walletFilter && (
                            <button
                                onClick={() => { setWalletFilter(null); setViewMode('month'); }}
                                className="px-3 py-2 bg-green-500/10 text-green-500 rounded-lg text-xs font-bold border border-green-500/20 hover:bg-green-500/20 transition-colors"
                            >
                                Carteira Filtrada (Limpar)
                            </button>
                        )}
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="p-6 pt-0 border-b border-white/5 animate-in slide-in-from-top-2">
                        <div className="flex flex-wrap items-end gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Data Inicial</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Data Final</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                                />
                            </div>
                            {(dateRange.start || dateRange.end) && (
                                <button
                                    onClick={() => setDateRange({ start: '', end: '' })}
                                    className="text-xs text-red-400 hover:text-red-300 underline pb-2"
                                >
                                    Limpar datas
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="w-full">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#141414] text-xs uppercase text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-2xl">Transação</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Conta</th>
                                <th className="px-6 py-4 text-right">Valor</th>
                                <th className="px-6 py-4 rounded-tr-2xl"></th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500">Carregando transações...</td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500">Nenhuma transação encontrada.</td>
                                </tr>
                            ) : (
                                filteredTransactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${trx.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {trx.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{trx.description}</p>
                                                    <p className="text-xs text-gray-500">{trx.date} • {trx.id.split('-')[0]}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-md bg-[#2A2A2A] text-gray-300 text-xs border border-white/5">
                                                {trx.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${trx.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                <span className="text-gray-300 capitalize">{trx.status === 'completed' ? 'Concluído' : 'Pendente'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {trx.account}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${trx.type === 'income' ? 'text-green-500' : 'text-white'}`}>
                                            {trx.type === 'income' ? '+' : '-'} {trx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={(e) => toggleMenu(trx.id, e)}
                                                className={`p-2 rounded-lg transition-colors ${openMenuId === trx.id ? 'text-white bg-white/10 opacity-100' : 'text-gray-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100'}`}
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {openMenuId === trx.id && (
                                                <div className="absolute right-8 top-12 z-50 w-32 bg-[#1E1E1E] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                    <button
                                                        className="w-full text-left px-4 py-2.5 text-xs text-white hover:bg-white/5 font-medium transition-colors"
                                                        onClick={() => handleEditTransaction(trx)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        className="w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-red-500/10 font-medium transition-colors"
                                                        onClick={() => handleDeleteTransaction(trx)}
                                                    >
                                                        Excluir
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <NewTransactionModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setTransactionToEdit(null); }}
                initialType={modalType}
                onSave={handleSaveTransaction}
                transactionToEdit={transactionToEdit}
                wallets={wallets}
            />
        </div>
    );
};

export default FinanceTransactions;
