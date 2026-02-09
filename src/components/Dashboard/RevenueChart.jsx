import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ data }) => {
    // Safe default if no data
    const chartData = data || [
        { name: 'Jan', value: 4000 },
        { name: 'Fev', value: 3000 },
        { name: 'Mar', value: 2000 },
        { name: 'Abr', value: 2780 },
        { name: 'Mai', value: 1890 },
        { name: 'Jun', value: 2390 },
        { name: 'Jul', value: 3490 },
    ];

    return (
        <div className="flex flex-col h-full w-full bg-white/5 border border-white/5 rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 hover:border-brand/30 hover:shadow-neon group">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-text-secondary uppercase tracking-tight group-hover:text-white transition-colors">
                    Receita Mensal
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand bg-brand/10 px-2 py-1 rounded-lg border border-brand/20">
                        +12.5% vs. Mês Anterior
                    </span>
                </div>
            </div>

            <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#b4f03a" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#b4f03a" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `R$${value / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0d1f12',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                            }}
                            itemStyle={{ color: '#b4f03a' }}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#b4f03a"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;
