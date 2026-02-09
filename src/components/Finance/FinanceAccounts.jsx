import React, { useState } from 'react';
import {
    ArrowUpCircle,
    ArrowDownCircle,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Filter,
    Search,
    MoreHorizontal,
    Plus
} from 'lucide-react';

const FinanceAccounts = () => {
    const [activeTab, setActiveTab] = useState('payables'); // 'payables' or 'receivables'

    // Mock Data
    const payables = [
        { id: 1, description: 'Amazon AWS', entity: 'Amazon Web Services', dueDate: '2026-02-15', amount: 450.00, status: 'pending', category: 'Infraestrutura' },
        { id: 2, description: 'Aluguel Escritório', entity: 'Imobiliária Central', dueDate: '2026-02-10', amount: 2500.00, status: 'pending', category: 'Despesas Fixas' },
        { id: 3, description: 'Licença Adobe CC', entity: 'Adobe Systems', dueDate: '2026-02-05', amount: 120.00, status: 'paid', category: 'Software' },
        { id: 4, description: 'Servidor Dell', entity: 'Dell Computers', dueDate: '2026-01-20', amount: 8500.00, status: 'overdue', category: 'Equipamentos' },
    ];

    const receivables = [
        { id: 1, description: 'Consultoria Mensal', entity: 'Empresa ABC Ltda', dueDate: '2026-02-20', amount: 5000.00, status: 'pending', category: 'Serviços' },
        { id: 2, description: 'Projeto Website', entity: 'StartUp X', dueDate: '2026-02-12', amount: 3500.00, status: 'pending', category: 'Projetos' },
        { id: 3, description: 'Reembolso Viagem', entity: 'Cliente Y', dueDate: '2026-02-01', amount: 450.00, status: 'paid', category: 'Reembolso' },
    ];

    const data = activeTab === 'payables' ? payables : receivables;
    const themeColor = activeTab === 'payables' ? 'text-red-500' : 'text-green-500';
    const themeBg = activeTab === 'payables' ? 'bg-red-500' : 'bg-green-500';
    const ThemeIcon = activeTab === 'payables' ? ArrowDownCircle : ArrowUpCircle;

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full">
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

                <button className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 text-white ${themeBg} bg-opacity-90 hover:bg-opacity-100 shadow-${activeTab === 'payables' ? 'red' : 'green'}-500/20`}>
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
                        <p className="text-2xl font-bold text-white">R$ {data.filter(i => i.status === 'pending').reduce((acc, i) => acc + i.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                <div className="bg-[#1E1E1E] border border-white/5 p-5 rounded-2xl flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Em Atraso</p>
                        <p className="text-2xl font-bold text-white">R$ {data.filter(i => i.status === 'overdue').reduce((acc, i) => acc + i.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                <div className="bg-[#1E1E1E] border border-white/5 p-5 rounded-2xl flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500/10 text-green-500">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Total Pago</p>
                        <p className="text-2xl font-bold text-white">R$ {data.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
                            placeholder={`Buscar ${activeTab === 'payables' ? 'fornecedor' : 'cliente'}...`}
                            className="w-full bg-[#141414] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                        />
                    </div>
                    <button className="flex items-center gap-2 bg-[#141414] text-gray-400 hover:text-white px-4 py-2.5 rounded-xl border border-white/5 text-sm font-medium transition-colors">
                        <Filter size={18} /> Filtros Avançados
                    </button>
                </div>

                <div className="overflow-auto flex-1 custom-scrollbar">
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
                            {data.map((item) => (
                                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-white">{item.description}</p>
                                        <p className="text-xs text-gray-500">#{item.id}</p>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{item.entity}</td>
                                    <td className="px-6 py-4 text-gray-300 font-mono">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-500" />
                                            {item.dueDate}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-md bg-[#2A2A2A] text-gray-400 text-xs border border-white/5">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${item.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                item.status === 'overdue' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}>
                                            {item.status === 'paid' ? 'Pago' : item.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-white">
                                        R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinanceAccounts;
