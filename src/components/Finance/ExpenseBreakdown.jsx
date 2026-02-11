import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const COLORS = ['#64748B', '#EAB308', '#22C55E', '#EF4444', '#3B82F6', '#8B5CF6', '#F97316'];

const ExpenseBreakdown = ({ data = [], totalExpense = 0 }) => {
    // Fallback if no data
    const chartData = data.length > 0 ? data : [{ name: 'Sem dados', value: 1 }];

    return (
        <div className="bg-[#1E1E1E] rounded-[32px] border border-white/5 p-6 min-h-[340px] flex flex-col">
            <h3 className="text-white font-bold mb-4">Detalhamento de Despesas</h3>

            <div className="flex-1 flex flex-col items-center gap-6">
                {/* Donut Chart */}
                <div className="w-48 h-48 relative flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={data.length > 0 ? COLORS[index % COLORS.length] : '#333'} stroke="none" cornerRadius={40} />
                                ))}
                            </Pie>
                            {data.length > 0 && (
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', borderRadius: '12px', color: 'white' }}
                                    itemStyle={{ color: 'white' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                            )}
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
                        <span className="text-[10px] text-gray-500 uppercase leading-tight mb-1">Despesa Total</span>
                        <span className="text-sm font-bold text-white">
                            {formatCurrency(totalExpense)}
                        </span>
                    </div>
                </div>

                {/* Legend */}
                <div className="w-full space-y-3 overflow-y-auto max-h-[220px] custom-scrollbar px-2">
                    {data.length > 0 ? (
                        data.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between text-sm py-1 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-gray-300 truncate max-w-[150px] sm:max-w-none" title={item.name}>{item.name}</span>
                                </div>
                                <span className="text-white font-medium whitespace-nowrap">{formatCurrency(item.value)}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center text-xs">Nenhuma despesa registrada.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpenseBreakdown;
