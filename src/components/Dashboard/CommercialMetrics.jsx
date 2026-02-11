import React, { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle2, TrendingUp, DollarSign, Target, ArrowRight } from 'lucide-react';

const CommercialMetrics = ({ stats, goals, loading }) => {
    const [lastUpdated, setLastUpdated] = useState({});

    // Glow effect logic when stats change
    useEffect(() => {
        if (stats) {
            // Simple check to trigger glow on key metrics
            setLastUpdated({
                'leads': true,
                'meetings': true,
                'sales': true,
                'revenue': true
            });
            const timer = setTimeout(() => setLastUpdated({}), 2000);
            return () => clearTimeout(timer);
        }
    }, [stats]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const calculatePercentage = (real, meta) => {
        if (!meta || meta === 0) return 0;
        return Math.min(((real / meta) * 100), 100).toFixed(1);
    };

    const MetricCard = ({ title, metaValue, realValue, icon: Icon, color = 'green', updateKey, isCurrency = false, subLabel = '' }) => {
        const percentage = calculatePercentage(realValue, metaValue);
        const isUpdating = lastUpdated[updateKey];
        const displayReal = isCurrency ? formatCurrency(realValue) : realValue;
        const displayMeta = isCurrency ? formatCurrency(metaValue) : metaValue;

        return (
            <div className={`bg-[#1E1E1E] border ${isUpdating ? `border-${color}-500 shadow-[0_0_15px_rgba(var(--${color}-rgb),0.3)]` : 'border-white/5'} rounded-2xl p-6 hover:border-white/10 transition-all duration-500 group`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-${color}-500/10 group-hover:bg-${color}-500/20 transition-colors`}>
                            <Icon className={`text-${color}-500`} size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-400">{title}</h3>
                            {subLabel && <span className="text-[10px] text-gray-600 uppercase tracking-wider">{subLabel}</span>}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Realizado</div>
                            <div className={`text-2xl font-bold text-white ${isUpdating ? 'animate-pulse' : ''}`}>
                                {displayReal}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500 mb-1">Meta</div>
                            <div className="text-sm font-semibold text-gray-400">{displayMeta}</div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">Progresso</span>
                            <span className={`text-xs font-bold ${Number(percentage) >= 100 ? `text-${color}-500` : 'text-gray-400'}`}>
                                {percentage}%
                            </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-${color}-500 transition-all duration-1000 ease-out`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-48 bg-[#1E1E1E] rounded-2xl border border-white/5"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* 1. LEADS (Inbound + Outbound) */}
            <MetricCard
                title="Novos Leads"
                realValue={stats.newLeads || 0}
                metaValue={goals?.visitors_goal || 1200} // Fallback or mapping
                icon={Users}
                color="blue"
                updateKey="leads"
                subLabel="Topo de Funil"
            />

            {/* 2. REUNIÕES (Agendadas/Realizadas) */}
            <MetricCard
                title="Reuniões Agendadas"
                realValue={stats.total_bi?.meetings_total || 0}
                metaValue={goals?.meetings_goal || 80}
                icon={Calendar}
                color="purple"
                updateKey="meetings"
                subLabel="Qualificação"
            />

            {/* 3. VENDAS (Deals Won) */}
            <MetricCard
                title="Vendas Realizadas"
                realValue={stats.closedDeals || 0}
                metaValue={goals?.deals_goal || 20}
                icon={CheckCircle2}
                color="green"
                updateKey="sales"
                subLabel="Fechamento"
            />

            {/* 4. RECEITA E TICKET */}
            <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-500 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-emerald-500/10">
                            <DollarSign className="text-emerald-500" size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-400">Receita & Ticket</h3>
                    </div>

                    <div className="space-y-1 mb-4">
                        <div className="text-2xl font-bold text-white tracking-tight">
                            {formatCurrency(stats.totalRevenue)}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <TrendingUp size={12} className="text-emerald-500" />
                            <span className="text-emerald-500 font-bold">Ticket Médio: {formatCurrency(stats.avgTicket)}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5 mt-auto">
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                        <span>Meta de Faturamento</span>
                        <span>{formatCurrency(goals?.revenue_goal || 50000)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                            style={{ width: `${Math.min(((stats.totalRevenue / (goals?.revenue_goal || 50000)) * 100), 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommercialMetrics;
