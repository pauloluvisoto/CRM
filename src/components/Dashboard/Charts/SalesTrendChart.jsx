import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SalesTrendChart = ({ data }) => {
    // Only use mock if data is strictly undefined. If it's [], use [], so it shows empty state correctly.
    const chartData = data !== undefined ? data : [
        { name: 'Jan', value: 4000, previous: 2400 },
        { name: 'Fev', value: 3000, previous: 1398 },
        { name: 'Mar', value: 2000, previous: 9800 },
        { name: 'Abr', value: 2780, previous: 3908 },
        { name: 'Mai', value: 1890, previous: 4800 },
        { name: 'Jun', value: 2390, previous: 3800 },
        { name: 'Jul', value: 3490, previous: 4300 },
    ];

    const totalValue = chartData.reduce((acc, item) => acc + (item.value || 0), 0);
    const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(totalValue);

    // Calculate Trend (Last vs Previous Month)
    const currentMonthVal = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
    const prevMonthVal = chartData.length > 1 ? chartData[chartData.length - 2].value : 0;

    let trendPercent = 0;
    if (prevMonthVal > 0) {
        trendPercent = ((currentMonthVal - prevMonthVal) / prevMonthVal) * 100;
    } else if (currentMonthVal > 0) {
        trendPercent = 100; // New growth from 0
    }

    const isPositive = trendPercent >= 0;
    const formattedTrend = `${isPositive ? '+' : ''}${trendPercent.toFixed(1)}%`;

    return (
        <div className="flex flex-col h-full w-full bg-[#1E1E1E] border border-white/5 rounded-3xl p-6 hover:shadow-neon transition-all duration-500 group">
            {/* Header */}
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h3 className="text-text-secondary text-xs uppercase font-bold tracking-widest mb-1">Vendas Totais</h3>
                    <div className="text-4xl font-bold text-white tracking-tighter">
                        {formattedTotal}
                    </div>
                </div>
                {/* Trend Badge */}
                <div title="Variação em relação ao mês anterior" className={`px-3 py-1 rounded-full text-xs font-bold border cursor-help ${isPositive ? 'bg-lime-400/10 text-brand border-lime-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
                    {formattedTrend}
                </div>
            </div>

            <div className="flex-1 w-full min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#b4f03a" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#b4f03a" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#050a07', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#b4f03a' }}
                            cursor={{ stroke: '#b4f03a', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#b4f03a" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        <Area type="monotone" dataKey="previous" stroke="#52525b" strokeWidth={2} strokeDasharray="3 3" fill="transparent" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SalesTrendChart;
