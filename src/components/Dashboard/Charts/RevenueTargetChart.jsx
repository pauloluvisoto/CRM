import React from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const RevenueTargetChart = ({ data }) => {
    const chartData = data !== undefined ? data : [
        { name: 'Jan', revenue: 590, target: 800 },
        { name: 'Fev', revenue: 868, target: 967 },
        { name: 'Mar', revenue: 1397, target: 1098 },
        { name: 'Abr', revenue: 1480, target: 1200 },
        { name: 'Mai', revenue: 1520, target: 1108 },
        { name: 'Jun', revenue: 1400, target: 680 },
    ];

    return (
        <div className="flex flex-col h-full w-full bg-[#1E1E1E] border border-white/5 rounded-3xl p-6 hover:shadow-neon transition-all duration-500 group">
            <div className="mb-4">
                <h3 className="text-text-secondary text-xs uppercase font-bold tracking-widest">Receita vs. Meta</h3>
            </div>

            <div className="flex-1 w-full min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 10, bottom: 10, left: 0 }}>
                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#050a07', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        />
                        <Bar dataKey="revenue" barSize={20} fill="#b4f03a" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="target" stroke="#ffffff" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueTargetChart;
