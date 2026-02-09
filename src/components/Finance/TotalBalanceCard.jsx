import React from 'react';
import { ArrowUpRight, ArrowUp } from 'lucide-react';

const TotalBalanceCard = () => {
    return (
        <div className="bg-[#1E1E1E] p-6 rounded-[32px] border border-white/5 relative overflow-hidden group">
            {/* Background Gradient/Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">
                <div>
                    <h3 className="text-gray-400 font-medium text-sm mb-2">Saldo Total</h3>
                    <div className="flex items-baseline gap-4 mb-2">
                        <h2 className="text-4xl font-bold text-white tracking-tight">R$ 329.289,12</h2>
                    </div>

                    <div className="inline-flex items-center gap-1.5 bg-[#2A2A2A] px-2 py-1 rounded-md mb-6">
                        <span className="text-green-500 text-xs font-bold">+R$ 12.488,01</span>
                        <span className="bg-[#22C55E]/20 text-[#22C55E] text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <ArrowUp size={10} strokeWidth={3} />
                            45%
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-auto">
                    <button className="bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold py-3.5 rounded-full transition-all active:scale-95 shadow-lg shadow-green-500/20">
                        Solicitar
                    </button>
                    <button className="bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold py-3.5 rounded-full transition-all active:scale-95 shadow-lg shadow-green-500/20">
                        Transferir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TotalBalanceCard;
