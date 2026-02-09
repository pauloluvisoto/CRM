import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ArrowUpRight, ArrowDownLeft, Filter, Search, MoreVertical, Plus } from 'lucide-react';
import NewTransactionModal from './NewTransactionModal';

const TransactionsList = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, income, expense
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, [filter]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('transactions')
                .select('*, financial_categories(name, color), financial_accounts(name)')
                .order('due_date', { ascending: true }); // Show oldest due first

            if (filter !== 'all') {
                query = query.eq('type', filter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setTransactions(data || []);
        } catch (err) {
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTransaction = () => {
        setIsModalOpen(true);
    };

    const handleTransactionCreated = () => {
        fetchTransactions(); // Refresh list
    };

    const handleStatusToggle = async (id, currentStatus) => {
        const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
        try {
            const { error } = await supabase
                .from('transactions')
                .update({
                    status: newStatus,
                    paid_date: newStatus === 'paid' ? new Date().toISOString() : null
                })
                .eq('id', id);

            if (error) throw error;
            // Optimistic Update
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        } catch (err) {
            alert('Erro ao atualizar status');
        }
    };

    const filteredTransactions = transactions.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="tx-page">
            <div className="page-header">
                <div>
                    <h1>Transações</h1>
                    <p>Contas a Pagar e Receber</p>
                </div>
                <button className="btn-primary" onClick={handleCreateTransaction}>
                    <Plus size={18} /> Nova Transação
                </button>
            </div>

            <div className="toolbar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar transação..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Todas
                    </button>
                    <button
                        className={`filter-btn income ${filter === 'income' ? 'active' : ''}`}
                        onClick={() => setFilter('income')}
                    >
                        Entradas
                    </button>
                    <button
                        className={`filter-btn expense ${filter === 'expense' ? 'active' : ''}`}
                        onClick={() => setFilter('expense')}
                    >
                        Saídas
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="tx-table">
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Vencimento</th>
                            <th>Conta</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td></tr>
                        ) : filteredTransactions.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Nenhum lançamento encontrado.</td></tr>
                        ) : (
                            filteredTransactions.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <div className="tx-desc-cell">
                                            <div className={`icon-box ${t.type}`}>
                                                {t.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                            </div>
                                            <span>{t.description}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className="category-badge"
                                            style={{
                                                backgroundColor: t.financial_categories?.color + '20',
                                                color: t.financial_categories?.color || '#888'
                                            }}
                                        >
                                            {t.financial_categories?.name || 'Geral'}
                                        </span>
                                    </td>
                                    <td>{new Date(t.due_date || t.created_at).toLocaleDateString()}</td>
                                    <td>{t.financial_accounts?.name || '-'}</td>
                                    <td className={`amount-cell ${t.type}`}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                    </td>
                                    <td>
                                        <button
                                            className={`status-badge ${t.status}`}
                                            onClick={() => handleStatusToggle(t.id, t.status)}
                                        >
                                            {t.status === 'paid' ? 'Pago' : t.status === 'pending' ? 'Pendente' : 'Atrasado'}
                                        </button>
                                    </td>
                                    <td>
                                        <button className="btn-icon"><MoreVertical size={16} /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <NewTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleTransactionCreated}
            />

            <style>{`
                .tx-page { padding: 2rem; max-width: 1200px; margin: 0 auto; color: var(--text-primary); }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .page-header h1 { font-size: 1.8rem; font-weight: 700; margin: 0; }
                .page-header p { color: var(--text-secondary); margin-top: 4px; }

                .toolbar { display: flex; justify-content: space-between; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
                .search-box { 
                    position: relative; flex: 1; min-width: 250px; 
                }
                .search-box input {
                    width: 100%; padding: 0.75rem 0.75rem 0.75rem 2.5rem;
                    background: var(--bg-secondary); border: 1px solid var(--border-color);
                    border-radius: 8px; color: white;
                }
                .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }

                .filters { display: flex; gap: 0.5rem; }
                .filter-btn {
                    padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid var(--border-color);
                    background: transparent; color: var(--text-secondary); cursor: pointer;
                    font-weight: 500; transition: all 0.2s;
                }
                .filter-btn.active { background: var(--bg-hover); color: white; border-color: white; }
                
                /* Specific active colors could be nice too */
                .filter-btn.income.active { background: rgba(34, 197, 94, 0.2); color: #22c55e; border-color: #22c55e; }
                .filter-btn.expense.active { background: rgba(239, 68, 68, 0.2); color: #ef4444; border-color: #ef4444; }

                .table-container {
                    background: var(--bg-secondary); border-radius: 8px; overflow: hidden;
                    border: 1px solid var(--border-color);
                }
                .tx-table { width: 100%; border-collapse: collapse; }
                .tx-table th { 
                    text-align: left; padding: 1rem; color: var(--text-secondary); 
                    border-bottom: 1px solid var(--border-color); font-weight: 600; font-size: 0.85rem;
                }
                .tx-table td { 
                    padding: 1rem; border-bottom: 1px solid var(--border-color); vertical-align: middle;
                }
                .tx-table tr:last-child td { border-bottom: none; }
                .tx-table tr:hover { background: var(--bg-hover); }

                .tx-desc-cell { display: flex; align-items: center; gap: 10px; font-weight: 500; }
                .icon-box {
                    width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center;
                }
                .icon-box.income { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
                .icon-box.expense { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

                .category-badge {
                    padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;
                    text-transform: uppercase;
                }

                .amount-cell { font-family: monospace; font-size: 0.95rem; font-weight: 600; }
                .amount-cell.income { color: #22c55e; }
                .amount-cell.expense { color: #ef4444; }

                .status-badge {
                    padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600;
                    text-transform: uppercase; cursor: pointer; border: none;
                }
                .status-badge.paid { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
                .status-badge.pending { background: rgba(234, 179, 8, 0.2); color: #eab308; }
                .status-badge.overdue { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

                .btn-primary { background: var(--primary); color: black; border: none; padding: 0.6rem 1rem; border-radius: 6px; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer; }
                .btn-icon { background: none; border: none; color: var(--text-muted); cursor: pointer; }
                .btn-icon:hover { color: white; }
            `}</style>
        </div>
    );
};

export default TransactionsList;
