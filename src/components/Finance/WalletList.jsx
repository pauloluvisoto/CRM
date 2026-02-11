import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus } from 'lucide-react';

const WalletList = ({ wallets = [], onAddWallet }) => {
    const navigate = useNavigate();
    const defaultColors = ['#3B82F6', '#0EA5E9', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6'];

    return (
        <div className="bg-[#1E1E1E] rounded-[32px] border border-white/5 p-6">
            <div className="flex justify-between items-center mb-6 gap-4">
                <h3 className="text-white font-bold truncate">Minhas Carteiras</h3>
                <button
                    onClick={onAddWallet}
                    className="w-8 h-8 rounded-xl bg-[#2A2A2A] text-white flex-shrink-0 flex items-center justify-center hover:bg-green-500 hover:text-black transition-colors shadow-lg shadow-black/20"
                >
                    <Plus size={18} />
                </button>
            </div>

            <div className="flex flex-col gap-4">
                {wallets.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center">Nenhuma carteira cadastrada.</p>
                ) : (
                    wallets.map((wallet, index) => {
                        const color = wallet.gradient ? '#22C55E' : defaultColors[index % defaultColors.length]; // Use gradient hint or default color
                        const displayValue = wallet.type === 'Credit'
                            ? (wallet.current_usage || 0)
                            : wallet.balance;

                        return (
                            <div
                                key={wallet.id || index}
                                onClick={() => navigate('/finance/wallet')}
                                className="group bg-[#141414] p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-white/10 transition-colors cursor-pointer gap-4"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div
                                        className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold relative shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                                        style={{ backgroundColor: color }}
                                    >
                                        {wallet.provider ? wallet.provider[0] : 'W'}
                                        {wallet.provider === 'VISA' || wallet.provider === 'Mastercard' ? <Wallet size={18} className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5" /> : null}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white text-md truncate" title={`${wallet.provider} ${wallet.last4 ? `...${wallet.last4}` : ''}`}>
                                            {wallet.provider} {wallet.last4 ? `...${wallet.last4}` : ''}
                                        </p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider truncate" title={wallet.holder_name}>{wallet.holder_name}</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-white text-md whitespace-nowrap">R$ {Number(displayValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    {wallet.type === 'Credit' && (
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Limite Utilizado</p>
                                    )}
                                    {wallet.limit_amount > 0 && wallet.type !== 'Credit' && (
                                        <p className="text-xs font-semibold text-gray-400 whitespace-nowrap">Limit: R$ {Number(wallet.limit_amount).toLocaleString('pt-BR')}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default WalletList;
