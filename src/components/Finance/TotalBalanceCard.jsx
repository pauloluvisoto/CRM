import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowUp } from 'lucide-react';
import financeService from '../../services/financeService';
import { formatCurrency } from '../../utils/formatters';

const TotalBalanceCard = ({ balance = 0, projectedBalance = 0, onRequest, onTransfer }) => {
    return (
        <div className="bg-[#1E1E1E] p-6 rounded-[32px] border border-white/5 relative overflow-hidden group">

            {/* Background Gradient/Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">
                <div>
                    <h3 className="text-gray-400 font-medium text-sm mb-2">Saldo Total (Real + Projetado)</h3>
                    <div className="flex items-baseline gap-4 mb-2 max-w-full">
                        <h2 className={`text-4xl font-bold tracking-tight truncate w-full ${balance >= 0 ? "text-green-500" : "text-red-500"}`} title={formatCurrency(balance)}>
                            {formatCurrency(balance)}
                        </h2>
                    </div>

                    <div className="inline-flex items-center gap-1.5 bg-[#2A2A2A] px-2 py-1 rounded-md mb-6">
                        <span className={`text-xs font-bold ${balance >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {balance >= 0 ? "Saldo Positivo" : "Saldo Negativo"}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-auto">
                    <button
                        onClick={onRequest}
                        className="bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold py-3.5 rounded-full transition-all active:scale-95 shadow-lg shadow-green-500/20"
                    >
                        Solicitar
                    </button>
                    <button
                        onClick={onTransfer}
                        className="bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold py-3.5 rounded-full transition-all active:scale-95 shadow-lg shadow-green-500/20"
                    >
                        Transferir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TotalBalanceCard;
