import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const CustomerGrowthChart = ({ data }) => {
    const chartData = data || [];

    return (
        <div className="flex flex-col h-full w-full bg-background-card border border-white/5 rounded-3xl p-6 hover:shadow-neon transition-all duration-500 group">
            <div className="mb-4">
                <h3 className="text-text-secondary text-xs uppercase font-bold tracking-widest">Crescimento de Clientes</h3>
                <p className="text-xs text-text-muted">Ativos vs. Churn</p>
            </div>

            <div className="flex-1 w-full min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#050a07', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                        />
                        <Line type="monotone" dataKey="active" stroke="#b4f03a" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#b4f03a' }} />
                        <Line type="monotone" dataKey="churn" stroke="#ef4444" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 4, fill: '#ef4444' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CustomerGrowthChart;
