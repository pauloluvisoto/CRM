import React, { useState, useEffect } from 'react';
import { Users, Activity, BarChart2, DollarSign, Target, TrendingUp } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import StatCard from './StatCard';
import SortableStatCard from './SortableStatCard';
import { getSyncColor } from '../../utils/colors';

const CommercialDashboard = ({ stats, trends = {}, dashboardMode = 'all', goals = null, selectedPeriod = 'thisMonth' }) => {
    const [cardOrder, setCardOrder] = useState(() => {
        const saved = localStorage.getItem('commercial_dashboard_order');
        const initial = saved ? JSON.parse(saved) : [
            'meetings-done', 'conversion-rate', 'lead-to-meeting',
            'no-show', 'meeting-to-sale', 'pipeline-value', 'sales-lost'
        ];
        return initial.filter(id => id !== 'new-leads');
    });

    const [cardConfigs, setCardConfigs] = useState(() => {
        const saved = localStorage.getItem('commercial_dashboard_configs');
        return saved ? JSON.parse(saved) : {};
    });

    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const updateCardConfig = (id, newConfig) => {
        const updated = { ...cardConfigs, [id]: { ...(cardConfigs[id] || { mode: 'data', size: '1x1' }), ...newConfig } };
        setCardConfigs(updated);
        localStorage.setItem('commercial_dashboard_configs', JSON.stringify(updated));
    };

    const getTrendLabel = () => {
        switch (selectedPeriod) {
            case '7d': return 'vs. 7d anteriores';
            case 'thisMonth': return 'vs. mês anterior';
            case 'thisYear': return 'vs. ano anterior';
            case 'custom': return 'vs. período anterior';
            default: return 'vs. período anterior';
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const getColColor = (id, fallback) => {
        if (stats.columnColors && stats.columnColors[id]) {
            return getSyncColor(stats.columnColors[id].name, stats.columnColors[id].color);
        }
        return getSyncColor(id, fallback);
    };

    const handleDragStart = (event) => setActiveId(event.active.id);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setCardOrder((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('commercial_dashboard_order', JSON.stringify(newOrder));
                return newOrder;
            });
        }
        setActiveId(null);
    };

    const getCardProps = (id) => {
        const biScope = dashboardMode === 'inbound' ? 'inbound' :
            dashboardMode === 'outbound' ? 'outbound' :
                'total_bi';

        const bi = stats[biScope];

        const config = cardConfigs[id] || { mode: 'data', size: '1x1' };

        const baseProps = {
            id,
            mode: config.mode,
            size: config.size,
            onConfigChange: (newConfig) => updateCardConfig(id, newConfig),
            trendLabel: getTrendLabel()
        };

        const calcRate = (num, den) => {
            if (!den || den === 0) return "0,00";
            return ((num / den) * 100).toFixed(2).replace('.', ',');
        };

        switch (id) {
            case 'new-leads':
                return {
                    ...baseProps,
                    title: "Novos Leads",
                    value: stats.newLeads,
                    icon: Users,
                    color: getColColor('receptivo_lead', '#3b82f6'),
                    isHex: true,
                    goal: goals?.leads_goal,
                    trend: trends.newLeads?.trend,
                    trendValue: trends.newLeads?.value,
                    previousValue: (trends.newLeads?.prevValue || 0).toString()
                };
            case 'meetings-done':
                return {
                    ...baseProps,
                    title: "Reuniões Efetuadas",
                    value: `${calcRate(bi?.meetings_done, bi?.meetings_total)}%`,
                    icon: BarChart2,
                    color: getSyncColor('REUNIÃO AGENDADA', '#6366f1'),
                    isHex: true,
                    goal: goals?.meetings_goal,
                    numericValue: bi?.meetings_done || 0,
                    subValue: `${bi?.meetings_done || 0} de ${bi?.meetings_total || 0}`,
                    sideBySide: true,
                    trend: trends[`${biScope}_meetings_done`]?.trend,
                    trendValue: trends[`${biScope}_meetings_done`]?.value,
                    previousValue: (trends[`${biScope}_meetings_done`]?.prevValue || 0).toString()
                };
            case 'conversion-rate':
                return {
                    ...baseProps,
                    title: "TAXA DE CONVERSÃO GERAL",
                    value: `${calcRate(stats.closedDeals, stats.newLeads)}%`,
                    icon: Activity,
                    color: getSyncColor('EM FOLLOW UP', '#a855f7'),
                    isHex: true,
                    numericValue: stats.closedDeals || 0,
                    trend: trends.conversionRate?.trend,
                    trendValue: trends.conversionRate?.value,
                    subValue: `${stats.closedDeals || 0} de ${stats.newLeads || 0}`,
                    sideBySide: true,
                    previousValue: `${(trends.conversionRate?.prevValue || 0).toFixed(2).replace('.', ',')}%`
                };
            case 'lead-to-meeting':
                return {
                    ...baseProps,
                    title: "AGENDAMENTOS EFETUADOS",
                    value: `${Number(bi?.conv1 || 0).toFixed(2).replace('.', ',')}%`,
                    icon: TrendingUp,
                    color: dashboardMode === 'inbound' ? getColColor('receptivo_agendada', '#ec4899') :
                        dashboardMode === 'outbound' ? getColColor('ativo_rvp', '#8b5cf6') : "#3b82f6",
                    isHex: true,
                    goal: goals?.lead_to_meeting_goal,
                    subValue: `${bi?.meetings_total || 0} de ${bi?.count || 0}`,
                    sideBySide: true,
                    trend: trends[`${biScope}_conv1`]?.trend,
                    trendValue: trends[`${biScope}_conv1`]?.value,
                    previousValue: `${(trends[`${biScope}_conv1`]?.prevValue || 0).toFixed(2).replace('.', ',')}%`
                };
            case 'no-show':
                return {
                    ...baseProps,
                    title: "Taxa de No-Show",
                    value: `${Number(bi?.noshowRate || 0).toFixed(2).replace('.', ',')}%`,
                    icon: Activity,
                    color: getSyncColor('NO SHOW', '#ef4444'),
                    isHex: true,
                    goal: goals?.no_show_rate_goal,
                    subValue: `${bi?.noshow || 0} de ${bi?.meetings_total || 0}`,
                    sideBySide: true,
                    trend: trends[`${biScope}_noshowRate`]?.trend,
                    trendValue: trends[`${biScope}_noshowRate`]?.value,
                    previousValue: `${(trends[`${biScope}_noshowRate`]?.prevValue || 0).toFixed(2).replace('.', ',')}%`
                };
            case 'meeting-to-sale':
                return {
                    ...baseProps,
                    title: "NEGÓCIO FECHADO APÓS REUNIÃO",
                    value: `${Number(bi?.conv2 || 0).toFixed(2).replace('.', ',')}%`,
                    icon: Target,
                    color: dashboardMode === 'inbound' ? getColColor('receptivo_fechamento', '#10b981') :
                        dashboardMode === 'outbound' ? getColColor('ativo_followup', '#10b981') : "#10b981",
                    isHex: true,
                    goal: goals?.meeting_to_sale_goal,
                    subValue: `${bi?.wonCount || 0} de ${bi?.meetings_done || 0}`,
                    sideBySide: true,
                    trend: trends[`${biScope}_conv2`]?.trend,
                    trendValue: trends[`${biScope}_conv2`]?.value,
                    previousValue: `${(trends[`${biScope}_conv2`]?.prevValue || 0).toFixed(2).replace('.', ',')}%`
                };
            case 'pipeline-value':
                return {
                    ...baseProps,
                    title: "Leads em Pipeline",
                    value: stats.newLeads || 0,
                    icon: TrendingUp,
                    color: "#3b82f6",
                    isHex: true,
                    subValue: formatCurrency(stats.forecast || 0),
                    sideBySide: true,
                    trend: trends.forecast?.trend,
                    trendValue: trends.forecast?.value,
                    previousValue: (trends.newLeads?.prevValue || 0).toString()
                };
            case 'sales-lost':
                return {
                    ...baseProps,
                    title: "Vendas Perdidas",
                    value: formatCurrency(stats.lostRevenue || 0),
                    icon: DollarSign,
                    color: "#ef4444",
                    isHex: true,
                    subValue: `${stats.lostDeals || 0} Negócios perdidos`,
                    trend: trends.lostRevenue?.trend,
                    trendValue: trends.lostRevenue?.value,
                    previousValue: formatCurrency(trends.lostRevenue?.prevValue || 0)
                };
            default: return null;
        }
    };

    const sectionTitle = dashboardMode === 'all' ? 'Performance Geral (Consolidado)' :
        dashboardMode === 'inbound' ? 'Performance Inbound (Lead \u2192 RVP \u2192 Ganho)' :
            'Performance Outbound (Prospect \u2192 RVP \u2192 Ganho)';

    return (
        <div className="dashboard-grid">
            <h3 className="section-header">{sectionTitle}</h3>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
                    <div className="stats-grid">
                        {cardOrder.map(id => {
                            const props = getCardProps(id);
                            if (!props) return null;
                            return <SortableStatCard key={id} {...props} />;
                        })}
                    </div>
                </SortableContext>
                <DragOverlay>
                    {activeId && getCardProps(activeId) ? <StatCard {...getCardProps(activeId)} /> : null}
                </DragOverlay>
            </DndContext>

            <style>{`
                .dashboard-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .section-header {
                    font-size: 0.95rem;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    padding-bottom: 0.5rem;
                    margin-top: 0.5rem;
                }
                .section-header::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: linear-gradient(90deg, rgba(255,255,255,0.1), transparent);
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(12, 1fr);
                    grid-auto-rows: 1fr;
                    gap: 1.5rem;
                }
                .sortable-stat-card { grid-column: span 3; } /* Default 1x (3/12) -> 4 per row */
                .sortable-stat-card.size-1-3x1 { grid-column: span 4; } /* 1.3x (4/12) -> 3 per row (Uniform) */
                .sortable-stat-card.size-1-5x1 { grid-column: span 4; } /* Mapping 1.5 to 4 as well for safety */
                .sortable-stat-card.size-2x1 { grid-column: span 6; } /* 2x (6/12) -> 2 per row */
                .sortable-stat-card.size-3x1 { grid-column: span 9; } /* 3x (9/12) */
                .sortable-stat-card.size-4x1 { grid-column: span 12; } /* 4x (12/12) -> Full */
                .sortable-stat-card.size-8x1 { grid-column: span 12; } /* 8x (12/12) -> Full */
            `}</style>
        </div>
    );
};

export default CommercialDashboard;
