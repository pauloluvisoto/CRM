import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrendingUp, Loader2, ArrowUpRight, Users, Target, DollarSign, TrendingDown, Percent, ArrowDownRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const BusinessPlanDashboard = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState('2026');

    const MONTHS = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    useEffect(() => {
        fetchData(selectedYear);
    }, [selectedYear]);

    const fetchData = async (year) => {
        setLoading(true);
        try {
            const years = ['2026', '2027', '2028', '2029', '2030'];
            let allResults = [];

            if (year !== 'overview') {
                const { data: res, error } = await supabase.from('financial_baseline').select('*').gte('competencia', `${year}-01-01`).lte('competencia', `${year}-12-31`);
                if (error) throw error;
                allResults = res || [];
            } else {
                const promises = years.map(y => supabase.from('financial_baseline').select('*').gte('competencia', `${y}-01-01`).lte('competencia', `${y}-12-31`));
                const responses = await Promise.all(promises);
                responses.forEach(res => { if (res.data) allResults = [...allResults, ...res.data]; });
            }

            setData(allResults.sort((a, b) => parseInt(a.subcategoria) - parseInt(b.subcategoria)));
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRowStyle = (rowIdx) => {
        const idx = parseInt(rowIdx);
        const primaryHighlights = [4, 12, 41];
        const secondaryHighlights = [2, 8, 9, 13, 20];

        if (primaryHighlights.includes(idx)) return 'bg-[#27272a] font-bold text-white border-y border-white/10 brightness-110';
        if (secondaryHighlights.includes(idx)) return 'font-semibold text-slate-200 bg-white/[0.03]';
        return 'text-slate-400 opacity-80 group-hover:opacity-100 group-hover:bg-white/[0.02]';
    };

    const getFormatType = (rowIdx, name) => {
        const idx = parseInt(rowIdx);
        const lower = (name || '').toLowerCase();
        if (idx === 10 || idx === 42 || lower.includes('%')) return 'percent';
        if (idx === 2 || lower.includes('usuários')) return 'integer';
        return 'currency';
    };

    const getAggregationType = (rowIdx) => {
        const idx = parseInt(rowIdx);
        if (idx === 2) return 'last';
        if (idx === 42) return 'avg';
        return 'sum';
    };

    const formatValue = (val, type) => {
        if (val === undefined || val === null || isNaN(val)) return '-';
        if (type === 'integer') return Math.round(val).toLocaleString('pt-BR');
        if (type === 'percent') {
            const num = val * 100;
            return `${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        }
        return val.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const pivotedData = useMemo(() => {
        if (data.length === 0) return [];

        const tempGroups = {};
        const years = ['2026', '2027', '2028', '2029', '2030'];

        data.forEach(row => {
            const idx = row.subcategoria;
            if (!tempGroups[idx]) {
                tempGroups[idx] = { idx, name: row.categoria, values: {}, rawMonths: {} };
            }
            const y = row.competencia.split('-')[0];
            const m = parseInt(row.competencia.split('-')[1], 10) - 1;

            if (!tempGroups[idx].rawMonths[y]) tempGroups[idx].rawMonths[y] = Array(12).fill(0);
            tempGroups[idx].rawMonths[y][m] = row.valor_planejado || 0;
        });

        const finalGroups = Object.values(tempGroups);
        finalGroups.forEach(g => {
            const agg = getAggregationType(g.idx);
            if (selectedYear === 'overview') {
                years.forEach(y => {
                    const months = g.rawMonths[y] || Array(12).fill(0);
                    if (agg === 'sum') g.values[y] = months.reduce((a, b) => a + b, 0);
                    else if (agg === 'last') g.values[y] = months[11];
                    else g.values[y] = months.reduce((a, b) => a + b, 0) / 12;
                });
            } else {
                const yearStr = selectedYear.toString();
                const months = g.rawMonths[yearStr] || Array(12).fill(0);
                months.forEach((v, i) => { g.values[i] = v; });
            }
        });

        return finalGroups.sort((a, b) => parseInt(a.idx) - parseInt(b.idx));
    }, [data, selectedYear]);

    const stats = useMemo(() => {
        if (pivotedData.length === 0) return null;
        const ebitdaRow = pivotedData.find(r => parseInt(r.idx) === 41);
        const usersRow = pivotedData.find(r => parseInt(r.idx) === 2);
        const receitaLiquidaRow = pivotedData.find(r => parseInt(r.idx) === 8);
        const receitaBrutaRow = pivotedData.find(r => parseInt(r.idx) === 4);
        const margemRow = pivotedData.find(r => parseInt(r.idx) === 42);
        const resultadoBrutoRow = pivotedData.find(r => parseInt(r.idx) === 9);

        const getDisplayTotal = (row) => {
            if (!row) return 0;
            const agg = getAggregationType(row.idx);

            if (selectedYear === 'overview') {
                const yearValues = Object.values(row.values);
                if (agg === 'sum') return yearValues.reduce((a, b) => a + b, 0);
                if (agg === 'last') return row.rawMonths['2030'] ? row.rawMonths['2030'][11] : 0;
                if (agg === 'avg') return yearValues.reduce((a, b) => a + b, 0) / (yearValues.length || 1);
                return yearValues.reduce((a, b) => a + b, 0);
            } else {
                const monthValues = Object.values(row.values);
                if (agg === 'sum') return monthValues.reduce((a, b) => a + b, 0);
                if (agg === 'last') return row.values[11] || 0;
                if (agg === 'avg') return monthValues.reduce((a, b) => a + b, 0) / (monthValues.length || 1);
                return monthValues.reduce((a, b) => a + b, 0);
            }
        };

        const receitaLiquida = getDisplayTotal(receitaLiquidaRow);
        const ebitdaTotal = getDisplayTotal(ebitdaRow);
        const resultadoBruto = getDisplayTotal(resultadoBrutoRow);
        const receitaBruta = getDisplayTotal(receitaBrutaRow);
        const resultadoBrutoPercent = receitaBruta !== 0 ? (resultadoBruto / receitaBruta) : 0;
        const margemCalculada = receitaLiquida !== 0 ? (ebitdaTotal / receitaLiquida) : 0;

        return {
            ebitda: ebitdaTotal,
            receita: receitaLiquida,
            despesa: receitaLiquida - ebitdaTotal,
            users: getDisplayTotal(usersRow),
            margem: margemCalculada,
            resultadoBruto: resultadoBruto,
            resultadoBrutoPercent: resultadoBrutoPercent
        };
    }, [pivotedData, selectedYear]);

    if (loading) return (
        <div className="flex flex-col h-[70vh] items-center justify-center text-slate-400 bg-[#09090b]">
            <Loader2 className="w-12 h-12 animate-spin text-[#a3e635] mb-4" />
            <span className="text-xl font-medium tracking-wider animate-pulse">CARREGANDO BUSINESS PLAN...</span>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-[#09090b] text-slate-200">
            {/* Header com Navegação de Anos */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-8 bg-[#a3e635] rounded-full" />
                        <h1 className="text-4xl font-black tracking-tighter text-white">Business Plan</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-5 tracking-wide">Projeções Financeiras 2026-2030</p>
                </div>

                <div className="flex gap-1 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
                    {['2026', '2027', '2028', '2029', '2030', 'overview'].map((y) => (
                        <button
                            key={y}
                            onClick={() => setSelectedYear(y)}
                            className={`px-8 py-3 rounded-xl text-sm font-black transition-all duration-300 tracking-wider ${selectedYear === y
                                ? 'bg-[#a3e635] text-black shadow-lg scale-105'
                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {y === 'overview' ? '5 ANOS' : y}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Coluna 1: Receita e Despesa */}
                    <div className="space-y-6">
                        {/* Receita Líquida */}
                        <div className="bg-[#18181b] p-6 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group h-[140px]">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <DollarSign className={`w-16 h-16 ${stats.receita >= 0 ? 'text-[#a3e635]' : 'text-rose-500'}`} />
                            </div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Receita Líquida Acumulada</span>
                            <div className={`text-3xl font-black ${stats.receita >= 0 ? 'text-[#a3e635]' : 'text-rose-500'}`}>{formatValue(stats.receita, 'currency')}</div>
                            <div className={`text-[10px] flex items-center gap-1 font-bold ${stats.receita >= 0 ? 'text-[#a3e635]' : 'text-rose-500'}`}>
                                <ArrowUpRight size={12} /> ALVO ESTRATÉGICO
                            </div>
                        </div>

                        {/* Despesa Total */}
                        <div className="bg-[#18181b] p-6 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group h-[140px]">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <TrendingDown className="w-16 h-16 text-rose-500" />
                            </div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Despesa Total Acumulada</span>
                            <div className="text-3xl font-black text-rose-500">{formatValue(stats.despesa, 'currency')}</div>
                            <div className="text-[10px] text-rose-500 flex items-center gap-1 font-bold">
                                <ArrowDownRight size={12} /> CUSTO TOTAL
                            </div>
                        </div>
                    </div>

                    {/* Coluna 2: EBITDA e Margem */}
                    <div className="space-y-6">
                        {/* EBITDA */}
                        <div className="bg-[#18181b] p-6 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group h-[140px]">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Target className={`w-16 h-16 ${stats.ebitda >= 0 ? 'text-[#a3e635]' : 'text-rose-500'}`} />
                            </div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">{stats.ebitda >= 0 ? 'Resultado Sem Aporte' : 'Déficit Operacional'}</span>
                            <div className={`text-3xl font-black ${stats.ebitda >= 0 ? 'text-[#a3e635]' : 'text-rose-500'}`}>{formatValue(stats.ebitda, 'currency')}</div>
                            <div className={`text-[10px] flex items-center gap-1 font-bold ${stats.ebitda >= 0 ? 'text-[#a3e635]' : 'text-rose-500'}`}>
                                <Target size={12} /> {stats.ebitda >= 0 ? 'SURPLUS EM 5 ANOS' : 'DÉFICE EM 5 ANOS'}
                            </div>
                        </div>

                        {/* Margem Líquida */}
                        <div className="bg-[#18181b] p-6 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group h-[140px]">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Percent className={`w-16 h-16 ${stats.margem >= 0 ? 'text-[#a3e635]' : 'text-rose-500'}`} />
                            </div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Margem Líquida em %</span>
                            <div className={`text-3xl font-black ${stats.margem >= 0 ? 'text-[#a3e635]' : 'text-rose-500'}`}>{(stats.margem * 100).toFixed(2)}%</div>
                            <div className={`text-[10px] flex items-center gap-1 font-bold ${stats.margem >= 0 ? 'text-[#a3e635]' : 'text-rose-500'}`}>
                                <Users size={12} /> DÉFICIT GERAL
                            </div>
                        </div>
                    </div>

                    {/* Coluna 3: Usuários e Margem Bruta */}
                    <div className="space-y-6">
                        {/* Base de Usuários */}
                        <div className="bg-[#18181b] p-6 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group h-[140px]">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Users className="w-16 h-16 text-[#a3e635]" />
                            </div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Base de Usuários (DEZ)</span>
                            <div className="text-3xl font-black text-[#a3e635]">
                                {formatValue(stats.users, 'integer')}
                            </div>
                            <div className="text-[10px] text-[#a3e635] flex items-center gap-1 font-bold uppercase">Meta de Retenção</div>
                        </div>

                        {/* Resultado Bruto */}
                        <div className="bg-[#18181b] p-6 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group h-[140px]">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <TrendingUp className={`w-16 h-16 ${stats.resultadoBruto >= 0 ? 'text-[#a3e635]' : 'text-rose-500'}`} />
                            </div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Resultado Bruto</span>
                            <div className={`text-2xl font-black ${stats.resultadoBruto >= 0 ? 'text-[#a3e635]' : 'text-rose-500'}`}>{formatValue(stats.resultadoBruto, 'currency')}</div>
                            <div className={`text-lg font-bold ${stats.resultadoBruto >= 0 ? 'text-[#a3e635]/80' : 'text-rose-500/80'}`}>
                                {formatValue(stats.resultadoBrutoPercent, 'percent')}
                            </div>
                            <div className={`text-[10px] font-bold uppercase ${stats.resultadoBruto >= 0 ? 'text-[#a3e635]' : 'text-rose-500'}`}>MARGEM BRUTA</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Table */}
            <div className="bg-[#111114] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                <div
                    ref={scrollRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={() => setIsDragging(false)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseMove={handleMouseMove}
                    className="overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing select-none"
                >
                    <table className="w-full text-sm text-left border-collapse min-w-[1400px]">
                        <thead className="bg-[#09090b] text-[10px] uppercase font-black text-slate-500 tracking-tighter">
                            <tr>
                                <th className="px-5 py-6 sticky left-0 bg-[#09090b] z-40 w-[240px] md:w-[320px] border-r border-white/10 shadow-[5px_0_15px_-5px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-4 bg-[#a3e635] rounded-full" />
                                        Estrutura de Resultados
                                    </div>
                                </th>
                                {selectedYear === 'overview' ? (
                                    <>
                                        {['2026', '2027', '2028', '2029', '2030'].map(y => (
                                            <th key={y} className="px-6 py-6 text-right min-w-[140px] border-b border-white/5">{y}</th>
                                        ))}
                                        <th className="px-8 py-6 text-right bg-[#18181b] border-b border-white/10 sticky right-0 z-40 text-[#a3e635] shadow-[-10px_0_20px_rgba(0,0,0,0.5)]">Consolidado</th>
                                    </>
                                ) : (
                                    <>
                                        {MONTHS.map(m => (
                                            <th key={m} className="px-6 py-6 text-right min-w-[120px] border-b border-white/5">{m}</th>
                                        ))}
                                        <th className="px-8 py-6 text-right bg-[#18181b] border-b border-white/10 sticky right-0 z-40 text-[#a3e635] shadow-[-10px_0_20px_rgba(0,0,0,0.5)]">Acumulado</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {pivotedData.map((row) => {
                                const style = getRowStyle(row.idx);
                                const format = getFormatType(row.idx, row.name);
                                const aggType = getAggregationType(row.idx);
                                const isEbitda = parseInt(row.idx) === 41;

                                const rawName = row.name || '';
                                const leadingSpaces = rawName.match(/^\s*/)[0].length;
                                const cleanName = rawName.trim();

                                let rowTotal = 0;
                                const valsList = Object.values(row.values);
                                if (valsList.length > 0) {
                                    if (aggType === 'sum') rowTotal = valsList.reduce((a, b) => a + b, 0);
                                    else if (aggType === 'last') rowTotal = row.values[selectedYear === 'overview' ? '2030' : 11] || 0;
                                    else rowTotal = valsList.reduce((a, b) => a + b, 0) / (valsList.length || 1);
                                }

                                return (
                                    <tr key={row.idx} className={`group transition-all duration-300 ${style}`}>
                                        <td className="px-5 py-4 sticky left-0 z-30 border-r border-white/10 shadow-[5px_0_15px_-5px_rgba(0,0,0,0.5)] bg-[#111114] group-hover:bg-[#18181b] transition-colors">
                                            <div
                                                className="flex items-center gap-2"
                                                style={{ marginLeft: `${leadingSpaces * 1.5}px` }}
                                            >
                                                {leadingSpaces > 0 && <span className="text-white/20">↳</span>}
                                                <span className="truncate max-w-[180px] md:max-w-none" title={cleanName}>
                                                    {cleanName}
                                                </span>
                                            </div>
                                        </td>

                                        {selectedYear === 'overview' ? (
                                            ['2026', '2027', '2028', '2029', '2030'].map(y => (
                                                <td key={y} className="px-6 py-4 text-right font-mono text-xs tabular-nums tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity">
                                                    {formatValue(row.values[y], format)}
                                                </td>
                                            ))
                                        ) : (
                                            MONTHS.map((_, mIdx) => (
                                                <td key={mIdx} className="px-6 py-4 text-right font-mono text-xs tabular-nums tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {formatValue(row.values[mIdx], format)}
                                                </td>
                                            ))
                                        )}

                                        <td className={`px-8 py-4 text-right font-mono font-black sticky right-0 z-30 tabular-nums shadow-[-10px_0_20px_rgba(0,0,0,0.5)] bg-[#111114] group-hover:bg-[#18181b] transition-colors ${isEbitda ? 'text-[#a3e635]' : 'text-slate-100'}`}>
                                            {formatValue(rowTotal, format)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default BusinessPlanDashboard;
