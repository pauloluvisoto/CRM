import React from 'react';

const RecentIncome = () => {
    const incomes = [
        { name: 'You\'ve got money from Raul', time: 'Today, 13:12 am', amount: 1273, avatar: '99' },
        { name: 'Your request has been received', time: 'Today, 13:12 am', amount: 1273, avatar: '54' },
        { name: 'You\'ve got money from Mala', time: 'Today, 13:12 am', amount: 1273, avatar: '32' },
    ];

    return (
        <div className="bg-[#1E1E1E] rounded-[32px] border border-white/5 p-6 flex flex-col">
            <h3 className="text-white font-bold mb-6">Recebimentos Recentes</h3>
            <div className="space-y-6">
                {incomes.map((item, i) => (
                    <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-transparent group-hover:border-green-500 transition-colors">
                                <img src={`https://i.pravatar.cc/150?u=${item.avatar}`} alt="User" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-bold text-white leading-tight">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.time}</p>
                            </div>
                        </div>
                        <span className="text-green-500 font-bold bg-green-500/10 px-3 py-1 rounded-lg">
                            +${item.amount.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentIncome;
