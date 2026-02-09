import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const PipelineFunnelChart = ({ data, title }) => {
    // If data is provided (even empty), use it. Only fallback if strictly undefined.
    const chartData = data !== undefined ? data : [];

    // Base Colors (Yellow/Amber for Active) - REMOVED RAINBOW EFFECT
    // const activeColors = ['#F59E0B', '#FBBF24', '#D97706', '#FCD34D', '#B45309'];

    // Calculate Total Value
    const totalValue = chartData.reduce((acc, item) => acc + (item.value || 0), 0);
    const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalValue);

    // Dynamic Height Calculation (approx 50px per bar + header/padding)
    const calculatedHeight = Math.max(250, chartData.length * 50 + 100);

    return (
        <div className="flex flex-col w-full bg-background-card border border-white/5 rounded-3xl p-6 hover:shadow-neon transition-all duration-500 group" style={{ height: `${calculatedHeight}px` }}>
            {/* ... header ... */}

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 130, left: 0, bottom: 0 }} barSize={24}>
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="label"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#a1a1aa', width: 180 }}
                            width={180}
                            interval={0}
                        />
                        <Tooltip
                            cursor={{ fill: 'white', opacity: 0.05 }}
                            contentStyle={{ backgroundColor: '#050a07', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1000}>
                            {chartData.map((entry, index) => {
                                let startColor = '#facc15'; // Default Yellow (#facc15)

                                // Override Colors based on status
                                if (entry.status === 'won') startColor = '#84cc16'; // Lime/Green
                                if (entry.status === 'lost') startColor = '#ef4444'; // Red

                                return <Cell key={`cell-${index}`} fill={startColor} />;
                            })}
                            <LabelList dataKey="customLabel" position="right" fill="#fff" fontSize={11} fontWeight="bold" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PipelineFunnelChart;
