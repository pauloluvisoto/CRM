import React from 'react';
import { Wallet, Plus } from 'lucide-react';

const WalletList = () => {
    const wallets = [
        { name: 'Gopay', balance: 100327.18, spent: 12362, percent: 38, color: '#3B82F6' },
        { name: 'Paypal', balance: 147327.18, spent: 12362, percent: 42, color: '#0EA5E9' },
        { name: 'Bibit', balance: 81634.76, spent: 12362, percent: 20, color: '#22C55E' },
    ];

    return (
        <div className="bg-[#1E1E1E] rounded-[32px] border border-white/5 p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold">Minhas Carteiras</h3>
                <button className="w-8 h-8 rounded-xl bg-[#2A2A2A] text-white flex items-center justify-center hover:bg-green-500 hover:text-black transition-colors shadow-lg shadow-black/20">
                    <Plus size={18} />
                </button>
            </div>

            <div className="flex flex-col gap-4">
                {wallets.map((wallet) => (
                    <div key={wallet.name} className="group bg-[#141414] p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-white/10 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold relative shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                                style={{ backgroundColor: wallet.color }}
                            >
                                {wallet.name[0]}
                                {wallet.name === 'Gopay' && <Wallet size={18} className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5" />}
                            </div>
                            <div>
                                <p className="font-bold text-white text-md">{wallet.name}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Gastos: R$ {wallet.spent.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-white text-md">R$ {wallet.balance.toLocaleString()}</p>
                            <p className="text-xs font-semibold" style={{ color: wallet.color }}>{wallet.percent}% do total</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WalletList;
