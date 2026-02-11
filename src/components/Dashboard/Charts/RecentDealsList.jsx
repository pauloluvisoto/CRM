import React from 'react';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const RecentDealsList = ({ data }) => {
    const deals = data || [
        { id: 1, client: 'TechSolutions Inc', value: 'R$ 15.000', status: 'closed', date: 'Hoje' },
        { id: 2, client: 'Global Logistics', value: 'R$ 8.500', status: 'pending', date: 'Ontem' },
        { id: 3, client: 'Alpha Marketing', value: 'R$ 4.200', status: 'negotiation', date: '2 dias' },
        { id: 4, client: 'Beta Corp', value: 'R$ 22.000', status: 'closed', date: '3 dias' },
    ];

    const getStatusInfo = (status) => {
        switch (status) {
            case 'closed': return {
                icon: <CheckCircle2 size={14} className="text-lime-500" />,
                color: 'text-lime-500',
                bg: 'bg-lime-500/10 border-lime-500/20 hover:bg-lime-500/20'
            };
            case 'lost': return {
                icon: <AlertCircle size={14} className="text-red-500" />,
                color: 'text-red-500',
                bg: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
            };
            default: return {
                icon: <Clock size={14} className="text-yellow-400" />,
                color: 'text-yellow-400',
                bg: 'bg-yellow-400/10 border-yellow-400/20 hover:bg-yellow-400/20'
            };
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#1E1E1E] border border-white/5 rounded-3xl p-6 hover:shadow-neon transition-all duration-500 group overflow-hidden">
            <div className="mb-4 flex justify-between items-center">
                <h3 className="text-text-secondary text-xs uppercase font-bold tracking-widest">Negócios Recentes</h3>
                <button className="text-xs text-brand hover:underline">Ver todos</button>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
                {deals.map(deal => {
                    const statusInfo = getStatusInfo(deal.status);
                    const isClosedOrLost = deal.status === 'closed' || deal.status === 'lost';

                    return (
                        <div key={deal.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors border cursor-pointer ${statusInfo.bg}`}>
                            <div className="flex items-center gap-3">
                                {/* AVATAR CIRCLE: Days Open (Active) OR Icon (Closed/Lost) */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${statusInfo.color} bg-black/20 ring-1 ring-white/10`}>
                                    {!isClosedOrLost ? (
                                        <span>{deal.daysOpen}d</span>
                                    ) : (
                                        statusInfo.icon // Show Icon inside circle for final states
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate text-shadow-sm">{deal.client}</p>
                                    <p className="text-[9px] text-text-secondary truncate flex items-center gap-1">
                                        <span>{deal.createdDate}</span>
                                        {deal.closedDate && isClosedOrLost && (
                                            <>
                                                <span className="text-white/20">→</span>
                                                <span className={deal.status === 'closed' ? 'text-lime-300' : 'text-red-300'}>
                                                    {deal.closedDate}
                                                </span>
                                            </>
                                        )}
                                        <span className="text-white/20">|</span>
                                        <span className={`uppercase font-bold ${statusInfo.color}`}>{deal.subInfo}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-xs font-bold ${statusInfo.color}`}>{deal.value}</p>
                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                    <span className="text-[9px] text-text-secondary uppercase tracking-wider font-semibold opacity-60">{deal.pipelineLabel}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecentDealsList;
