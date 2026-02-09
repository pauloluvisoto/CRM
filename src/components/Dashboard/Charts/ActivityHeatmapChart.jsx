import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ActivityHeatmapChart = ({ data }) => {
    // If no data, default to empty array instead of random mock
    const chartData = data || [];

    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

    return (
        <div className="flex flex-col h-full w-full bg-background-card border border-white/5 rounded-3xl p-6 hover:shadow-neon transition-all duration-500 group">
            <div className="mb-4">
                <h3 className="text-text-secondary text-xs uppercase font-bold tracking-widest">Mapa de Atividade</h3>
                <p className="text-xs text-text-muted">Intensidade de leads por dia</p>
            </div>

            <div className="flex-1 w-full min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                        <XAxis type="number" dataKey="day" name="dia" tickFormatter={d => days[d]} tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
                        <YAxis type="number" dataKey="hour" name="hora" tickFormatter={h => `${h + 8}h`} tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
                        <ZAxis type="number" dataKey="value" range={[20, 250]} />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            wrapperStyle={{ zIndex: 100 }}
                            content={({ payload }) => {
                                if (payload && payload.length) {
                                    const { day, hour, value } = payload[0].payload;
                                    return (
                                        <div className="bg-[#050a07] border border-white/10 p-2 rounded-lg shadow-xl text-xs">
                                            <p className="font-bold text-brand">{value} Leads</p>
                                            <p className="text-text-secondary">{days[day]} às {hour + 8}:00</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Scatter data={chartData} shape="circle">
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`rgba(180, 240, 58, ${entry.value / 100})`} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ActivityHeatmapChart;
