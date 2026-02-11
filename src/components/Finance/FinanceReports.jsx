import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Download, FileText, Calendar, Filter } from 'lucide-react';
import financeService from '../../services/financeService';

const FinanceReports = () => {
    const [activeTab, setActiveTab] = useState('cashflow'); // 'cashflow' or 'dre'
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [payables, receivables] = await Promise.all([
                    financeService.getPayables(),
                    financeService.getReceivables()
                ]);

                // Normalize and merge
                const normalizedPayables = payables.map(p => ({ ...p, type: 'expense', date: new Date(p.due_date) }));
                const normalizedReceivables = receivables.map(r => ({ ...r, type: 'income', date: new Date(r.due_date) }));
                setTransactions([...normalizedPayables, ...normalizedReceivables]);
            } catch (error) {
                console.error("Error loading report data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Process Cash Flow Data (Group by Month)
    const cashFlowData = useMemo(() => {
        const data = [];
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        // Initialize last 6 months or current year? Let's do Jan-Jun 2026 as in mock, or dynamic based on data
        // Let's do a fixed 12 months for 2026 for now, or simplified to just months present in data.
        // Better: generic 12 months.
        for (let i = 0; i < 12; i++) {
            data.push({ name: monthNames[i], receitas: 0, despesas: 0, monthIndex: i });
        }

        transactions.forEach(t => {
            const month = t.date.getMonth(); // 0-11
            const amount = Number(t.amount);
            if (t.type === 'income') {
                data[month].receitas += amount;
            } else {
                data[month].despesas += amount;
            }
        });

        // Current view: return first 6 months to match previous design or all? Design showed 6.
        // Let's return all non-zero or first 6? Let's return first 6 for now to keep UI clean.
        return data.slice(0, 6);
    }, [transactions]);

    // Process DRE Data
    const dreData = useMemo(() => {
        const totalRevenue = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);

        // Simplified mapping for now since we don't have tax/cost categories separated perfectly
        const taxes = 0;
        const netRevenue = totalRevenue - taxes;
        const variableCosts = 0;
        const contributionMargin = netRevenue - variableCosts;
        const fixedCosts = totalExpense; // Assume all expenses are fixed for this simple view
        const ebitda = contributionMargin - fixedCosts;
        const netResult = ebitda; // Ignoring depreciation

        return [
            { id: 1, label: 'Receita Bruta', value: totalRevenue, type: 'credit', level: 1, highlight: true },
            { id: 2, label: '(-) Impostos', value: -taxes, type: 'debit', level: 2 },
            { id: 3, label: '(=) Receita Líquida', value: netRevenue, type: 'neutral', level: 1, highlight: true },
            { id: 4, label: '(-) Custos Variáveis', value: -variableCosts, type: 'debit', level: 2 },
            { id: 5, label: '(=) Margem de Contribuição', value: contributionMargin, type: 'neutral', level: 1, highlight: true },
            { id: 6, label: '(-) Despesas Operacionais', value: -fixedCosts, type: 'debit', level: 2 },
            { id: 9, label: '(=) EBITDA', value: ebitda, type: 'neutral', level: 1, highlight: true, color: 'text-yellow-500' },
            { id: 11, label: '(=) Resultado Líquido', value: netResult, type: 'credit', level: 1, highlight: true, color: 'text-green-500', size: 'text-xl' },
        ];
    }, [transactions]);

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Relatórios Financeiros</h1>
                    <p className="text-gray-400 text-sm">Análise detalhada de resultados e fluxo de caixa.</p>
                </div>

                <div className="flex items-center gap-2 bg-[#1E1E1E] p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setActiveTab('cashflow')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'cashflow'
                            ? 'bg-[#22C55E] text-black shadow-lg shadow-green-500/20 font-bold'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Fluxo de Caixa
                    </button>
                    <button
                        onClick={() => setActiveTab('dre')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'dre'
                            ? 'bg-[#22C55E] text-black shadow-lg shadow-green-500/20 font-bold'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        DRE Gerencial
                    </button>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex justify-between items-center bg-[#1E1E1E] p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-400 bg-[#141414] px-4 py-2 rounded-lg border border-white/5">
                        <Calendar size={16} />
                        <span className="text-sm">Ano: 2026</span>
                    </div>
                </div>
                <button className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-[#141414] px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                    <Download size={18} /> Exportar PDF
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-[#1E1E1E] border border-white/5 rounded-[32px] p-8 min-h-[500px] flex flex-col">
                {activeTab === 'cashflow' ? (
                    <div className="w-full h-[400px] sm:h-[500px]">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-green-500 rounded-full" />
                            Comparativo Receitas x Despesas
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={cashFlowData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#141414', borderColor: '#333', borderRadius: '12px', color: 'white' }}
                                    cursor={{ fill: 'white', opacity: 0.05 }}
                                    formatter={(value) => `R$ ${value.toLocaleString()}`}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="receitas" name="Receitas" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar dataKey="despesas" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <FileText className="text-green-500" />
                            Demonstrativo de Resultados do Exercício
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-white/10">
                                    <tr>
                                        <th className="py-4 text-xs font-bold text-gray-500 uppercase tracking-wider pl-4">Descrição</th>
                                        <th className="py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right pr-4">Valor</th>
                                        <th className="py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right pr-4">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {dreData.map((row) => (
                                        <tr key={row.id} className={`hover:bg-white/[0.02] transition-colors ${row.highlight ? 'bg-white/[0.01]' : ''}`}>
                                            <td className={`py-3 pl-4 ${row.level === 1 ? 'font-bold text-white text-base' : 'text-gray-400 text-sm pl-8'
                                                } ${row.color || ''} ${row.size || ''}`}>
                                                {row.label}
                                            </td>
                                            <td className={`py-3 pr-4 text-right ${row.type === 'debit' ? 'text-red-400' : row.type === 'credit' ? 'text-green-400' : 'text-white'
                                                } ${row.level === 1 ? 'font-bold' : ''} ${row.size || ''}`}>
                                                R$ {Math.abs(row.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 pr-4 text-right text-gray-500 text-sm">
                                                {row.id === 1 ? '100%' : `${((row.value / 125000) * 100).toFixed(1)}%`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinanceReports;
