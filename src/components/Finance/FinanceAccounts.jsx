import React, { useState, useEffect } from 'react';
import {
    ArrowUpCircle,
    ArrowDownCircle,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Filter,
    Search,
    MoreHorizontal,
    Plus,
    Loader2
} from 'lucide-react';
import financeService from '../../services/financeService';
import NewTransactionModal from './NewTransactionModal';
import { useAuth } from '../../contexts/AuthContext'; // Assuming context exists, or use direct user check if needed.
// If AuthContext doesn't exist, we might need to handle auth differently, but usually it's there. 
// For now, I'll rely on the service handling the calls which use the authenticated client.

const parseAccountDescription = (fullDesc) => {
    if (!fullDesc) return { entity: '', desc: '' };
    const parts = fullDesc.split(' - ');
    if (parts.length > 1) {
        return { entity: parts[0], desc: parts.slice(1).join(' - ') };
    }
    return { entity: '', desc: fullDesc };
};

const FinanceAccounts = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('payables'); // 'payables' or 'receivables'
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [editingItem, setEditingItem] = useState(null);
    const [actionMenuOpen, setActionMenuOpen] = useState(null); // ID of item with open menu
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = items.filter(item => {
        const { entity, desc } = parseAccountDescription(item.description);
        const searchLower = searchTerm.toLowerCase();
        return (
            desc.toLowerCase().includes(searchLower) ||
            entity.toLowerCase().includes(searchLower) ||
            item.category.toLowerCase().includes(searchLower) ||
            item.id.toLowerCase().includes(searchLower)
        );
    });

    const themeColor = activeTab === 'payables' ? 'text-red-500' : 'text-green-500';
    const themeBg = activeTab === 'payables' ? 'bg-red-500' : 'bg-green-500';
    const ThemeIcon = activeTab === 'payables' ? ArrowDownCircle : ArrowUpCircle;

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = activeTab === 'payables'
                ? await financeService.getPayables()
                : await financeService.getReceivables();
            setItems(data || []);
        } catch (error) {
            console.error("Error fetching financial data:", error);
            // Optionally show error toast
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setActionMenuOpen(null);
    }, [activeTab]);

    const handleSaveTransaction = async (transactionData) => {
        if (!user) {
            alert("Você precisa estar logado para realizar esta ação.");
            return;
        }

        try {
            const { description, entity, amount, dueDate, category } = transactionData;

            // Construct payload
            const payload = {
                description: `${entity} - ${description}`,
                category,
                amount,
                due_date: dueDate,
                status: transactionData.status || 'pending',
                created_by: user.id
            };

            if (editingItem) {
                // UPDATE logic
                if (activeTab === 'payables') {
                    await financeService.updatePayable(editingItem.id, payload);
                } else {
                    await financeService.updateReceivable(editingItem.id, payload);
                }
            } else {
                // CREATE logic
                if (activeTab === 'payables') {
                    await financeService.createPayable(payload);
                } else {
                    await financeService.createReceivable(payload);
                }
            }

            fetchData();
            setIsModalOpen(false);
            setEditingItem(null);
        } catch (error) {
            console.error("Error saving:", error);
            alert(`Erro ao salvar: ${error.message || "Erro desconhecido"}`);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir este item?")) return;

        try {
            if (activeTab === 'payables') {
                await financeService.deletePayable(id);
            } else {
                await financeService.deleteReceivable(id);
            }
            fetchData();
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Erro ao excluir item.");
        }
    };

    const openEditModal = (item) => {
        // Parse description back to separate entity/desc for the modal to display nicely
        // BUT the modal also does some splitting. Let's pass the raw item and let Modal handle it 
        // OR pre-process it here. The Modal logic I wrote handles splitting `initialData.description`.
        setEditingItem(item);
        setIsModalOpen(true);
        setActionMenuOpen(null);
    };

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full" onClick={() => setActionMenuOpen(null)}>
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div className="flex bg-[#1E1E1E] p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setActiveTab('payables')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'payables'
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <ArrowDownCircle size={18} />
                        Contas a Pagar
                    </button>
                    <button
                        onClick={() => setActiveTab('receivables')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'receivables'
                            ? 'bg-green-500 text-black shadow-lg shadow-green-500/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <ArrowUpCircle size={18} />
                        Contas a Receber
                    </button>
                </div>

                <button
                    onClick={() => {
                        setEditingItem(null);
                        setIsModalOpen(true);
                    }}
                    className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 text-white ${themeBg} bg-opacity-90 hover:bg-opacity-100 shadow-${activeTab === 'payables' ? 'red' : 'green'}-500/20`}
                >
                    <Plus size={20} /> Nova {activeTab === 'payables' ? 'Conta' : 'Cobrança'}
                </button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1E1E1E] border border-white/5 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                    <div className={`absolute right-0 top-0 w-24 h-24 ${themeBg} opacity-5 blur-2xl rounded-full -mr-4 -mt-4 transition-opacity group-hover:opacity-10`} />
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-opacity-10 ${themeBg} ${themeColor}`}>
                        <ThemeIcon size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Total {activeTab === 'payables' ? 'Pendente' : 'A Receber'}</p>
                        <p className="text-2xl font-bold text-white">
                            R$ {items
                                .filter(i => i.status === 'pending')
                                .reduce((acc, i) => acc + Number(i.amount), 0)
                                .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="bg-[#1E1E1E] border border-white/5 p-5 rounded-2xl flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Em Atraso</p>
                        <p className="text-2xl font-bold text-white">
                            R$ {items
                                .filter(i => i.status === 'overdue')
                                .reduce((acc, i) => acc + Number(i.amount), 0)
                                .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="bg-[#1E1E1E] border border-white/5 p-5 rounded-2xl flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500/10 text-green-500">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Total Pago</p>
                        <p className="text-2xl font-bold text-white">
                            R$ {items
                                .filter(i => i.status === 'paid' || i.status === 'received')
                                .reduce((acc, i) => acc + Number(i.amount), 0)
                                .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-[#1E1E1E] border border-white/5 rounded-[32px] flex flex-col flex-1 overflow-hidden">
                {/* Filters Row */}
                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={`Buscar ${activeTab === 'payables' ? 'fornecedor' : 'cliente'}...`}
                            className="w-full bg-[#141414] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                        />
                    </div>
                    <button className="flex items-center gap-2 bg-[#141414] text-gray-400 hover:text-white px-4 py-2.5 rounded-xl border border-white/5 text-sm font-medium transition-colors">
                        <Filter size={18} /> Filtros Avançados
                    </button>
                </div>

                <div className="overflow-auto flex-1 custom-scrollbar relative">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#1E1E1E]/80 z-10">
                            <Loader2 className="animate-spin text-green-500" size={32} />
                        </div>
                    )}

                    {!loading && items.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                            <p>Nenhum registro encontrado.</p>
                        </div>
                    )}

                    {!loading && items.length > 0 && (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#141414] sticky top-0 z-10 text-xs uppercase text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-2xl">Descrição</th>
                                    <th className="px-6 py-4">{activeTab === 'payables' ? 'Fornecedor' : 'Cliente'}</th>
                                    <th className="px-6 py-4">Vencimento</th>
                                    <th className="px-6 py-4">Categoria</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Valor</th>
                                    <th className="px-6 py-4 rounded-tr-2xl"></th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-white/5">
                                {filteredItems.map((item) => {
                                    const { entity, desc } = parseAccountDescription(item.description);
                                    // Handle both status field logic
                                    const isPaid = item.status === 'paid' || item.status === 'received';
                                    const isOverdue = item.status === 'overdue';

                                    return (
                                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-white">{desc}</p>
                                                <p className="text-xs text-gray-500">#{item.id.slice(0, 8)}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-300">{entity}</td>
                                            <td className="px-6 py-4 text-gray-300 font-mono">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-gray-500" />
                                                    {new Date(item.due_date).toLocaleDateString('pt-BR')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-md bg-[#2A2A2A] text-gray-400 text-xs border border-white/5">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${isPaid ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                    isOverdue ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                    }`}>
                                                    {isPaid ? 'Pago' : isOverdue ? 'Atrasado' : 'Pendente'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-white">
                                                R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActionMenuOpen(actionMenuOpen === item.id ? null : item.id);
                                                    }}
                                                    className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {actionMenuOpen === item.id && (
                                                    <div className="absolute right-8 top-8 z-50 w-32 bg-[#1E1E1E] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEditModal(item);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(item.id);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                                        >
                                                            Excluir
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <NewTransactionModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                }}
                type={activeTab}
                onSave={handleSaveTransaction}
                initialData={editingItem}
            />
        </div>
    );
};

export default FinanceAccounts;

