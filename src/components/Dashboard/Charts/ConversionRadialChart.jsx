import React from 'react';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from 'recharts';

const ConversionRadialChart = ({ data }) => {
    const chartData = data !== undefined ? data : [
        { name: 'Visitantes', uv: 100, fill: '#1a3322' },
        { name: 'Leads', uv: 45, fill: '#52525b' },
        { name: 'Clientes', uv: 12.5, fill: '#b4f03a' },
    ];

    return (
        <div className="flex flex-col h-full w-full bg-[#1E1E1E] border border-white/5 rounded-3xl p-6 hover:shadow-neon transition-all duration-500 group">
            <div className="mb-2">
                <h3 className="text-text-secondary text-xs uppercase font-bold tracking-widest">Metas de Conversão</h3>
            </div>

            <div className="flex-1 w-full min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="100%" barSize={10} data={chartData} startAngle={90} endAngle={-270}>
                        <RadialBar
                            minAngle={15}
                            background={{ fill: 'rgba(255,255,255,0.05)' }}
                            clockWise
                            dataKey="uv"
                            cornerRadius={10}
                        />
                        <Legend
                            iconSize={8}
                            layout="vertical"
                            verticalAlign="middle"
                            wrapperStyle={{ fontSize: '11px', color: '#a1a1aa', right: 0 }}
                        />
                        <Tooltip
                            cursor={false}
                            contentStyle={{ backgroundColor: '#050a07', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ConversionRadialChart;
