import React, { useState, useMemo } from 'react';
import { Target, Users, Calendar, Video, CheckCircle2, DollarSign, TrendingUp, Filter } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ReferenceLine } from 'recharts';

const CommercialManagement2026 = ({ deals = [], pipelines = [], stages = [] }) => {
    // --- 1. CONFIGURAÇÃO E INPUTS ---
    const [mediaBudget, setMediaBudget] = useState(5000); // R$ 5.000,00 Inicial
    const [targetCPL, setTargetCPL] = useState(24);       // R$ 24,00 Inicial

    // --- 2. FILTRAGEM SEGURA (JANEIRO 2026) ---
    const filteredDeals = useMemo(() => {
        return deals.filter(d => {
            if (!d.created_at) return false;
            const date = new Date(d.created_at);
            return date.getFullYear() === 2026 && date.getMonth() === 0; // Janeiro (0) 2026
        });
    }, [deals]);

    // --- 3. LÓGICA DE METAS DINÂMICAS ---
    const targetSales = Math.max(10, Math.floor(mediaBudget / 500)); // Maior entre 10 e (Budget / 500)
    const targetMMR = targetSales * 597; // Ticket Médio Fixo conforme Prompt

    // --- 4. MAPEAMENTO INTELIGENTE DO FUNIL ---
    // Mapeia Stage IDs para Etapas Conceituais (Leads -> Conversas -> Agendamentos -> Shows -> Vendas)
    const funnelMetrics = useMemo(() => {
        // IDs
        let conversationIds = [];
        let scheduledIds = [];
        let showIds = []; // Normalmente etapas finais antes do fechamento

        // Tenta inferir pelos nomes se não houver config explícita
        stages.forEach(s => {
            const name = s.name.toLowerCase();
            // Conversas: Etapas iniciais/qualificação
            if (name.includes('convers') || name.includes('qualific') || name.includes('abordag') || name.includes('contato')) conversationIds.push(s.id);
            // Agendamentos: Reuniões marcadas
            if (name.includes('agenda') || name.includes('reuni') || name.includes('mark')) scheduledIds.push(s.id);
            // Shows: Reuniões realizadas / Diagnóstico
            if (name.includes('show') || name.includes('realiz') || name.includes('diag') || name.includes('apresent')) showIds.push(s.id);
        });

        // Contagens
        const leadsTotal = filteredDeals.length;

        const conversations = filteredDeals.filter(d => conversationIds.includes(d.stage) || scheduledIds.includes(d.stage) || showIds.includes(d.stage) || d.status_contrato === 'Assinado').length; // Funil cumulativo simplificado
        // Ajuste: Para ser preciso, "Conversas" deveria ser status >= Conversa.
        // Simplificação: Vou contar stages específicos.

        const countStage = (ids) => filteredDeals.filter(d => ids.includes(d.stage)).length;
        // Precisamos saber se o deal PASSOU por ali. Em CRM simples de status atual, é difícil.
        // Vou assumir que TUDO que está em Agendamento já passou por Conversa.

        // Melhor abordagem para Snapshot atual: Contar onde eles ESTÃO HOJE.
        // O usuário pediu "Volume Real". 

        const sales = filteredDeals.filter(d => d.status_contrato === 'Assinado').length;

        // Recalculando com lógica cumulativa aproximada (Quem tá no final, passou pelo começo)
        const inShow = countStage(showIds);
        const inSched = countStage(scheduledIds);
        const inConv = countStage(conversationIds);

        // Ex: Quem vendeu (sales) passou por Show, Sched e Conv.
        // Ex: Quem tá em Show, passou por Sched e Conv.

        const totalShows = inShow + sales;
        const totalSched = inSched + totalShows;
        const totalConv = inConv + totalSched;

        return {
            leads: leadsTotal,
            conversations: totalConv, // Conversas + Agendados + Shows + Vendas
            scheduled: totalSched,    // Agendados + Shows + Vendas
            shows: totalShows,        // Shows + Vendas
            sales: sales
        };
    }, [filteredDeals, stages]);

    // --- 5. VISUAL: DADOS DO GRÁFICO DE FUNIL ---
    const funnelChartData = [
        {
            name: 'Leads',
            actual: funnelMetrics.leads,
            target: Math.ceil(mediaBudget / targetCPL), // Ex: CPL Alvo define quantos leads deveriam ter entrado
            rateEnv: '100%'
        },
        {
            name: 'Conversas',
            actual: funnelMetrics.conversations,
            target: Math.ceil(funnelMetrics.leads * 0.40), // Meta: 40% de Leads
            rateEnv: '40%'
        },
        {
            name: 'Agendamentos',
            actual: funnelMetrics.scheduled,
            target: Math.ceil(funnelMetrics.conversations * 0.50), // Meta: 50% de Conversas
            rateEnv: '50%'
        },
        {
            name: 'Shows',
            actual: funnelMetrics.shows,
            target: Math.ceil(funnelMetrics.scheduled * 0.80), // Meta: 80% de Agendamentos
            rateEnv: '80%'
        },
        {
            name: 'Vendas',
            actual: funnelMetrics.sales,
            target: Math.ceil(funnelMetrics.shows * 0.30), // Meta: 30% de Shows
            rateEnv: '30%'
        }
    ];

    // --- 6. VISUAL: GAUGE DE VENDAS ---
    const salesProgress = Math.min(100, (funnelMetrics.sales / targetSales) * 100);

    // --- 7. VISUAL: TABELA DIÁRIA ---
    const dailyData = useMemo(() => {
        const days = {};
        filteredDeals.forEach(d => {
            const day = new Date(d.created_at).getDate();
            days[day] = (days[day] || 0) + 1;
        });

        return Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            return { day: day, leads: days[day] || 0 };
        });
    }, [filteredDeals]);


    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* HEADER & INPUTS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-secondary font-bold uppercase">Budget Mídia (R$)</label>
                    <input
                        type="number"
                        value={mediaBudget}
                        onChange={(e) => setMediaBudget(Number(e.target.value))}
                        className="bg-black/20 border border-white/10 rounded px-3 py-2 text-white font-mono focus:border-brand outline-none"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-secondary font-bold uppercase">CPL Alvo (R$)</label>
                    <input
                        type="number"
                        value={targetCPL}
                        onChange={(e) => setTargetCPL(Number(e.target.value))}
                        className="bg-black/20 border border-white/10 rounded px-3 py-2 text-white font-mono focus:border-brand outline-none"
                    />
                </div>

                {/* METAS CALCULADAS */}
                <div className="flex flex-col gap-1 border-l border-white/10 pl-4">
                    <span className="text-xs text-brand font-bold uppercase">Meta Vendas (Qtd)</span>
                    <span className="text-2xl font-black text-white">{targetSales}</span>
                    <span className="text-[10px] text-white/40">Min(10) ou Budget/500</span>
                </div>
                <div className="flex flex-col gap-1 border-l border-white/10 pl-4">
                    <span className="text-xs text-emerald-400 font-bold uppercase">Meta MMR Novos (R$)</span>
                    <span className="text-2xl font-black text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(targetMMR)}
                    </span>
                    <span className="text-[10px] text-white/40">Basis: R$ 597/venda</span>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">

                {/* COLUNA 1: FUNIL (8 Cols) */}
                <div className="col-span-12 lg:col-span-8 bg-black/20 border border-white/5 rounded-2xl p-6 min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Filter size={18} className="text-brand" />
                            Funil de Eficiência Jan/26
                        </h3>
                        <div className="flex gap-4 text-xs">
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-brand rounded"></div> Real</div>
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white/10 rounded"></div> Meta</div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={funnelChartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 40 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#fff" width={100} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff' }}
                                    formatter={(value, name) => [value, name === 'actual' ? 'Realizado' : 'Meta Esperada']}
                                />
                                <Bar dataKey="target" barSize={20} fill="rgba(255,255,255,0.05)" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="actual" barSize={20} fill="#a3e635" radius={[0, 4, 4, 0]}>
                                    {
                                        funnelChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.actual >= entry.target ? '#a3e635' : '#ef4444'} />
                                        ))
                                    }
                                </Bar>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* COLUNA 2: KPIs & GAUGE (4 Cols) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

                    {/* GAUGE DE VENDAS */}
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                        <h4 className="text-sm font-bold text-white mb-4 z-10">Progresso da Meta</h4>

                        {/* Semi-Circle SVG */}
                        <div className="relative w-48 h-24 overflow-hidden mb-2 z-10">
                            <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[15px] border-white/10 box-border"></div>
                            <div
                                className="absolute top-0 left-0 w-48 h-48 rounded-full border-[15px] border-emerald-500 box-border transition-all duration-1000 ease-out origin-bottom"
                                style={{ transform: `rotate(${salesProgress * 1.8 - 180}deg)` }}
                            ></div>
                        </div>
                        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20">
                            <span className="text-3xl font-black text-white block">{funnelMetrics.sales}</span>
                            <span className="text-[10px] text-text-secondary uppercase">Vendas Assinadas</span>
                        </div>

                        <div className="flex justify-between w-full mt-2 px-4 z-10">
                            <span className="text-xs text-white/40">0</span>
                            <span className="text-xs text-white/40">{targetSales}</span>
                        </div>

                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-emerald-500/5 blur-3xl z-0"></div>
                    </div>

                    {/* RESUMO RÁPIDO */}
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-6 flex-1">
                        <h4 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
                            <DollarSign size={14} /> Faturamento Real Jan/26
                        </h4>
                        {/* Soma real do faturamento dos deals assinados em Janeiro */}
                        <div className="text-3xl font-black text-white mb-1">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                filteredDeals
                                    .filter(d => d.status_contrato === 'Assinado')
                                    .reduce((acc, curr) => acc + (Number(curr.faturamento_mensal) || 0), 0)
                            )}
                        </div>
                        <p className="text-xs text-text-secondary">Soma total de contratos assinados.</p>
                    </div>

                </div>

                {/* LINHA 2: PERFORMANCE DIÁRIA (12 Cols) */}
                <div className="col-span-12 bg-black/20 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Calendar size={18} className="text-purple-400" />
                        Volume de Leads Diário (Jan 26)
                    </h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis dataKey="day" stroke="#52525b" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#52525b" tick={{ fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff' }}
                                    labelFormatter={(label) => `Dia ${label}`}
                                />
                                <Bar dataKey="leads" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={15} />
                                <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Meta: 10/dia', fill: '#ef4444', fontSize: 10 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CommercialManagement2026;
