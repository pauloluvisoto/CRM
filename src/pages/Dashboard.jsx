import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAccessibleUserIds } from '../utils/rbac';
import { supabase } from '../lib/supabaseClient';
import CommercialDashboard from '../components/Dashboard/CommercialDashboard';
import FinancialDashboard from '../components/Dashboard/FinancialDashboard';
import PeriodFilter from '../components/Dashboard/PeriodFilter';
import GoalsModal from '../components/Dashboard/GoalsModal';
import { Target, Filter, ChevronDown } from 'lucide-react';

const PRODUCT_VALUE = 597;

const Dashboard = () => {
    const [loading, setLoading] = useState(false); // Start as false, or handled by initial fetch
    const [initializing, setInitializing] = useState(true);

    const { user, role, isAdmin, isSupervisor } = useAuth(); // RBAC

    // Pipeline Selection State
    const [pipelines, setPipelines] = useState([]);
    const [selectedPipeline, setSelectedPipeline] = useState('all');
    const [selectedPeriod, setSelectedPeriod] = useState('thisMonth'); // Default: Mês Atual
    const [customDates, setCustomDates] = useState({ start: '', end: '' });
    const [dashboardMode, setDashboardMode] = useState('all'); // all | inbound | outbound
    const [showGoalsModal, setShowGoalsModal] = useState(false);
    const [showPipelineDropdown, setShowPipelineDropdown] = useState(false);
    const [userGoals, setUserGoals] = useState(null);

    const [stats, setStats] = useState({
        newLeads: 0,
        activeDeals: 0,
        closedDeals: 0,
        lostDeals: 0,
        totalRevenue: 0,
        lostRevenue: 0,
        avgTicket: 0,
        forecast: 0,
        conversionRate: 0,
        // BI Specific - Extended Metrics
        inbound: { count: 0, conv1: 0, noshow: 0, noshowRate: 0, conv2: 0 },
        outbound: { count: 0, conv1: 0, noshow: 0, noshowRate: 0, conv2: 0 },
        total_bi: { count: 0, conv1: 0, noshow: 0, noshowRate: 0, conv2: 0 }
    });

    const [chartData, setChartData] = useState([]);
    const [trends, setTrends] = useState({});
    const [previousStats, setPreviousStats] = useState(null);

    useEffect(() => {
        const init = async () => {
            await fetchPipelines();
            if (user?.id) await fetchUserGoals();
            setInitializing(false);
        };
        init();
    }, [user?.id]);

    useEffect(() => {
        if (pipelines.length > 0) {
            fetchDashboardData();
        } else if (!initializing) {
            setLoading(false);
        }
    }, [user, isAdmin, isSupervisor, selectedPipeline, pipelines, selectedPeriod, customDates, initializing, dashboardMode]);

    // Trend calculation effect
    useEffect(() => {
        if (stats && previousStats) {
            const calculateTrends = () => {
                const t = {};

                // Helper for nested BI trends
                const calculateBITrends = (scope) => {
                    const current = stats[scope] || {};
                    const previous = previousStats[scope] || {};

                    const metrics = [
                        { key: 'count', trendKey: `${scope}_count` },
                        { key: 'meetings_done', trendKey: `${scope}_meetings_done` },
                        { key: 'wonCount', trendKey: `${scope}_wonCount` },
                        { key: 'conv1', trendKey: `${scope}_conv1` },
                        { key: 'conv2', trendKey: `${scope}_conv2` },
                        { key: 'noshowRate', trendKey: `${scope}_noshowRate` }
                    ];

                    metrics.forEach(m => {
                        const cur = Number(current[m.key]) || 0;
                        const prev = Number(previous[m.key]) || 0;

                        t[m.trendKey] = {
                            trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
                            value: prev === 0 ? 'Novo' : `${diff > 0 ? '+' : ''}${percent.toFixed(1)}%`,
                            absoluteDiff: diff,
                            prevValue: prev
                        };
                    });
                };

                // General metrics
                const keys = ['newLeads', 'activeDeals', 'closedDeals', 'lostDeals', 'totalRevenue', 'lostRevenue', 'avgTicket', 'forecast', 'conversionRate'];
                keys.forEach(k => {
                    const cur = Number(stats[k]) || 0;
                    const prev = Number(previousStats[k]) || 0;
                    t[k] = {
                        trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
                        value: prev === 0 ? (cur > 0 ? 'Novo' : '0%') : `${diff > 0 ? '+' : ''}${percent.toFixed(1)}%`,
                        absoluteDiff: diff,
                        prevValue: prev
                    };
                });

                // Calculate BI trends for all scopes
                calculateBITrends('inbound');
                calculateBITrends('outbound');
                calculateBITrends('total_bi');

                setTrends(t);
            };
            calculateTrends();
        }
    }, [stats, previousStats]);

    useEffect(() => {
        if (pipelines.length > 0) {
            fetchPreviousMonthSnapshot();
        }
    }, [selectedPipeline, selectedPeriod, pipelines]);

    const handleCustomDateChange = (field, value) => {
        setCustomDates(prev => ({ ...prev, [field]: value }));
    };

    const fetchUserGoals = async () => {
        try {
            const today = new Date();
            const month = today.getMonth() + 1;
            const year = today.getFullYear();

            const { data, error } = await supabase
                .from('user_goals')
                .select('*')
                .eq('user_id', user.id)
                .eq('month', month)
                .eq('year', year)
                .maybeSingle();

            if (data) setUserGoals(data);
        } catch (err) {
            console.error('Error fetching goals:', err);
        }
    };

    const fetchPipelines = async () => {
        try {
            const { data, error } = await supabase.from('pipelines').select('*').order('created_at');
            if (error) throw error;
            const pipelineData = data || [];
            setPipelines(pipelineData);
            if (pipelineData.length > 0) {
                setSelectedPipeline('all');
            }
        } catch (err) {
            console.error('Error fetching pipelines:', err);
        }
    };

    const fetchPreviousMonthSnapshot = async () => {
        try {
            const today = new Date();
            let comparisonDate;

            switch (selectedPeriod) {
                case '7d':
                    comparisonDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14);
                    break;
                case 'thisMonth':
                    comparisonDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    break;
                case 'thisYear':
                    comparisonDate = new Date(today.getFullYear() - 1, 0, 1);
                    break;
                default:
                    comparisonDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            }

            const comparisonDateStr = comparisonDate.toISOString().split('T')[0];

            let query = supabase
                .from('dashboard_snapshots')
                .select('*')
                .eq('snapshot_date', comparisonDateStr)
                .eq('scope', 'all');

            if (selectedPipeline !== 'all') {
                query = query.eq('pipeline_id', selectedPipeline);
            } else {
                query = query.is('pipeline_id', null);
            }

            const { data, error } = await query.maybeSingle();
            if (error) {
                console.error('Error fetching previous snapshot:', error);
            }

            // Fallback for trends if no snapshot: attempt to fetch prev month data manually or just set null
            setPreviousStats(data || null);
        } catch (err) {
            console.error('Error in fetchPreviousMonthSnapshot:', err);
        }
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Calculate date range
            const getDateRange = () => {
                const today = new Date();
                let startDate;
                let endDate = today;

                switch (selectedPeriod) {
                    case '7d':
                        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
                        break;
                    case 'thisMonth':
                        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                        break;
                    case 'thisYear':
                        startDate = new Date(today.getFullYear(), 0, 1);
                        break;
                    case 'custom':
                        startDate = customDates.start ? new Date(customDates.start) : null;
                        endDate = customDates.end ? new Date(customDates.end) : today;
                        break;
                    default:
                        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
                }

                return { start: startDate, end: endDate };
            };

            const dateRange = getDateRange();

            // Fetch Deals from central_vendas for BI sync
            let query = supabase.from('central_vendas').select('*');

            const accessibleIds = await getAccessibleUserIds(user, role);
            if (accessibleIds) {
                query = query.in('created_by', accessibleIds);
            }

            if (dateRange.start) {
                query = query.gte('created_at', dateRange.start.toISOString());
            }
            if (dateRange.end) {
                query = query.lte('created_at', dateRange.end.toISOString());
            }

            const { data: deals, error: dError } = await query;
            if (dError) throw dError;

            // Fetch ALL columns for ID mapping and color binding - USING pipeline_stages
            const { data: columns, error: cError } = await supabase.from('pipeline_stages').select('*').order('position');
            if (cError) throw cError;

            // Status keyword mapping for general KPIs
            const wonKeywords = ['ganho', 'ganha', 'fechado', 'vendido', 'won', 'fechamento', 'sucesso', 'assinativo'];
            const lostKeywords = ['perdido', 'perdida', 'lost', 'cancelado', 'descartado', 'perda'];

            const getStatus = (colName) => {
                const t = colName.toLowerCase();
                if (wonKeywords.some(k => t.includes(k))) return 'won';
                if (lostKeywords.some(k => t.includes(k))) return 'lost';
                return 'active';
            };

            const colMap = {};
            const pipelinesInStages = [...new Set(columns.map(c => c.pipeline_id))];
            const lastColIds = pipelinesInStages.map(pid => {
                const pipeCols = columns.filter(c => c.pipeline_id === pid).sort((a, b) => a.position - b.position);
                return pipeCols.length > 0 ? pipeCols[pipeCols.length - 1].id : null;
            }).filter(Boolean);

            columns.forEach(c => {
                const isLastCol = lastColIds.includes(c.id);
                colMap[c.id] = {
                    title: c.name, // pipeline_stages uses 'name'
                    status: isLastCol ? 'won' : getStatus(c.name),
                    color: c.color,
                    pipelineId: c.pipeline_id,
                    position: c.position
                };
            });

            // BI SPECIFIC AGGREGATION
            let wonCount = 0; let wonValue = 0;
            let lostCount = 0; let lostValue = 0;
            let activeCount = 0; let activeValue = 0;

            const BI_COUNTS = {
                inbound_lead: 0,
                inbound_meeting: 0,
                inbound_noshow: 0,
                inbound_won: 0,
                outbound_prospect: 0,
                outbound_meeting: 0,
                outbound_noshow: 0,
                outbound_won: 0
            };

            const meetingKeywords = ['agendada', 'reunião', 'rvp', 'meeting', 'visit', 'apresenta', 'diagnóstico'];
            const noShowKeywords = ['no show', 'nocompareceu', 'falta', 'ausente'];

            deals.forEach(d => {
                const col = colMap[d.stage];
                const val = Number(d.faturamento_mensal) || PRODUCT_VALUE; // Default to 597

                if (!col) {
                    // Fail-safe for unknown stages (might be from deleted pipelines)
                    return;
                }

                // Global Dashboard Mode Filter
                if (dashboardMode === 'inbound' && d.tipo_pipeline !== 'Receptivo') return;
                if (dashboardMode === 'outbound' && d.tipo_pipeline !== 'Ativo_Diagnostico') return;

                // Selective pipeline view filter
                if (selectedPipeline !== 'all' && col.pipelineId !== selectedPipeline) return;

                // KPI Status Tracking
                if (col.status === 'won') { wonCount++; wonValue += val; }
                else if (col.status === 'lost') { lostCount++; lostValue += val; }
                else { activeCount++; activeValue += val; }

                // DYNAMIC BI MAPPING (Resilient to custom IDs)
                const colTitle = (col.title || '').toLowerCase();
                const isMeeting = meetingKeywords.some(k => colTitle.includes(k)) || (col.position >= 2 && col.position <= 5); // Heuristic for mid-funnel
                const isNoShow = noShowKeywords.some(k => colTitle.includes(k));
                const isWon = col.status === 'won';

                // Categorize by Pipeline Type (matches central_vendas.tipo_pipeline)
                if (d.tipo_pipeline === 'Receptivo') {
                    BI_COUNTS.inbound_lead++;
                    if (isMeeting || isNoShow || isWon) BI_COUNTS.inbound_meeting++;
                    if (isNoShow) BI_COUNTS.inbound_noshow++;
                    if (isWon) BI_COUNTS.inbound_won++;
                } else if (d.tipo_pipeline === 'Ativo_Diagnostico') {
                    BI_COUNTS.outbound_prospect++;
                    if (isMeeting || isNoShow || isWon) BI_COUNTS.outbound_meeting++;
                    if (isNoShow) BI_COUNTS.outbound_noshow++;
                    if (isWon) BI_COUNTS.outbound_won++;
                }
            });

            const totalDealsForCalc = deals.filter(d => {
                const col = colMap[d.stage];
                if (!col) return false;

                // FILTER BY DASHBOARD MODE (Inbound/Outbound/All)
                if (dashboardMode === 'inbound' && d.tipo_pipeline !== 'Receptivo') return false;
                if (dashboardMode === 'outbound' && d.tipo_pipeline !== 'Ativo_Diagnostico') return false;

                return (selectedPipeline === 'all' || col.pipelineId === selectedPipeline);
            }).length;

            // Calculate Conversions
            const calcConv = (b, a) => (a > 0 ? ((b / a) * 100).toFixed(1) : 0);

            setStats({
                newLeads: BI_COUNTS.inbound_lead + BI_COUNTS.outbound_prospect,
                activeDeals: activeCount,
                closedDeals: wonCount,
                lostDeals: lostCount,
                totalRevenue: wonValue,
                lostRevenue: lostValue,
                avgTicket: wonCount > 0 ? (wonValue / wonCount) : 0,
                forecast: activeValue,
                conversionRate: totalDealsForCalc > 0 ? ((wonCount / totalDealsForCalc) * 100).toFixed(1) : 0,
                inbound: {
                    count: BI_COUNTS.inbound_lead,
                    meetings_total: BI_COUNTS.inbound_meeting,
                    conv1: calcConv(BI_COUNTS.inbound_meeting, BI_COUNTS.inbound_lead),
                    noshow: BI_COUNTS.inbound_noshow,
                    noshowRate: calcConv(BI_COUNTS.inbound_noshow, BI_COUNTS.inbound_meeting),
                    meetings_done: BI_COUNTS.inbound_meeting - BI_COUNTS.inbound_noshow,
                    wonCount: BI_COUNTS.inbound_won,
                    conv2: calcConv(BI_COUNTS.inbound_won, (BI_COUNTS.inbound_meeting - BI_COUNTS.inbound_noshow))
                },
                outbound: {
                    count: BI_COUNTS.outbound_prospect,
                    meetings_total: BI_COUNTS.outbound_meeting,
                    conv1: calcConv(BI_COUNTS.outbound_meeting, BI_COUNTS.outbound_prospect),
                    noshow: BI_COUNTS.outbound_noshow,
                    noshowRate: calcConv(BI_COUNTS.outbound_noshow, BI_COUNTS.outbound_meeting),
                    meetings_done: BI_COUNTS.outbound_meeting - BI_COUNTS.outbound_noshow,
                    wonCount: BI_COUNTS.outbound_won,
                    conv2: calcConv(BI_COUNTS.outbound_won, (BI_COUNTS.outbound_meeting - BI_COUNTS.outbound_noshow))
                },
                total_bi: {
                    count: BI_COUNTS.inbound_lead + BI_COUNTS.outbound_prospect,
                    wonCount: BI_COUNTS.inbound_won + BI_COUNTS.outbound_won,
                    noshow: BI_COUNTS.inbound_noshow + BI_COUNTS.outbound_noshow,
                    meetings_total: (BI_COUNTS.inbound_meeting + BI_COUNTS.outbound_meeting),
                    meetings_done: (BI_COUNTS.inbound_meeting + BI_COUNTS.outbound_meeting) - (BI_COUNTS.inbound_noshow + BI_COUNTS.outbound_noshow),
                    conv1: calcConv(BI_COUNTS.inbound_meeting + BI_COUNTS.outbound_meeting, BI_COUNTS.inbound_lead + BI_COUNTS.outbound_prospect),
                    noshowRate: calcConv(BI_COUNTS.inbound_noshow + BI_COUNTS.outbound_noshow, BI_COUNTS.inbound_meeting + BI_COUNTS.outbound_meeting),
                    conv2: calcConv(BI_COUNTS.inbound_won + BI_COUNTS.outbound_won, (BI_COUNTS.inbound_meeting + BI_COUNTS.outbound_meeting) - (BI_COUNTS.inbound_noshow + BI_COUNTS.outbound_noshow))
                },
                columnColors: colMap // Access to colors
            });

            // CHART DATA: Value by Stage
            // BUILD FLOW / FUNNEL DATA (Deduplicated)
            const uniqueCols = Array.from(new Map(columns.map(c => [c.id, c])).values());

            const flowStages = uniqueCols
                .filter(c => selectedPipeline === 'all' || c.pipeline_id === selectedPipeline)
                .map(c => {
                    const stageDeals = deals.filter(d => d.stage === c.id);
                    const stageValue = stageDeals.reduce((sum, d) => sum + (parseFloat(d.faturamento_mensal) || 0), 0);
                    return {
                        id: c.id + '-' + c.pipeline_id,
                        label: c.name,
                        value: stageValue
                    };
                });

            setChartData(flowStages || []);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (initializing || loading) {
        return (
            <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <span>Carregando Dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container dashboard-page">
            <div className="page-header">
                <div className="flex flex-col gap-1">
                    <h1>Dashboard</h1>
                    <div className="pipeline-dropdown-container">
                        <button
                            className="pipeline-dropdown-btn"
                            onClick={() => setShowPipelineDropdown(!showPipelineDropdown)}
                        >
                            <Filter size={16} />
                            <span>
                                {selectedPipeline !== 'all'
                                    ? pipelines.find(p => p.id === selectedPipeline)?.name
                                    : dashboardMode === 'all' ? 'VISÃO GERAL'
                                        : dashboardMode === 'inbound' ? 'INBOUND (TOTAL)'
                                            : 'OUTBOUND (TOTAL)'}
                            </span>
                            <ChevronDown
                                size={14}
                                style={{ transform: showPipelineDropdown ? 'rotate(180deg)' : 'none', transition: '0.2s' }}
                            />
                        </button>

                        {showPipelineDropdown && (
                            <div className="pipeline-dropdown-menu">
                                <div className="dropdown-section">CONSOLIDADO</div>
                                <button
                                    className={`dropdown-item ${dashboardMode === 'all' && selectedPipeline === 'all' ? 'active' : ''}`}
                                    onClick={() => { setDashboardMode('all'); setSelectedPipeline('all'); setShowPipelineDropdown(false); }}
                                >
                                    Visão Geral
                                </button>

                                <div className="dropdown-section">PIPELINES ESPECÍFICOS</div>
                                {pipelines.map(p => (
                                    <button
                                        key={p.id}
                                        className={`dropdown-item ${selectedPipeline === p.id ? 'active' : ''}`}
                                        onClick={() => { setSelectedPipeline(p.id); setDashboardMode('all'); setShowPipelineDropdown(false); }}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="btn-goals"
                        onClick={() => setShowGoalsModal(true)}
                        title="Definir Metas Mensais"
                    >
                        <Target size={18} /> Metas
                    </button>
                    <PeriodFilter
                        selectedPeriod={selectedPeriod}
                        onPeriodChange={setSelectedPeriod}
                        customDates={customDates}
                        onCustomDateChange={handleCustomDateChange}
                    />
                </div>
            </div>

            <GoalsModal
                isOpen={showGoalsModal}
                onClose={() => setShowGoalsModal(false)}
                userId={user?.id}
                goals={userGoals}
                onGoalsUpdated={(newGoals) => setUserGoals(newGoals)}
            />

            <CommercialDashboard
                stats={stats}
                chartData={chartData}
                pipelines={pipelines}
                selectedPipeline={selectedPipeline}
                onPipelineChange={setSelectedPipeline}
                trends={trends}
                dashboardMode={dashboardMode}
                goals={userGoals}
                selectedPeriod={selectedPeriod}
            />

            <style>{`
                .dashboard-page {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.5rem;
                }
                .btn-goals {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(190, 242, 100, 0.1);
                    color: #bef264;
                    border: 1px solid rgba(190, 242, 100, 0.2);
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-goals:hover {
                    background: #bef264;
                    color: black;
                    box-shadow: 0 4px 12px rgba(190, 242, 100, 0.2);
                }
                .pipeline-dropdown-container {
                    position: relative;
                    margin-top: 8px;
                    z-index: 100;
                }
                .pipeline-dropdown-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 10px 20px;
                    border-radius: 14px;
                    color: var(--text-primary);
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .pipeline-dropdown-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .pipeline-dropdown-menu {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    background: #1a1b26;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 8px;
                    min-width: 240px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    backdrop-filter: blur(10px);
                }
                .dropdown-section {
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: rgba(255, 255, 255, 0.3);
                    padding: 8px 12px 4px 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
                .dropdown-item {
                    padding: 10px 12px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    font-weight: 500;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .dropdown-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                }
                .dropdown-item.active {
                    background: #bef264;
                    color: #000;
                    font-weight: 700;
                }
                .view-toggle {
                    display: flex;
                    background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.8) 100%);
                    padding: 0.375rem;
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }
                .toggle-btn {
                    padding: 0.625rem 1.25rem;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .toggle-btn.active {
                    background: linear-gradient(135deg, #bef264 0%, #a3e635 100%);
                    color: #1a1a1a;
                    box-shadow: 0 4px 12px rgba(190, 242, 100, 0.3);
                }
                .toggle-btn:hover:not(.active) {
                    color: var(--text-primary);
                    background: rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
