import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAccessibleUserIds } from '../utils/rbac';
import { supabase } from '../lib/supabaseClient';
import { businessPlanService } from '../services/businessPlanService';
import CommercialDashboard from '../components/Dashboard/CommercialDashboard';

import PeriodFilter from '../components/Dashboard/PeriodFilter';
import CommercialMetrics from '../components/Dashboard/CommercialMetrics';
import { Target, Filter, ChevronDown, Zap } from 'lucide-react';

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
    const [deals, setDeals] = useState([]);
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
            // 1. Fetch Unified Goals from Business Plan Service
            console.log('Fetching unified goals...');
            const bpMetrics = await businessPlanService.getMetrics();
            console.log('BP Metrics received:', bpMetrics);

            // 2. Map BP Metrics to Dashboard Goals structure
            if (bpMetrics && bpMetrics.commercial) {
                console.log('Using Unified Goals:', bpMetrics.commercial);
                const unifiedGoals = {
                    visitors_goal: bpMetrics.commercial.leads,
                    meetings_goal: bpMetrics.commercial.meetings,
                    deals_goal: bpMetrics.commercial.sales,
                    revenue_goal: bpMetrics.receitas.total.bp,
                    ticket_goal: bpMetrics.commercial.ticket
                };
                setUserGoals(unifiedGoals);
                return; // successfully set, exit
            } else {
                console.warn('BP Metrics missing commercial data, falling back...');
            }

            // Fallback to old user_goals if BP service fails or is empty (Legacy support)
            const today = new Date();
            const month = today.getMonth() + 1;
            const year = today.getFullYear();
            const { data } = await supabase
                .from('user_goals')
                .select('*')
                .eq('user_id', user.id)
                .eq('month', month)
                .eq('year', year)
                .maybeSingle();

            if (data) {
                console.log('Using Fallback SQL Goals:', data);
                setUserGoals(data);
            }
        } catch (err) {
            console.error('Error fetching unified goals:', err);
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

            // FETCH ALL DEALS (Client-side filtering for flexibility with retroactive dates)
            // if (dateRange.start) {
            //     query = query.gte('created_at', dateRange.start.toISOString());
            // }
            // if (dateRange.end) {
            //     query = query.lte('created_at', dateRange.end.toISOString());
            // }

            const { data: fetchedDeals, error: dError } = await query;
            if (dError) throw dError;

            setDeals(fetchedDeals || []);
            const deals = fetchedDeals || []; // Keep local reference for calculations

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
                const nameStatus = getStatus(c.name);

                // PRIORITY FIX: Checks 'lost' status via name FIRST. Only defaults to 'won' (last col) if actual status is not 'lost'.
                colMap[c.id] = {
                    id: c.id,
                    title: c.name,
                    status: nameStatus === 'lost' ? 'lost' : (isLastCol ? 'won' : nameStatus),
                    color: c.color,
                    pipelineId: c.pipeline_id,
                    position: c.position
                };
            });


            // BI SPECIFIC AGGREGATION
            // HISTORY Accumulators (All Time)
            let historyTotal = 0;
            let historyWon = 0;

            // PERIOD Accumulators (Selected Date Range)
            let periodWonCount = 0; let periodWonValue = 0;
            let periodLostCount = 0; let periodLostValue = 0;
            let periodActiveCount = 0; let periodActiveValue = 0;

            const PERIOD_BI = {
                inbound_lead: 0, inbound_meeting: 0, inbound_noshow: 0, inbound_won: 0,
                outbound_prospect: 0, outbound_meeting: 0, outbound_noshow: 0, outbound_won: 0
            };

            const meetingKeywords = ['agendada', 'reunião', 'rvp', 'meeting', 'visit', 'apresenta', 'diagnóstico'];
            const noShowKeywords = ['no show', 'nocompareceu', 'falta', 'ausente'];

            // Define Period Range
            const { start: dateStart, end: dateEnd } = dateRange;

            deals.forEach(d => {
                const col = colMap[d.stage];
                const val = Number(d.faturamento_mensal) || PRODUCT_VALUE;

                if (!col) return; // Skip unknown stages

                // Global Dashboard Mode Filter (Applies to both History and Period for consistency of scope)
                if (dashboardMode === 'inbound' && d.tipo_pipeline !== 'Receptivo') return;
                if (dashboardMode === 'outbound' && d.tipo_pipeline !== 'Ativo_Diagnostico') return;
                if (selectedPipeline !== 'all' && col.pipelineId !== selectedPipeline) return;

                const isWon = col.status === 'won';
                const isLost = col.status === 'lost';
                const colTitle = (col.title || '').toLowerCase();

                // --- 1. HISTORICAL AGGREGATION (For Conversion Rate) ---
                historyTotal++;
                if (isWon) historyWon++;

                // --- 2. PERIOD FILTER CHECK ---
                const created = new Date(d.created_at);
                const inPeriod = (!dateStart || created >= dateStart) && (!dateEnd || created <= dateEnd);

                if (!inPeriod) return; // STOP here if not in selected period

                // --- 3. PERIOD AGGREGATION (For Cards & Funnel) ---

                // General Stats
                if (isWon) { periodWonCount++; periodWonValue += val; }
                else if (isLost) { periodLostCount++; periodLostValue += val; }
                else { periodActiveCount++; periodActiveValue += val; }

                // BI Specifics
                const isMeeting = meetingKeywords.some(k => colTitle.includes(k)) || (col.position >= 2 && col.position <= 5);
                const isNoShow = noShowKeywords.some(k => colTitle.includes(k));

                if (d.tipo_pipeline === 'Receptivo') {
                    PERIOD_BI.inbound_lead++;
                    if (isMeeting || isNoShow || isWon) PERIOD_BI.inbound_meeting++;
                    if (isNoShow) PERIOD_BI.inbound_noshow++;
                    if (isWon) PERIOD_BI.inbound_won++;
                } else if (d.tipo_pipeline === 'Ativo_Diagnostico') {
                    PERIOD_BI.outbound_prospect++;
                    if (isMeeting || isNoShow || isWon) PERIOD_BI.outbound_meeting++;
                    if (isNoShow) PERIOD_BI.outbound_noshow++;
                    if (isWon) PERIOD_BI.outbound_won++;
                }
            });

            // Calculate Conversions helper
            const calcConv = (b, a) => (a > 0 ? ((b / a) * 100).toFixed(1) : 0);

            setStats({
                // Period Stats
                newLeads: PERIOD_BI.inbound_lead + PERIOD_BI.outbound_prospect,
                activeDeals: periodActiveCount,
                closedDeals: periodWonCount,
                lostDeals: periodLostCount,
                totalRevenue: periodWonValue,
                lostRevenue: periodLostValue,
                avgTicket: periodWonCount > 0 ? (periodWonValue / periodWonCount) : 0,
                forecast: periodActiveValue,

                // HISTORY Stats (Use history accumulators)
                conversionRate: calcConv(historyWon, historyTotal),

                inbound: {
                    count: PERIOD_BI.inbound_lead,
                    meetings_total: PERIOD_BI.inbound_meeting,
                    conv1: calcConv(PERIOD_BI.inbound_meeting, PERIOD_BI.inbound_lead),
                    noshow: PERIOD_BI.inbound_noshow,
                    noshowRate: calcConv(PERIOD_BI.inbound_noshow, PERIOD_BI.inbound_meeting),
                    meetings_done: PERIOD_BI.inbound_meeting - PERIOD_BI.inbound_noshow,
                    wonCount: PERIOD_BI.inbound_won,
                    conv2: calcConv(PERIOD_BI.inbound_won, (PERIOD_BI.inbound_meeting - PERIOD_BI.inbound_noshow))
                },
                outbound: {
                    count: PERIOD_BI.outbound_prospect,
                    meetings_total: PERIOD_BI.outbound_meeting,
                    conv1: calcConv(PERIOD_BI.outbound_meeting, PERIOD_BI.outbound_prospect),
                    noshow: PERIOD_BI.outbound_noshow,
                    noshowRate: calcConv(PERIOD_BI.outbound_noshow, PERIOD_BI.outbound_meeting),
                    meetings_done: PERIOD_BI.outbound_meeting - PERIOD_BI.outbound_noshow,
                    wonCount: PERIOD_BI.outbound_won,
                    conv2: calcConv(PERIOD_BI.outbound_won, (PERIOD_BI.outbound_meeting - PERIOD_BI.outbound_noshow))
                },
                total_bi: {
                    count: PERIOD_BI.inbound_lead + PERIOD_BI.outbound_prospect,
                    wonCount: PERIOD_BI.inbound_won + PERIOD_BI.outbound_won,
                    noshow: PERIOD_BI.inbound_noshow + PERIOD_BI.outbound_noshow,
                    meetings_total: (PERIOD_BI.inbound_meeting + PERIOD_BI.outbound_meeting),
                    meetings_done: (PERIOD_BI.inbound_meeting + PERIOD_BI.outbound_meeting) - (PERIOD_BI.inbound_noshow + PERIOD_BI.outbound_noshow),
                    conv1: calcConv(PERIOD_BI.inbound_meeting + PERIOD_BI.outbound_meeting, PERIOD_BI.inbound_lead + PERIOD_BI.outbound_prospect),
                    noshowRate: calcConv(PERIOD_BI.inbound_noshow + PERIOD_BI.outbound_noshow, PERIOD_BI.inbound_meeting + PERIOD_BI.outbound_meeting),
                    conv2: calcConv(PERIOD_BI.inbound_won + PERIOD_BI.outbound_won, (PERIOD_BI.inbound_meeting + PERIOD_BI.outbound_meeting) - (PERIOD_BI.inbound_noshow + PERIOD_BI.outbound_noshow))
                },
                columnColors: colMap
            });

            // CHART DATA: Value by Stage (PERIOD ONLY)
            const uniqueCols = Array.from(new Map(columns.map(c => [c.id, c])).values());

            const flowStages = uniqueCols
                .filter(c => selectedPipeline === 'all' || c.pipeline_id === selectedPipeline)
                .map(c => {
                    // Filter deals belonging to this stage AND within Period
                    const stageDeals = deals.filter(d => {
                        const created = new Date(d.created_at);
                        const inPeriod = (!dateStart || created >= dateStart) && (!dateEnd || created <= dateEnd);
                        // Mode filter
                        if (dashboardMode === 'inbound' && d.tipo_pipeline !== 'Receptivo') return false;
                        if (dashboardMode === 'outbound' && d.tipo_pipeline !== 'Ativo_Diagnostico') return false;

                        return d.stage === c.id && inPeriod;
                    });

                    const stageValue = stageDeals.reduce((sum, d) => sum + (parseFloat(d.faturamento_mensal) || 0), 0);
                    const compactValue = new Intl.NumberFormat('pt-BR', { notation: "compact", maximumFractionDigits: 1 }).format(stageValue);

                    return {
                        id: c.id + '-' + c.pipeline_id,
                        label: c.name,
                        value: stageValue,
                        dealCount: stageDeals.length,
                        customLabel: `R$ ${compactValue} (${stageDeals.length})`,
                        status: colMap[c.id]?.status // Pass status for coloring
                    };
                });

            setChartData(flowStages || []);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            if (loading) setLoading(false);
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
        <div className="flex flex-col gap-6 w-full max-w-[1920px] mx-auto px-6 py-4">
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-1">

                    <div className="relative mt-2 z-30">
                        <button
                            className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl text-text-primary text-sm font-bold uppercase tracking-wide hover:bg-white/10 hover:border-white/20 hover:shadow-lg transition-all"
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
                                className={`transition-transform duration-200 ${showPipelineDropdown ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {showPipelineDropdown && (
                            <div className="absolute top-full left-0 mt-2 bg-background-secondary/95 border border-white/10 rounded-xl p-2 min-w-[240px] shadow-2xl flex flex-col gap-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                                <div className="text-[0.65rem] font-extrabold text-text-muted px-3 py-1 uppercase tracking-widest mt-1">CONSOLIDADO</div>
                                <button
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${dashboardMode === 'all' && selectedPipeline === 'all' ? 'bg-brand text-white font-bold shadow-lg shadow-brand/20' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}
                                    onClick={() => { setDashboardMode('all'); setSelectedPipeline('all'); setShowPipelineDropdown(false); }}
                                >
                                    Visão Geral
                                </button>

                                <div className="text-[0.65rem] font-extrabold text-text-muted px-3 py-1 uppercase tracking-widest mt-2">PIPELINES ESPECÍFICOS</div>
                                {pipelines.map(p => (
                                    <button
                                        key={p.id}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedPipeline === p.id ? 'bg-brand text-white font-bold shadow-lg shadow-brand/20' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}
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
                        className="flex items-center gap-2 bg-brand/10 text-brand border border-brand/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand hover:text-white hover:shadow-lg transition-all"
                        onClick={() => window.location.href = '/goals-config'}
                        title="Definir Metas"
                    >
                        <Target size={18} /> Metas
                    </button>
                    <PeriodFilter
                        selectedPeriod={selectedPeriod}
                        onPeriodChange={setSelectedPeriod}
                        customDates={customDates}
                        onCustomDateChange={handleCustomDateChange}
                    />
                </div >
            </div >



            {/* NEW PREMIUM HEADER METRICS */}
            <CommercialMetrics
                stats={stats}
                goals={userGoals}
                loading={loading}
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
                deals={deals}
            />

            {/* DEBUG PANEL - TEMPORARY */}


        </div >
    );
};

export default Dashboard;
