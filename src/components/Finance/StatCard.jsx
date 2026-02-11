import React from 'react';
import { ArrowUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const StatCard = ({ title, amount, percentage, chartColor = "#EAB308", data }) => {
    // Default dummy data if none provided
    const chartData = data || [
        { value: 10 }, { value: 15 }, { value: 12 }, { value: 20 },
        { value: 18 }, { value: 25 }, { value: 22 }, { value: 30 },
        { value: 28 }, { value: 35 }, { value: 40 }
    ];

    return (
        <div className="bg-[#1E1E1E] p-5 rounded-[28px] border border-white/5 flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="relative z-10 w-full">
                <p className="text-gray-400 text-xs font-medium mb-1 truncate pr-2" title={title}>{title}</p>
                <h3 className="text-2xl font-bold tracking-tight mb-2 truncate" style={{ color: chartColor }} title={amount.toString()}>
                    {typeof amount === 'number' ? formatCurrency(amount) : amount}
                </h3>
                {percentage !== undefined && percentage !== 0 && (
                    <div className="inline-flex items-center gap-1.5">
                        <span className="bg-[#22C55E]/10 text-[#22C55E] text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <ArrowUp size={10} strokeWidth={3} />
                            {percentage}%
                        </span>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 right-0 w-[140%] h-[60%] translate-x-[10%] translate-y-[10%] opacity-50 group-hover:scale-105 transition-transform duration-500">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={chartColor}
                            strokeWidth={3}
                            fill={`url(#gradient-${title})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default StatCard;
