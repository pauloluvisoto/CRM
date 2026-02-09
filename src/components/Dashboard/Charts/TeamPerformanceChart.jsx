import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TeamPerformanceChart = ({ data }) => {
    const chartData = data !== undefined ? data : [
        { name: 'Ana', sales: 45, calls: 120 },
        { name: 'João', sales: 38, calls: 98 },
        { name: 'Carlos', sales: 52, calls: 110 },
        { name: 'Maria', sales: 28, calls: 85 },
    ];

    return (
        <div className="flex flex-col h-full w-full bg-background-card border border-white/5 rounded-3xl p-6 hover:shadow-neon transition-all duration-500 group">
            <div className="mb-4 flex justify-between items-start">
                <div>
                    <h3 className="text-text-secondary text-xs uppercase font-bold tracking-widest">Performance da Equipe</h3>
                    <p className="text-xs text-text-muted">Vendas vs. Chamadas</p>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#050a07', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        />
                        <Bar dataKey="calls" fill="#1a3322" radius={[4, 4, 0, 0]} stackId="a" />
                        <Bar dataKey="sales" fill="#b4f03a" radius={[4, 4, 0, 0]} stackId="a" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TeamPerformanceChart;
