import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const SourceDistributionChart = ({ data }) => {
    const chartData = data !== undefined ? data : [
        { name: 'Direct', value: 400 },
        { name: 'Social', value: 300 },
        { name: 'Referral', value: 300 },
        { name: 'Organic', value: 200 },
    ];

    // Calculate total value
    const total = chartData.reduce((acc, item) => acc + (item.value || 0), 0);

    const COLORS = ['#84cc16', '#10b981', '#3b82f6', '#facc15', '#c084fc']; // Lime, Emerald, Blue, Yellow, Purple

    return (
        <div className="flex flex-col h-full w-full bg-background-card border border-white/5 rounded-3xl p-6 hover:shadow-neon transition-all duration-500 group">
            <div className="mb-2">
                <h3 className="text-text-secondary text-xs uppercase font-bold tracking-widest">Origem dos Leads</h3>
            </div>

            <div className="flex-1 w-full min-h-[150px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => {
                                const name = (entry.name || '').toLowerCase();
                                let color = '#94a3b8'; // default slate

                                if (name.includes('google')) color = '#3b82f6'; // Blue
                                else if (name.includes('instagram')) color = '#ec4899'; // Pink
                                else if (name.includes('linkedin')) color = '#0ea5e9'; // Sky
                                else if (name.includes('indicação') || name.includes('referral')) color = '#10b981'; // Emerald
                                else if (name.includes('prospecção') || name.includes('ativa')) color = '#f59e0b'; // Amber
                                else {
                                    // Fallback palette
                                    const PALETTE = ['#84cc16', '#10b981', '#3b82f6', '#facc15', '#c084fc'];
                                    color = PALETTE[index % PALETTE.length];
                                }

                                return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#050a07', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value) => [value, 'Leads']}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '11px', color: '#a1a1aa', bottom: -10 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                    <span className="text-2xl font-extrabold text-white">{total > 1000 ? `${(total / 1000).toFixed(1)}k` : total}</span>
                </div>
            </div>
        </div>
    );
};

export default SourceDistributionChart;
