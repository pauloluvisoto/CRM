import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

// Helper to parse YYYY-MM-DD into Local Date without Timezone Shift
const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const TransactionHistory = ({ transactions = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTransactions = transactions.filter(tx => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (tx.description || '').toLowerCase().includes(searchLower) ||
            (tx.category || '').toLowerCase().includes(searchLower) ||
            (tx.id || '').toLowerCase().includes(searchLower)
        );
    });
    return (
        <div className="bg-[#1E1E1E] rounded-[32px] border border-white/5 p-6 flex-1 min-h-[300px]">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-white font-bold text-lg">Histórico de Transações</h3>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#141414] border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-gray-300 w-full focus:outline-none focus:border-green-500 transition-colors"
                        />
                    </div>
                    <button className="flex items-center gap-2 bg-[#141414] border border-white/10 text-gray-300 px-4 py-2 rounded-full text-sm hover:border-green-500 transition-colors">
                        <Filter size={16} /> Filtros
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                        <tr className="text-gray-500 text-xs uppercase tracking-wider">
                            <th className="pb-2">ID</th>
                            <th className="pb-2">Descrição</th>
                            <th className="pb-2">Data</th>
                            <th className="pb-2 text-right">Valor</th>
                            <th className="pb-2 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {filteredTransactions.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center text-gray-500 py-4">Nenhuma transação recente.</td>
                            </tr>
                        ) : (
                            filteredTransactions.map((tx, i) => (
                                <tr key={tx.id || i} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3 pr-4 text-white font-medium border-b border-white/5 group-last:border-0 truncate w-24" title={tx.id}>
                                        {tx.id ? tx.id.slice(0, 8) : 'N/A'}...
                                    </td>
                                    <td className="py-3 pr-4 border-b border-white/5 group-last:border-0 text-gray-300 w-full min-w-[150px] truncate max-w-[200px]" title={tx.description}>
                                        {tx.description}
                                    </td>
                                    <td className="py-3 pr-4 border-b border-white/5 group-last:border-0 text-gray-500 text-xs whitespace-nowrap">
                                        {tx.date ? parseDate(tx.date).toLocaleDateString('pt-BR') : 'N/A'}
                                    </td>
                                    <td className={`py-3 pr-4 text-right font-bold border-b border-white/5 group-last:border-0 whitespace-nowrap ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                                    </td>
                                    <td className="py-3 text-right border-b border-white/5 group-last:border-0 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block text-center capitalize w-24
                                            ${tx.status === 'received' || tx.status === 'paid' ? 'bg-green-500/20 text-green-500' :
                                                tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    'bg-red-500/20 text-red-500'}
                                        `}>
                                            {tx.status === 'received' ? 'Recebido' :
                                                tx.status === 'paid' ? 'Pago' :
                                                    tx.status === 'pending' ? 'Pendente' : tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionHistory;
