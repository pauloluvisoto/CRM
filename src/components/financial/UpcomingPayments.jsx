import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Check, X, Filter, ArrowUpCircle, ArrowDownCircle, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import AccountForm from './AccountForm';

const UpcomingPayments = () => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'receivable', 'payable'
    const [searchTerm, setSearchTerm] = useState('');

    // Edit/Delete State
    const [editingAccount, setEditingAccount] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);

    // Get current year-month (e.g., "2026-01")
    const getCurrentMonth = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    };

    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

    useEffect(() => {
        if (user?.id) {
            fetchAccounts();
        }
    }, [user, filter, selectedMonth]);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            // Get start and end of selected month
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]; // Last day of month

            let allAccounts = [];

            // Fetch RECEIVABLES if needed
            if (filter === 'all' || filter === 'receivable') {
                let receivableQuery = supabase
                    .from('accounts_receivable')
                    .select('*')
                    .eq('created_by', user.id)
                    .gte('due_date', startDate)
                    .lte('due_date', endDate)
                    .order('due_date', { ascending: true });

                const { data: receivables, error: recError } = await receivableQuery;
                if (recError) console.error('Error fetching receivables:', recError);

                // Also get OVERDUE receivables from any previous month
                const { data: overdueReceivables } = await supabase
                    .from('accounts_receivable')
                    .select('*')
                    .eq('created_by', user.id)
                    .lt('due_date', startDate)
                    .in('status', ['pending', 'overdue'])
                    .order('due_date', { ascending: true });

                // Combine and remove duplicates
                const allReceivables = [...(receivables || []), ...(overdueReceivables || [])];
                const uniqueReceivables = Array.from(new Map(allReceivables.map(r => [r.id, r])).values());

                // Map receivables to common format
                const mappedReceivables = uniqueReceivables.map(r => ({
                    ...r,
                    type: 'receivable',
                    status: r.received_date ? 'received' : r.status
                }));
                allAccounts = [...allAccounts, ...mappedReceivables];
            }

            // Fetch PAYABLES if needed
            if (filter === 'all' || filter === 'payable') {
                let payableQuery = supabase
                    .from('accounts_payable')
                    .select('*')
                    .eq('created_by', user.id)
                    .gte('due_date', startDate)
                    .lte('due_date', endDate)
                    .order('due_date', { ascending: true });

                const { data: payables, error: payError } = await payableQuery;
                if (payError) console.error('Error fetching payables:', payError);

                // Also get OVERDUE payables from any previous month
                const { data: overduePayables } = await supabase
                    .from('accounts_payable')
                    .select('*')
                    .eq('created_by', user.id)
                    .lt('due_date', startDate)
                    .in('status', ['pending', 'overdue'])
                    .order('due_date', { ascending: true });

                // Combine and remove duplicates
                const allPayables = [...(payables || []), ...(overduePayables || [])];
                const uniquePayables = Array.from(new Map(allPayables.map(p => [p.id, p])).values());

                // Map payables to common format
                const mappedPayables = uniquePayables.map(p => ({
                    ...p,
                    type: 'payable',
                    status: p.paid_date ? 'paid' : p.status
                }));
                allAccounts = [...allAccounts, ...mappedPayables];
            }

            // Sort by due_date
            allAccounts.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

            setAccounts(allAccounts);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (account) => {
        try {
            const isReceivable = account.type === 'receivable';
            const tableName = isReceivable ? 'accounts_receivable' : 'accounts_payable';

            if (isReceivable) {
                const isReceived = account.status === 'received' || account.received_date;
                const updateData = isReceived
                    ? { received_date: null, status: 'pending' }
                    : { received_date: new Date().toISOString().split('T')[0], status: 'received' };

                const { error } = await supabase
                    .from(tableName)
                    .update(updateData)
                    .eq('id', account.id);

                if (error) throw error;
            } else {
                const isPaid = account.status === 'paid' || account.paid_date;
                const updateData = isPaid
                    ? { paid_date: null, status: 'pending' }
                    : { paid_date: new Date().toISOString().split('T')[0], status: 'paid' };

                const { error } = await supabase
                    .from(tableName)
                    .update(updateData)
                    .eq('id', account.id);

                if (error) throw error;
            }

            fetchAccounts(); // Refresh
        } catch (error) {
            console.error('Error updating account status:', error);
        }
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setModalType(account.type);
        setModalOpen(true);
    };

    const handleDelete = async (account) => {
        if (!confirm(`⚠️ Tem certeza que deseja excluir "${account.description}"?\n\nEssa ação é irreversível.`)) return;

        try {
            const tableName = account.type === 'receivable' ? 'accounts_receivable' : 'accounts_payable';
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', account.id);

            if (error) throw error;
            alert('✅ Registro excluído com sucesso!');
            fetchAccounts();
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const handleSuccess = () => {
        fetchAccounts();
        setModalOpen(false);
        setEditingAccount(null);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    };

    const formatDateHeader = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        const diffTime = dateOnly - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Amanhã';
        if (diffDays === -1) return 'Ontem';

        return formatDate(dateStr);
    };

    // Group accounts by date
    const groupedAccounts = accounts
        .filter(account => {
            if (!searchTerm) return true;
            const search = searchTerm.toLowerCase();
            const description = (account.description || '').toLowerCase();
            const category = (account.category || '').toLowerCase();
            return description.includes(search) || category.includes(search);
        })
        .reduce((acc, account) => {
            const dateKey = account.due_date;
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(account);
            return acc;
        }, {});

    const sortedDates = Object.keys(groupedAccounts).sort();

    if (loading) return <div style={{ padding: '2rem', color: 'white' }}>Carregando...</div>;

    return (
        <div className="upcoming-payments">
            {/* FILTERS */}
            <div className="upcoming-filters">
                <div className="filter-group">
                    <label>Mês:</label>
                    <input
                        type="month"
                        className="month-selector"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label>Tipo:</label>
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Todas
                        </button>
                        <button
                            className={`filter-btn ${filter === 'receivable' ? 'active' : ''}`}
                            onClick={() => setFilter('receivable')}
                        >
                            A Receber
                        </button>
                        <button
                            className={`filter-btn ${filter === 'payable' ? 'active' : ''}`}
                            onClick={() => setFilter('payable')}
                        >
                            A Pagar
                        </button>
                    </div>
                </div>

                <div className="filter-group search-group">
                    <label>Buscar:</label>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar por descrição ou categoria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* TIMELINE */}
            <div className="timeline">
                {sortedDates.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={48} style={{ opacity: 0.3 }} />
                        <p>Nenhum vencimento encontrado</p>
                    </div>
                ) : (
                    sortedDates.map(date => (
                        <div key={date} className="timeline-group">
                            <div className="timeline-date-header">
                                <Calendar size={18} />
                                <span>{formatDateHeader(date)}</span>
                                <span className="full-date">{formatDate(date)}</span>
                            </div>
                            <div className="timeline-items">
                                {groupedAccounts[date].map(account => {
                                    const isComplete = account.status === 'received' || account.status === 'paid';
                                    const isReceivable = account.type === 'receivable';
                                    const isOverdue = !isComplete && new Date(account.due_date) < new Date().setHours(0, 0, 0, 0);

                                    return (
                                        <div
                                            key={account.id}
                                            className={`timeline-item ${isComplete ? 'complete' : ''} ${isReceivable ? 'receivable' : 'payable'}`}
                                        >
                                            <div className="item-checkbox">
                                                <button
                                                    className={`check-btn ${isComplete ? 'checked' : ''}`}
                                                    onClick={() => handleToggleStatus(account)}
                                                    title={isComplete ? "Marcar como pendente" : "Marcar como concluído"}
                                                >
                                                    {isComplete ? <Check size={14} /> : null}
                                                </button>
                                            </div>
                                            <div className="item-content">
                                                <div className="item-header">
                                                    <span className={`item-type ${isReceivable ? 'receivable' : 'payable'}`}>
                                                        {isReceivable ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                                                        {isReceivable ? 'Receber' : 'Pagar'}
                                                    </span>
                                                    <span className="item-description">
                                                        {account.description}
                                                        {isOverdue && <span className="status-badge overdue">Vencida</span>}
                                                    </span>
                                                </div>
                                                <div className="item-details">
                                                    <span className="item-category">{account.category}</span>
                                                </div>
                                            </div>
                                            <div className="item-right-side">
                                                <div className="item-amount">
                                                    {formatCurrency(account.amount)}
                                                </div>
                                                <div className="item-actions">
                                                    <button
                                                        className="icon-btn"
                                                        onClick={() => handleEdit(account)}
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="icon-btn danger"
                                                        onClick={() => handleDelete(account)}
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* EDIT MODAL */}
            {(modalOpen || editingAccount) && (
                <AccountForm
                    isOpen={modalOpen}
                    onClose={() => { setModalOpen(false); setEditingAccount(null); }}
                    type={modalType}
                    editData={editingAccount}
                    onSuccess={handleSuccess}
                />
            )}

            <style>{`
                .upcoming-payments {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .upcoming-filters {
                    display: flex;
                    gap: 2rem;
                    flex-wrap: wrap;
                    padding: 1rem;
                    background-color: var(--bg-secondary);
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .filter-group label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--text-secondary);
                }

                .filter-group.search-group {
                    flex: 1;
                    min-width: 250px;
                }

                .month-selector,
                .search-input {
                    padding: 0.5rem;
                    background-color: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    color: var(--text-primary);
                    font-size: 0.875rem;
                    width: 100%;
                    transition: all 0.2s;
                }

                .month-selector:focus,
                .search-input:focus {
                    outline: none;
                    border-color: #bef264;
                    background-color: rgba(190, 242, 100, 0.05);
                }

                .search-input::placeholder {
                    color: var(--text-muted);
                }

                .filter-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                .filter-btn {
                    padding: 0.5rem 1rem;
                    background-color: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-btn:hover {
                    border-color: #bef264;
                    background-color: rgba(190, 242, 100, 0.1);
                    color: var(--text-primary);
                }

                .filter-btn.active {
                    background-color: #bef264;
                    color: #1a1a1a;
                    border-color: #bef264;
                }

                /* TIMELINE STYLES COPIED FROM ACCOUNTS VIEWS */
                .timeline {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .timeline-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .timeline-date-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    background: linear-gradient(135deg, rgba(100, 100, 100, 0.1), rgba(100, 100, 100, 0.05));
                    border-left: 3px solid #bef264;
                    border-radius: 6px;
                    color: var(--text-primary);
                    font-weight: 600;
                    font-size: 0.95rem;
                }

                .timeline-date-header .full-date {
                    margin-left: auto;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                    font-weight: 400;
                }

                .timeline-items {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    padding-left: 1rem;
                }

                .timeline-item {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    background-color: var(--bg-secondary);
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                    transition: all 0.2s;
                    align-items: center;
                }

                /* Consistent Red/Green styling matching Accounts views */
                .timeline-item.payable {
                    background-color: rgba(239, 68, 68, 0.15); /* Red for Expenses */
                    border-left: 3px solid #ef4444;
                }

                .timeline-item.receivable {
                    background-color: rgba(16, 185, 129, 0.15); /* Green for Income */
                    border-left: 3px solid #10b981;
                }

                .timeline-item:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }

                .timeline-item.payable:hover {
                    background-color: rgba(239, 68, 68, 0.2);
                }

                .timeline-item.receivable:hover {
                    background-color: rgba(16, 185, 129, 0.2);
                }

                .timeline-item.complete {
                    opacity: 0.6;
                    /* Background persists */
                }

                .timeline-item.complete .item-description {
                    text-decoration: line-through;
                    color: var(--text-muted);
                }

                .check-btn {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 2px solid var(--border-color);
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: transparent;
                }

                .check-btn:hover {
                    border-color: #bef264;
                }

                .check-btn.checked {
                    background-color: #10b981;
                    border-color: #10b981;
                    color: white;
                }

                .item-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .item-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .item-type {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    white-space: nowrap;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .item-type.receivable {
                    background-color: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                }

                .item-type.payable {
                    background-color: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }

                .status-badge.overdue {
                    margin-left: 0.5rem;
                    padding: 0.1rem 0.5rem;
                    background-color: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .item-description {
                    font-weight: 600;
                    color: var(--text-primary);
                    font-size: 0.95rem;
                }

                .item-details {
                    display: flex;
                    gap: 0.5rem;
                }

                .item-category {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }

                .item-right-side {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .item-amount {
                    font-weight: 700;
                    color: var(--text-primary);
                    font-size: 1rem;
                }

                .item-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .icon-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .icon-btn:hover {
                    background-color: var(--bg-primary);
                    color: var(--text-primary);
                }

                .icon-btn.danger:hover {
                    color: #ef4444;
                    background-color: rgba(239, 68, 68, 0.1);
                }

                .empty-state {
                    padding: 4rem 2rem;
                    text-align: center;
                    color: var(--text-muted);
                }

                .empty-state p {
                    margin-top: 1rem;
                }

                @media (max-width: 768px) {
                    .timeline-item {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }

                    .item-right-side {
                        width: 100%;
                        justify-content: space-between;
                        margin-top: 0.5rem;
                        border-top: 1px solid var(--border-color);
                        padding-top: 0.75rem;
                    }
                }
            `}</style>

        </div>
    );
};

export default UpcomingPayments;
