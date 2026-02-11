import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const RecentIncome = ({ transactions = [] }) => {
    return (
        <div className="bg-[#1E1E1E] rounded-[32px] border border-white/5 p-6 flex flex-col">
            <h3 className="text-white font-bold mb-6">Recebimentos Recentes</h3>
            <div className="space-y-6">
                {transactions.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center">Nenhum recebimento recente.</p>
                ) : (
                    transactions.map((item, i) => (
                        <div key={item.id || i} className="flex items-center justify-between gap-4 group">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-transparent group-hover:border-green-500 transition-colors flex-shrink-0 flex items-center justify-center bg-green-500/10 text-green-500">
                                    <span className="text-lg font-bold">{item.description ? item.description.charAt(0).toUpperCase() : '?'}</span>
                                </div>
                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                    <p className="text-sm font-bold text-white leading-tight truncate w-full" title={item.description}>{item.description}</p>
                                    <p className="text-xs text-gray-500 truncate">{item.date ? new Date(item.date).toLocaleDateString('pt-BR') : 'Hoje'}</p>
                                </div>
                            </div>
                            <span className="text-green-500 font-bold bg-green-500/10 px-3 py-1 rounded-lg text-sm whitespace-nowrap flex-shrink-0">
                                +{formatCurrency(item.amount)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentIncome;
