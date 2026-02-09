import React, { useState } from 'react';
import { Search, Filter, Download, Plus, ArrowUpRight, ArrowDownLeft, MoreHorizontal, Calendar } from 'lucide-react';

const FinanceTransactions = () => {
    const [filter, setFilter] = useState('all');

    const transactions = [
        { id: '#TRX-9812', date: '02 Fev, 2026', description: 'Pagamento Salário', category: 'Pessoal', amount: 12450.00, type: 'income', status: 'completed', account: 'Gopay' },
        { id: '#TRX-9811', date: '01 Fev, 2026', description: 'Spotify Premium', category: 'Assinaturas', amount: -29.90, type: 'expense', status: 'completed', account: 'Nubank' },
        { id: '#TRX-9810', date: '01 Fev, 2026', description: 'Amazon AWS', category: 'Infraestrutura', amount: -450.00, type: 'expense', status: 'pending', account: 'Visa Corp' },
        { id: '#TRX-9809', date: '30 Jan, 2026', description: 'Venda de Consultoria', category: 'Serviços', amount: 3500.00, type: 'income', status: 'completed', account: 'Inter' },
        { id: '#TRX-9808', date: '28 Jan, 2026', description: 'Uber Trip', category: 'Transporte', amount: -45.20, type: 'expense', status: 'completed', account: 'Gopay' },
        { id: '#TRX-9807', date: '28 Jan, 2026', description: 'Restaurante Outback', category: 'Alimentação', amount: -320.50, type: 'expense', status: 'completed', account: 'Nubank' },
        { id: '#TRX-9806', date: '25 Jan, 2026', description: 'Recebimento NF 1023', category: 'Vendas', amount: 15000.00, type: 'income', status: 'completed', account: 'Inter' },
    ];

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Transações</h1>
                    <p className="text-gray-400 text-sm">Gerencie todas as entradas e saídas financeiras.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-[#1E1E1E] text-white hover:bg-[#2A2A2A] px-4 py-2.5 rounded-xl border border-white/5 flex items-center gap-2 text-sm font-medium transition-colors">
                        <Download size={18} /> Exportar
                    </button>
                    <button className="bg-[#22C55E] text-black hover:bg-[#16a34a] px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-500/20 active:scale-95">
                        <Plus size={20} /> Nova Transação
                    </button>
                </div>
            </div>

            {/* Metrics Stripe */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Entradas (Fev)', value: 'R$ 15.950,00', color: 'text-green-500', icon: ArrowUpRight, bg: 'bg-green-500/10' },
                    { label: 'Saídas (Fev)', value: '-R$ 845,60', color: 'text-red-500', icon: ArrowDownLeft, bg: 'bg-red-500/10' },
                    { label: 'Saldo Previsto', value: 'R$ 15.104,40', color: 'text-white', icon: Calendar, bg: 'bg-white/5' },
                ].map((metric, i) => (
                    <div key={i} className="bg-[#1E1E1E] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${metric.bg} ${metric.color}`}>
                            <metric.icon size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">{metric.label}</p>
                            <p className="text-xl font-bold text-white">{metric.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Container */}
            <div className="bg-[#1E1E1E] border border-white/5 rounded-[32px] flex flex-col flex-1 overflow-hidden">
                {/* Filters */}
                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por descrição, categoria ou ID..."
                            className="w-full bg-[#141414] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
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
                        <button className="p-2 bg-[#141414] text-gray-400 rounded-lg hover:text-white hover:bg-[#2A2A2A]">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#141414] sticky top-0 z-10 text-xs uppercase text-gray-500 font-medium">
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
                            {transactions.map((trx) => (
                                <tr key={trx.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${trx.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {trx.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{trx.description}</p>
                                                <p className="text-xs text-gray-500">{trx.date} • {trx.id}</p>
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
                                        {trx.type === 'income' ? '+' : ''} {trx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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

export default FinanceTransactions;
