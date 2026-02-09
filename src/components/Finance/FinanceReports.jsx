import React, { useState } from 'react';
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

const FinanceReports = () => {
    const [activeTab, setActiveTab] = useState('cashflow'); // 'cashflow' or 'dre'

    // Mock Data for Cash Flow
    const cashFlowData = [
        { name: 'Jan', receitas: 45000, despesas: 32000 },
        { name: 'Fev', receitas: 52000, despesas: 28000 },
        { name: 'Mar', receitas: 48000, despesas: 41000 },
        { name: 'Abr', receitas: 61000, despesas: 35000 },
        { name: 'Mai', receitas: 55000, despesas: 30000 },
        { name: 'Jun', receitas: 67000, despesas: 38000 },
    ];

    // Mock Data for DRE
    const dreData = [
        { id: 1, label: 'Receita Bruta', value: 125000.00, type: 'credit', level: 1, highlight: true },
        { id: 2, label: '(-) Impostos sobre Venda', value: -12500.00, type: 'debit', level: 2 },
        { id: 3, label: '(=) Receita Líquida', value: 112500.00, type: 'neutral', level: 1, highlight: true },
        { id: 4, label: '(-) Custos Variáveis', value: -35000.00, type: 'debit', level: 2 },
        { id: 5, label: '(=) Margem de Contribuição', value: 77500.00, type: 'neutral', level: 1, highlight: true },
        { id: 6, label: '(-) Despesas com Pessoal', value: -25000.00, type: 'debit', level: 2 },
        { id: 7, label: '(-) Despesas Administrativas', value: -12000.00, type: 'debit', level: 2 },
        { id: 8, label: '(-) Despesas de Marketing', value: -8500.00, type: 'debit', level: 2 },
        { id: 9, label: '(=) EBITDA', value: 32000.00, type: 'neutral', level: 1, highlight: true, color: 'text-yellow-500' },
        { id: 10, label: '(-) Depreciação e Amortização', value: -2000.00, type: 'debit', level: 2 },
        { id: 11, label: '(=) Resultado Líquido', value: 30000.00, type: 'credit', level: 1, highlight: true, color: 'text-green-500', size: 'text-xl' },
    ];

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
