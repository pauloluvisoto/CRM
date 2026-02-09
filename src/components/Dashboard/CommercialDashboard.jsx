import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Save, LayoutDashboard, RefreshCw, DollarSign } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import DraggableWidget from './DraggableWidget';
import { getSyncColor } from '../../utils/colors';

// Import Charts
import SalesTrendChart from './Charts/SalesTrendChart';
import PipelineFunnelChart from './Charts/PipelineFunnelChart';
import SourceDistributionChart from './Charts/SourceDistributionChart';
import ConversionRadialChart from './Charts/ConversionRadialChart';
// import ActivityHeatmapChart from './Charts/ActivityHeatmapChart'; // REMOVED
import CustomerGrowthChart from './Charts/CustomerGrowthChart';
import RevenueTargetChart from './Charts/RevenueTargetChart';
import RecentDealsList from './Charts/RecentDealsList';

const DEFAULT_LAYOUT = [
    { id: 'sales-trend', type: 'SALES_TREND', layout: { colSpan: { lg: 8 }, rowSpan: 1 } },
    { id: 'revenue-target', type: 'REVENUE_TARGET', layout: { colSpan: { lg: 4 }, rowSpan: 1 } },
    { id: 'pipeline-funnel', type: 'PIPELINE_FUNNEL', layout: { colSpan: { lg: 4 }, rowSpan: 2 } },
    { id: 'source-dist', type: 'SOURCE_DIST', layout: { colSpan: { lg: 4 }, rowSpan: 1 } },
    { id: 'recent-deals', type: 'RECENT_DEALS', layout: { colSpan: { lg: 4 }, rowSpan: 2 } },
    // { id: 'activity-heatmap', type: 'ACTIVITY_HEATMAP', layout: { colSpan: { lg: 4 }, rowSpan: 1 } }, // REMOVED
    { id: 'customer-growth', type: 'CUSTOMER_GROWTH', layout: { colSpan: { lg: 6 }, rowSpan: 1 } },
    { id: 'conversion-radial', type: 'CONVERSION_RADIAL', layout: { colSpan: { lg: 6 }, rowSpan: 1 } },
];

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const CommercialDashboard = ({ stats, trends = {}, dashboardMode = 'all', goals = null, selectedPeriod = 'thisMonth', deals = [], pipelines = [], selectedPipeline = 'all', onPipelineChange }) => {

    // --- STATE MANAGEMENT ---
    const [isEditing, setIsEditing] = useState(false);
    const [widgets, setWidgets] = useState(() => {
        try {
            const saved = localStorage.getItem('commercial_dashboard_layout_v2'); // Increment version to force reset if structure changed significantly
            return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
        } catch (e) {
            return DEFAULT_LAYOUT;
        }
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- PERSISTENCE ---
    useEffect(() => {
        localStorage.setItem('commercial_dashboard_layout_v2', JSON.stringify(widgets));
    }, [widgets]);

    const handleResetLayout = () => {
        if (window.confirm('Restaurar layout padrão?')) {
            setWidgets(DEFAULT_LAYOUT);
        }
    };

    // --- HANDLERS ---
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setWidgets((items) => {
                const oldIndex = items.findIndex(w => w.id === active.id);
                const newIndex = items.findIndex(w => w.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleResize = (id, dimension) => {
        setWidgets(items => items.map(w => {
            if (w.id !== id) return w;

            const newLayout = { ...w.layout };

            if (dimension === 'width') {
                // Cycle widths: 4 -> 6 -> 8 -> 12 -> 4
                const current = newLayout.colSpan?.lg || 4;
                const next = current === 4 ? 6 : current === 6 ? 8 : current === 8 ? 12 : 4;
                newLayout.colSpan = { lg: next };
            } else {
                // Cycle heights: 1 -> 2 -> 1
                const current = newLayout.rowSpan || 1;
                newLayout.rowSpan = current === 1 ? 2 : 1;
            }

            return { ...w, layout: newLayout };
        }));
    };

    // --- DATA PROCESSING (MEMOIZED) ---
    // 1. Sales Trend Data
    const salesTrendData = useMemo(() => {
        if (!deals.length) return [];
        const monthMap = {};
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${months[d.getMonth()]}`;
            monthMap[key] = { name: key, value: 0, sortDate: d };
        }
        deals.forEach(d => {
            const col = stats.columnColors?.[d.stage];
            if (col?.status === 'won') {
                const date = new Date(d.created_at);
                const key = months[date.getMonth()];
                if (monthMap[key]) monthMap[key].value += Number(d.faturamento_mensal) || 0;
            }
        });
        return Object.values(monthMap).sort((a, b) => a.sortDate - b.sortDate);
    }, [deals, stats]);

    // 2. Revenue Target
    const revenueTargetData = useMemo(() => {
        return salesTrendData.map(item => ({
            name: item.name,
            revenue: item.value,
            target: (goals?.revenue_goal / 12) || (item.value * 1.2)
        }));
    }, [salesTrendData, goals]);

    // 3. Consolidated Funnels
    const consolidatedFunnelsData = useMemo(() => {
        if (!deals.length || !pipelines.length || !stats.columnColors) return [];
        const targetPipelines = selectedPipeline === 'all' ? pipelines : pipelines.filter(p => p.id === selectedPipeline);

        return targetPipelines.map(pipe => {
            const stages = Object.values(stats.columnColors)
                .filter(col => col.pipelineId == pipe.id)
                .sort((a, b) => (a.position || 0) - (b.position || 0));
            if (stages.length === 0) return null;

            const data = stages.map(stage => {
                const stageDeals = deals.filter(d => d.stage == stage.id);
                const value = stageDeals.reduce((sum, d) => sum + (Number(d.faturamento_mensal) || 0), 0);

                // SAFE NAME RESOLUTION
                const rawName = stage.title || stage.name || `Stage ${stage.position}`;
                const safeName = String(rawName);

                return {
                    name: safeName,
                    // Fix 1: Name + Count
                    label: `${safeName} (${stageDeals.length})`,
                    value: value,
                    count: stageDeals.length,
                    fill: stage.color,
                    // Fix 2: Pass status for color override
                    status: stage.status,
                    customLabel: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
                };
            });
            return { id: pipe.id, name: pipe.name, data };
        }).filter(Boolean);
    }, [deals, pipelines, stats.columnColors, selectedPipeline]);

    // 4. Source Distribution
    const sourceData = useMemo(() => {
        const counts = {};
        deals.forEach(d => {
            const origin = d.origem || 'Desconhecido';
            counts[origin] = (counts[origin] || 0) + 1;
        });
        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
        return Object.entries(counts).map(([name, value], idx) => ({
            name, value, fill: COLORS[idx % COLORS.length]
        }));
    }, [deals]);

    // 5. Recent Deals (FIXED MAPPING & DAYS CALC)
    const recentDealsData = useMemo(() => {
        return deals
            .filter(d => !!d.created_at)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10)
            .map((d, index) => {
                // Fix 3: Map 'won' -> 'closed' for component compatibility
                const rawStatus = stats.columnColors?.[d.stage]?.status;
                let finalStatus = 'pending';
                if (rawStatus === 'won') finalStatus = 'closed';
                if (rawStatus === 'lost') finalStatus = 'lost';

                // Fix 4: Calculate Days Open
                const created = new Date(d.created_at);
                const now = new Date();
                const diffTime = Math.abs(now - created);
                const daysOpen = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Date Formatting (DD/MM)
                const formatDate = (dateStr) => {
                    if (!dateStr) return null;
                    const date = new Date(dateStr);
                    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                };

                const createdDate = formatDate(d.created_at);
                const closedDate = formatDate(d.data_fechamento); // Use actual closing date

                return {
                    id: d.id || index,
                    client: d.empresa_cliente || 'Sem Nome',
                    value: formatCurrency(d.faturamento_mensal || 0),
                    status: finalStatus,
                    daysOpen: daysOpen, // Number for the circle
                    createdDate: createdDate,
                    closedDate: closedDate,
                    pipelineLabel: d.tipo_pipeline === 'Receptivo' ? 'Inbound' : d.tipo_pipeline === 'Ativo_Diagnostico' ? 'Outbound' : d.tipo_pipeline,
                    subInfo: stats.columnColors?.[d.stage]?.title || d.stage
                };
            });
    }, [deals, stats.columnColors]);

    // 8. Customer Growth
    const customerGrowthData = useMemo(() => salesTrendData.map(item => ({ name: item.name, total: Math.floor(item.value / 1000) })), [salesTrendData]);


    // --- RENDER HELPERS ---
    const renderWidgetContent = (type) => {
        switch (type) {
            case 'SALES_TREND': return <SalesTrendChart data={salesTrendData} />;
            case 'REVENUE_TARGET': return <RevenueTargetChart data={revenueTargetData} />;
            case 'PIPELINE_FUNNEL':
                return (
                    <div className="flex flex-col gap-6 overflow-y-auto max-h-[520px] pr-2 custom-scrollbar h-full">
                        {consolidatedFunnelsData.length > 0 ? (
                            consolidatedFunnelsData.map((funnel) => (
                                <div key={funnel.id} className="w-full">
                                    <PipelineFunnelChart data={funnel.data} title={`Funil: ${funnel.name}`} />
                                </div>
                            ))
                        ) : (
                            <PipelineFunnelChart data={[]} title="Funil de Vendas" />
                        )}
                    </div>
                );
            case 'SOURCE_DIST': return <SourceDistributionChart data={sourceData} />;
            case 'RECENT_DEALS': return <RecentDealsList data={recentDealsData} />;

            case 'CUSTOMER_GROWTH': return <CustomerGrowthChart data={customerGrowthData} />;
            case 'CONVERSION_RADIAL':
                return <ConversionRadialChart
                    data={[
                        { name: 'Visitantes', uv: (stats.newLeads || 0) * 8, fill: '#1a3322' },
                        { name: 'Leads', uv: stats.newLeads || 0, fill: '#52525b' },
                        { name: 'Clientes', uv: stats.closedDeals || 0, fill: '#b4f03a' },
                    ]}
                />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col gap-6">

            {/* --- DASHBOARD HEADER & CONTROLS --- */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard Comercial</h1>
                    <p className="text-text-secondary text-sm">Visão geral da performance e indicadores chave.</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Controls */}
                    {isEditing && (
                        <button
                            onClick={handleResetLayout}
                            className="p-2 text-xs flex items-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
                        >
                            <RefreshCw size={14} /> Restaurar Padrão
                        </button>
                    )}

                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                            ${isEditing
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/5'}
                        `}
                    >
                        {isEditing ? (
                            <> <Save size={16} /> Salvar Layout </>
                        ) : (
                            <> <Settings size={16} /> Editar Dashboard </>
                        )}
                    </button>
                </div>
            </div>

            {/* --- DYNAMIC GRID --- */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-12 gap-6 auto-rows-[250px]">
                        {widgets.map((widget) => (
                            /* Force remove activity-heatmap from render if it remained in state somehow */
                            widget.id !== 'activity-heatmap' && (
                                <DraggableWidget
                                    key={widget.id}
                                    id={widget.id}
                                    layout={widget.layout}
                                    isEditing={isEditing}
                                    onResize={handleResize}
                                >
                                    {renderWidgetContent(widget.type)}
                                </DraggableWidget>
                            )
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="pb-8"></div>
        </div>
    );
};

export default CommercialDashboard;
