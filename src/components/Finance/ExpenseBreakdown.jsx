import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
    { name: 'Rent & Living', value: 23382, color: '#64748B' }, // Slate
    { name: 'Investment', value: 28237, color: '#EAB308' },    // Yellow
    { name: 'Savings', value: 18374, color: '#22C55E' },       // Green
    { name: 'Entertainment', value: 9127, color: '#EF4444' },  // Red
    { name: 'Food & Drink', value: 10327, color: '#3B82F6' },  // Blue
];

const ExpenseBreakdown = () => {
    return (
        <div className="bg-[#1E1E1E] rounded-[32px] border border-white/5 p-6 min-h-[340px] flex flex-col">
            <h3 className="text-white font-bold mb-4">Detalhamento de Despesas</h3>

            <div className="flex-1 flex flex-col sm:flex-row items-center gap-4">
                {/* Donut Chart */}
                <div className="w-40 h-40 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" cornerRadius={40} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', borderRadius: '12px', color: 'white' }}
                                itemStyle={{ color: 'white' }}
                                formatter={(value) => `R$ ${value.toLocaleString()}`}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-gray-500 uppercase">Despesa Total</span>
                        <span className="text-sm font-bold text-white">R$ 74.182</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-3 w-full">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-gray-300">{item.name}</span>
                            </div>
                            <span className="text-white font-medium">${item.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExpenseBreakdown;
