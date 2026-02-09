import React, { useState } from 'react';
import { Plus, CreditCard, MoreVertical, Copy, Shield, Wifi } from 'lucide-react';

const CardComponent = ({ card, selected, onClick }) => (
    <div
        onClick={onClick}
        className={`relative w-80 h-48 rounded-2xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-2xl ${selected ? 'ring-2 ring-green-500 scale-105' : 'opacity-90 hover:opacity-100'
            }`}
        style={{
            background: card.gradient,
            boxShadow: `0 20px 40px -10px ${card.shadowColor}`
        }}
    >
        {/* Header */}
        <div className="flex justify-between items-start">
            <Wifi size={24} className="text-white/80 rotate-90" />
            <span className="font-bold text-white/90 italic tracking-wider">{card.provider}</span>
        </div>

        {/* Chip & Number */}
        <div className="space-y-4">
            <div className="w-12 h-9 bg-yellow-200/20 rounded-md border border-yellow-200/30 flex items-center justify-center backdrop-blur-sm">
                <div className="w-8 h-6 border border-white/20 rounded-sm" />
            </div>
            <div className="flex gap-4 text-white font-mono text-lg tracking-widest shadow-black/10 drop-shadow-md">
                <span>••••</span>
                <span>••••</span>
                <span>••••</span>
                <span>{card.last4}</span>
            </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end text-white/90">
            <div>
                <p className="text-[9px] uppercase tracking-widest opacity-70">Titular</p>
                <p className="font-medium text-sm tracking-wide">{card.holder}</p>
            </div>
            <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest opacity-70">Validade</p>
                <p className="font-medium text-sm tracking-wide">{card.expiry}</p>
            </div>
        </div>
    </div>
);

const WalletView = () => {
    const [selectedCard, setSelectedCard] = useState(0);

    const cards = [
        {
            id: 1,
            holder: 'PAULO SILVA',
            expiry: '12/28',
            last4: '4829',
            provider: 'VISA',
            type: 'Credit',
            balance: 12450.00,
            limit: 25000.00,
            gradient: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
            shadowColor: 'rgba(30, 30, 46, 0.5)'
        },
        {
            id: 2,
            holder: 'PAULO SILVA',
            expiry: '09/27',
            last4: '9921',
            provider: 'MASTERCARD',
            type: 'Debit',
            balance: 8250.50,
            limit: 0,
            gradient: 'linear-gradient(135deg, #22c55e 0%, #14532d 100%)',
            shadowColor: 'rgba(34, 197, 94, 0.3)'
        },
        {
            id: 3,
            holder: 'EMPRESA LTDA',
            expiry: '05/29',
            last4: '1022',
            provider: 'VISA',
            type: 'Corporate',
            balance: 45900.00,
            limit: 100000.00,
            gradient: 'linear-gradient(135deg, #eab308 0%, #854d0e 100%)',
            shadowColor: 'rgba(234, 179, 8, 0.3)'
        }
    ];

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Minhas Carteiras</h1>
                    <p className="text-gray-400">Gerencie seus cartões e contas bancárias.</p>
                </div>
                <button className="bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-green-500/20 active:scale-95">
                    <Plus size={20} /> Adicionar Nova
                </button>
            </div>

            {/* Cards Carousel */}
            <div className="overflow-x-auto pb-10 pt-4 -mx-6 px-6 scrollbar-hide">
                <div className="flex gap-8 w-max">
                    {cards.map((card, index) => (
                        <CardComponent
                            key={card.id}
                            card={card}
                            selected={selectedCard === index}
                            onClick={() => setSelectedCard(index)}
                        />
                    ))}
                    {/* Add Card Placeholder */}
                    <div className="w-20 h-48 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-green-500 hover:border-green-500/50 cursor-pointer transition-all group">
                        <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-green-500/10 flex items-center justify-center transition-colors">
                            <Plus size={20} />
                        </div>
                        <span className="text-xs font-medium">Novo</span>
                    </div>
                </div>
            </div>

            {/* Selected Card Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Balance Info */}
                <div className="bg-[#18181b] rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10" />

                    <h3 className="text-gray-400 font-medium mb-1">Saldo Disponível</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-3xl font-bold text-white">R$ {cards[selectedCard].balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {cards[selectedCard].limit > 0 && (
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-gray-400">Limite Utilizado</span>
                                <span className="text-white font-bold">{Math.round((cards[selectedCard].balance / cards[selectedCard].limit) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${(cards[selectedCard].balance / cards[selectedCard].limit) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-right">Limite Total: R$ {cards[selectedCard].limit.toLocaleString('pt-BR')}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="bg-[#18181b] rounded-3xl p-6 border border-white/5 lg:col-span-2">
                    <h3 className="text-white font-bold mb-6">Ações Rápidas</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { icon: Plus, label: 'Depositar', color: 'bg-blue-500/10 text-blue-500' },
                            { icon: CreditCard, label: 'Pagar Fatura', color: 'bg-orange-500/10 text-orange-500' },
                            { icon: Copy, label: 'Copiar Dados', color: 'bg-purple-500/10 text-purple-500' },
                            { icon: Shield, label: 'Bloquear', color: 'bg-red-500/10 text-red-500' },
                        ].map((action) => (
                            <button key={action.label} className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-[#141414] hover:bg-[#202025] border border-white/5 transition-colors group">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action.color} mb-1 group-hover:scale-110 transition-transform`}>
                                    <action.icon size={20} />
                                </div>
                                <span className="text-sm font-medium text-gray-300">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Transactions for Selected Card */}
            <div className="bg-[#18181b] rounded-3xl p-6 border border-white/5">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-bold">Últimas Movimentações - {cards[selectedCard].provider} end. {cards[selectedCard].last4}</h3>
                    <button className="text-sm text-green-500 hover:text-green-400 font-medium transition-colors">Ver Extrato Completo</button>
                </div>

                <div className="space-y-4">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#141414] hover:bg-[#1a1a1a] transition-colors border border-transparent hover:border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                                    <CreditCard size={18} />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Pagamento via Cartão</p>
                                    <p className="text-xs text-gray-500">Hoje, 14:30</p>
                                </div>
                            </div>
                            <span className="text-red-500 font-bold">- R$ 120,00</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WalletView;
