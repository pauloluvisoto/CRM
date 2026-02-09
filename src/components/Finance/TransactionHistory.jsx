import React from 'react';
import { Search, Filter } from 'lucide-react';

const TransactionHistory = () => {
    const transactions = [
        { id: 'INV-1003', status: 'Credit', from: 'Gopay', phone: '(405) 555-0128', amount: -21000, state: 'Pending' },
        { id: 'NV-1001', status: 'Debit', from: 'Paypal', phone: '(207) 555-0119', amount: 65000, state: 'Done' },
        { id: 'INV-1005', status: 'Credit', from: 'Gopay', phone: '(239) 555-0108', amount: -57000, state: 'Done' },
        { id: 'INV-1010', status: 'Debit', from: 'Paypal', phone: '(270) 555-0117', amount: 42000, state: 'Failed' },
        { id: 'INV-1006', status: 'Credit', from: 'Gopay', phone: '(603) 555-0123', amount: -17000, state: 'Done' },
    ];

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
                            <th className="pb-2">Status</th>
                            <th className="pb-2">Origem/Destino</th>
                            <th className="pb-2 text-right">Valor</th>
                            <th className="pb-2 text-right">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {transactions.map((tx, i) => (
                            <tr key={i} className="group">
                                <td className="py-3 pr-4 text-white font-medium border-b border-white/5 group-last:border-0">{tx.id}</td>
                                <td className="py-3 pr-4 border-b border-white/5 group-last:border-0">
                                    <span className="px-3 py-1 rounded-full bg-[#2A2A2A] text-gray-300 text-xs font-semibold">{tx.status === 'Credit' ? 'Crédito' : 'Débito'}</span>
                                </td>
                                <td className="py-3 pr-4 border-b border-white/5 group-last:border-0">
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">{tx.from}</span>
                                        <span className="text-gray-500 text-[10px]">{tx.phone}</span>
                                    </div>
                                </td>
                                <td className={`py-3 pr-4 text-right font-bold border-b border-white/5 group-last:border-0 ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.amount > 0 ? '+' : '-'}${Math.abs(tx.amount).toLocaleString()}
                                </td>
                                <td className="py-3 text-right border-b border-white/5 group-last:border-0">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block w-20 text-center
                                        ${tx.state === 'Done' ? 'bg-green-500/20 text-green-500' :
                                            tx.state === 'Pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                                'bg-red-500/20 text-red-500'}
                                    `}>
                                        {tx.state}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionHistory;
