import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Edit2, Trash2, CheckCircle, Calendar, DollarSign, FileText, Receipt, ArrowDownCircle, Check, AlertCircle } from 'lucide-react';
import AccountForm from './AccountForm';

const AccountsReceivable = ({ initialFilter = 'all', onUpdate, selectedMonth, onMonthChange, monthlyStats }) => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(initialFilter);
    const [editingAccount, setEditingAccount] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Internal state fallback if prop not provided (though parent should provide it)
    const [internalMonth, setInternalMonth] = useState(new Date().toISOString().slice(0, 7));

    const currentMonth = selectedMonth || internalMonth;
    const handleMonthChange = onMonthChange || setInternalMonth;

    useEffect(() => {
        if (initialFilter) {
            setFilter(initialFilter);
        }
    }, [initialFilter]);

    useEffect(() => {
        fetchAccounts();
    }, [filter, currentMonth]);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('accounts_receivable')
                .select('*')
                .order('due_date', { ascending: true });

            // Apply Month Filter
            const [year, month] = currentMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];

            query = query.gte('due_date', startDate).lte('due_date', endDate);

            // Apply Status Filter
            if (filter === 'pending') {
                query = query.eq('status', 'pending');
            } else if (filter === 'overdue') {
                query = query.eq('status', 'overdue');
            } else if (filter === 'received') {
                query = query.eq('status', 'received');
            }

            const { data, error } = await query;
            if (error) throw error;

            setAccounts(data || []);
        } catch (error) {
            console.error('Error fetching receivables:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsReceived = async (id) => {
        try {
            const { error } = await supabase
                .from('accounts_receivable')
                .update({ received_date: new Date().toISOString().split('T')[0], status: 'received' })
                .eq('id', id);

            if (error) throw error;
            alert('✅ Conta marcada como recebida!');
            fetchAccounts();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error marking as received:', error);
            alert('❌ Erro: ' + error.message);
        }
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setModalOpen(true);
    };

    const handleDelete = async (id, description) => {
        const confirmed = window.confirm(`⚠️ Tem certeza que deseja excluir a conta "${description}"?\n\nEsta ação não pode ser desfeita.`);
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('accounts_receivable')
                .delete()
                .eq('id', id);

            if (error) throw error;
            alert('✅ Conta excluída com sucesso!');
            fetchAccounts();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('❌ Erro ao excluir: ' + error.message);
        }
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditingAccount(null);
    };

    const handleSuccess = () => {
        fetchAccounts();
        if (onUpdate) onUpdate();
        handleModalClose();
    };

    const formatCurrency = (val) => {
        const num = Number(val);
        if (isNaN(num)) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: { bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', label: 'Pendente' },
            overdue: { bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', label: 'Vencida' },
            received: { bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399', label: 'Recebida' }
        };
        const s = styles[status] || styles.pending;
        return (
            <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: s.bg,
                color: s.color
            }}>
                {s.label}
            </span>
        );
    };

    // Group accounts by date
    const groupedAccounts = accounts.reduce((acc, account) => {
        const dateKey = account.due_date;
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(account);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedAccounts).sort();

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

        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    };

    const formatDateFull = (dateStr) => {
        return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(dateStr));
    };

    return (
        <div className="accounts-container">
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', width: '100%' }}>
                {/* LEFT COLUMN: Controls & Filters */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                    {/* TOP CONTROLS */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* MONTH FILTER */}
                        <div className="date-filter">
                            <label style={{ color: 'var(--text-secondary)', marginRight: '0.5rem', fontSize: '0.9rem' }}>Mês:</label>
                            <input
                                type="month"
                                value={currentMonth}
                                onChange={(e) => handleMonthChange(e.target.value)}
                                className="month-picker"
                            />
                        </div>

                        {/* ACTION BUTTON */}
                        <button
                            className="action-btn-primary"
                            onClick={() => setModalOpen(true)}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            <Receipt size={20} />
                            Nova Conta a Receber
                        </button>
                    </div>

                    {/* FILTER BUTTONS */}
                    <div className="filter-bar" style={{ margin: 0 }}>
                        <button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Todas
                        </button>
                        <button
                            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            Pendentes
                        </button>
                        <button
                            className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
                            onClick={() => setFilter('overdue')}
                        >
                            Vencidas
                        </button>
                        <button
                            className={`filter-btn ${filter === 'received' ? 'active' : ''}`}
                            onClick={() => setFilter('received')}
                        >
                            Recebidas
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: Stats Cards */}
                <div className="monthly-comparison" style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                    {/* Monthly Receivables */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        padding: '1.25rem',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        flex: 1,
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.05)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <span style={{ fontSize: '0.75rem', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px', marginBottom: '0.5rem' }}>Receitas ({currentMonth.split('-')[1]})</span>
                        <span style={{ fontSize: '1.5rem', color: '#fff', fontWeight: '800', textShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}>
                            {monthlyStats ? formatCurrency(monthlyStats.receivables) : '...'}
                        </span>
                    </div>

                    {/* Monthly Payables */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '1.25rem',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        flex: 1,
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.05)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <span style={{ fontSize: '0.75rem', color: '#fca5a5', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px', marginBottom: '0.5rem' }}>Despesas ({currentMonth.split('-')[1]})</span>
                        <span style={{ fontSize: '1.5rem', color: '#fff', fontWeight: '800', textShadow: '0 0 15px rgba(239, 68, 68, 0.3)' }}>
                            {monthlyStats ? formatCurrency(monthlyStats.payables) : '...'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ERROR / EMPTY STATE */}
            {sortedDates.length === 0 ? (
                <div className="empty-state">
                    <AlertCircle size={48} style={{ opacity: 0.3 }} />
                    <p>Nenhum lançamento encontrado para este período.</p>
                </div>
            ) : (
                /* TIMELINE LIST */
                <div className="timeline">
                    {sortedDates.map(date => (
                        <div key={date} className="timeline-group">
                            <div className="timeline-date-header">
                                <Calendar size={18} />
                                <span>{formatDateHeader(date)}</span>
                                <span className="full-date">{formatDateFull(date)}</span>
                            </div>
                            <div className="timeline-items">
                                {groupedAccounts[date].map(account => {
                                    const isReceived = account.status === 'received';
                                    const isOverdue = !isReceived && new Date(account.due_date) < new Date().setHours(0, 0, 0, 0);

                                    return (
                                        <div
                                            key={account.id}
                                            className={`timeline-item receivable ${isReceived ? 'complete' : ''}`}
                                        >
                                            <div className="item-checkbox">
                                                <button
                                                    className={`check-btn ${isReceived ? 'checked' : ''}`}
                                                    onClick={() => markAsReceived(account.id)}
                                                    disabled={isReceived}
                                                    title={isReceived ? "Recebida" : "Marcar como recebida"}
                                                >
                                                    {isReceived ? <Check size={14} /> : null}
                                                </button>
                                            </div>

                                            <div className="item-content">
                                                <div className="item-header">
                                                    <span className="item-type receivable">
                                                        <ArrowDownCircle size={12} />
                                                        Receber
                                                    </span>
                                                    <span className="item-description">
                                                        {account.description}
                                                        {isOverdue && !isReceived && <span className="status-badge overdue">Vencida</span>}
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
                                                        onClick={() => handleDelete(account.id, account.description)}
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
                    ))}
                </div>
            )}

            {/* FORM MODAL */}
            {(modalOpen || editingAccount) && (
                <AccountForm
                    isOpen={modalOpen}
                    onClose={handleModalClose}
                    type="receivable"
                    editData={editingAccount}
                    onSuccess={handleSuccess}
                />
            )}

            <style>{`
                .accounts-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .action-btn-primary {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
                }

                .action-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
                    filter: brightness(1.1);
                }

                .filter-bar {
                    display: flex;
                    gap: 0.75rem;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .filter-btn {
                    padding: 0.5rem 1rem;
                    background: rgba(30, 30, 40, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    backdrop-filter: blur(8px);
                }

                .filter-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                    transform: translateY(-1px);
                }

                .filter-btn.active {
                    background: linear-gradient(135deg, rgba(190, 242, 100, 0.15) 0%, rgba(190, 242, 100, 0.05) 100%);
                    color: #bef264;
                    border-color: rgba(190, 242, 100, 0.4);
                    box-shadow: 0 0 10px rgba(190, 242, 100, 0.1);
                }

                /* TIMELINE STYLES */
                .timeline {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .timeline-group {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .timeline-date-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1.25rem;
                    background: linear-gradient(90deg, rgba(190, 242, 100, 0.1) 0%, transparent 100%);
                    border-left: 4px solid #bef264;
                    border-radius: 4px 8px 8px 4px;
                    color: var(--text-primary);
                    font-weight: 600;
                    font-size: 0.95rem;
                    margin-bottom: 0.5rem;
                }

                .timeline-date-header .full-date {
                    margin-left: auto;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                    font-weight: 400;
                    letter-spacing: 0.5px;
                }

                .timeline-items {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    padding-left: 1rem;
                }

                .timeline-item {
                    display: flex;
                    gap: 1.5rem;
                    padding: 1.25rem 1.5rem;
                    background: rgba(30, 30, 40, 0.4);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                }

                .timeline-item::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: #374151;
                    transition: width 0.3s;
                }

                .timeline-item:hover {
                    transform: translateY(-2px) scale(1.005);
                    background: rgba(40, 40, 55, 0.6);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                    border-color: rgba(255, 255, 255, 0.08);
                }

                .timeline-item:hover::before {
                    width: 6px;
                }

                .timeline-item.receivable::before {
                    background: linear-gradient(to bottom, #10b981, #059669);
                    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
                }
                
                .timeline-item.receivable {
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(30, 30, 40, 0.4) 100%);
                }

                .timeline-item.complete {
                    opacity: 0.7;
                    background: rgba(30, 30, 40, 0.2);
                }
                
                .timeline-item.complete .item-description {
                    text-decoration: line-through;
                    color: var(--text-muted);
                }

                .check-btn {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    background: rgba(255, 255, 255, 0.05);
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: transparent;
                }

                .check-btn:hover {
                    border-color: #bef264;
                    background: rgba(190, 242, 100, 0.1);
                    transform: scale(1.1);
                }

                .check-btn.checked {
                    background: #10b981;
                    border-color: #10b981;
                    color: white;
                    box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
                }

                .item-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }

                .item-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .item-type {
                    padding: 0.25rem 0.6rem;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    white-space: nowrap;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .item-type.receivable {
                    background: rgba(16, 185, 129, 0.15);
                    color: #34d399;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }

                .status-badge.overdue {
                    margin-left: 0.5rem;
                    padding: 0.2rem 0.6rem;
                    background: rgba(239, 68, 68, 0.15);
                    color: #f87171;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    box-shadow: 0 0 10px rgba(239, 68, 68, 0.1);
                }

                .item-description {
                    font-weight: 600;
                    color: var(--text-primary);
                    font-size: 1rem;
                    letter-spacing: -0.3px;
                }

                .item-category {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .item-category::before {
                    content: '';
                    display: block;
                    width: 6px;
                    height: 6px;
                    background: var(--text-muted);
                    border-radius: 50%;
                    opacity: 0.5;
                }

                .item-right-side {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                }

                .item-amount {
                    font-weight: 700;
                    color: var(--text-primary);
                    font-size: 1.1rem;
                    letter-spacing: -0.5px;
                }

                .item-actions {
                    display: flex;
                    gap: 0.75rem;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                }
                
                .timeline-item:hover .item-actions {
                    opacity: 1;
                }

                .icon-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid transparent;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 8px;
                    transition: all 0.2s;
                }

                .icon-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                    transform: scale(1.1);
                }

                .icon-btn.danger:hover {
                    color: #f87171;
                    background: rgba(239, 68, 68, 0.15);
                    border-color: rgba(239, 68, 68, 0.3);
                    box-shadow: 0 0 10px rgba(239, 68, 68, 0.1);
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    color: var(--text-muted);
                    background: rgba(30, 30, 40, 0.3);
                    border-radius: 16px;
                    border: 1px dashed rgba(255, 255, 255, 0.1);
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
                        border-top: 1px solid rgba(255, 255, 255, 0.05);
                        padding-top: 1rem;
                    }
                }

                .month-picker {
                    padding: 0.75rem 1rem;
                    background: rgba(30, 30, 40, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-family: inherit;
                    outline: none;
                    cursor: pointer;
                    transition: border-color 0.2s;
                }
                
                .month-picker:hover {
                    border-color: rgba(255, 255, 255, 0.3);
                }
                
                .month-picker::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    cursor: pointer;
                    opacity: 0.7;
                }
                
                .month-picker::-webkit-calendar-picker-indicator:hover {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
};

export default AccountsReceivable;
