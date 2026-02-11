import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard, Copy, Shield, Wifi, X, Check, Pencil } from 'lucide-react';
import financeService from '../../services/financeService';
import { useAuth } from '../../contexts/AuthContext';
import NewWalletModal from './NewWalletModal';
import { getBrandLogo } from './BrandLogos.jsx';

const CardComponent = ({ card, selected, onClick, onEdit }) => {
    const LogoComponent = getBrandLogo(card.provider);

    return (
        <div
            onClick={onClick}
            className={`relative w-80 h-48 rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-2xl group ${selected ? 'ring-2 ring-green-500 scale-105' : 'opacity-90 hover:opacity-100'
                }`}
            style={{
                background: card.gradient || 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
                boxShadow: `0 20px 40px -10px ${card.shadowColor || 'rgba(0,0,0,0.3)'}`
            }}
        >
            {/* Header */}
            <div className="flex justify-between items-start">
                <Wifi size={24} className="text-white/80 rotate-90" />
                <div className="flex flex-col items-end">
                    {LogoComponent ? (
                        <div className="h-6 mb-1 flex items-center justify-end">
                            <LogoComponent className="h-full w-auto text-white opacity-90" />
                        </div>
                    ) : (
                        <span className="font-bold text-white/90 italic tracking-wider text-lg">{card.provider}</span>
                    )}
                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest mt-1 border border-white/20 px-2 py-0.5 rounded-full">
                        {card.type === 'Credit' ? 'Crédito' : 'Débito'}
                    </span>
                </div>
            </div>

            {/* Edit Button */}
            <button
                onClick={(e) => { e.stopPropagation(); onEdit(card); }}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 text-white/70 hover:bg-black/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                title="Editar Carteira"
            >
                <Pencil size={14} />
            </button>

            {/* Chip & Number */}
            <div className="space-y-3 mt-1">
                <div className="w-10 h-8 bg-yellow-200/20 rounded-md border border-yellow-200/30 flex items-center justify-center backdrop-blur-sm">
                    <div className="w-6 h-5 border border-white/20 rounded-sm" />
                </div>
                <div className="flex gap-3 text-white font-mono text-lg tracking-widest shadow-black/10 drop-shadow-md">
                    <span>••••</span>
                    <span>••••</span>
                    <span>••••</span>
                    <span>{card.last4}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end text-white/90">
                <div>
                    <p className="text-[8px] uppercase tracking-widest opacity-70">Titular</p>
                    <p className="font-medium text-xs tracking-wide uppercase truncate max-w-[140px]">{card.holder_name}</p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] uppercase tracking-widest opacity-70">Validade</p>
                    <p className="font-medium text-xs tracking-wide">{card.expiry_date}</p>
                </div>
            </div>
        </div>
    );
};



// ... (CardComponent and NewWalletModal remain unchanged)

const WalletView = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedCard, setSelectedCard] = useState(0);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState(null); // New state for editing

    const [usedLimits, setUsedLimits] = useState({});

    useEffect(() => {
        loadWallets();
    }, []);

    const loadWallets = async () => {
        try {
            const [walletsData, payablesData] = await Promise.all([
                financeService.getWallets(),
                financeService.getPayables()
            ]);

            setCards(walletsData);

            // Calculate Used Limit per Wallet (Pending Expenses)
            const limits = {};
            walletsData.forEach(w => {
                if (w.type === 'Credit') {
                    const pendingSum = payablesData
                        .filter(p => p.wallet_id === w.id && p.status === 'pending')
                        .reduce((sum, p) => sum + Number(p.amount), 0);
                    limits[w.id] = pendingSum;
                }
            });
            setUsedLimits(limits);

            if (walletsData.length > 0 && selectedCard >= walletsData.length) {
                setSelectedCard(0);
            } else if (walletsData.length === 0) {
                setSelectedCard(0);
            }
        } catch (error) {
            console.error("Error loading wallets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWallet = async (newWallet) => {
        if (!user) {
            alert("Você precisa estar logado para criar uma carteira.");
            return;
        }

        try {
            const payload = {
                ...newWallet,
                balance: Number(newWallet.balance) || 0,
                limit_amount: Number(newWallet.limit_amount) || 0,
                due_day: newWallet.due_day ? Number(newWallet.due_day) : null,
                closing_day: newWallet.closing_day ? Number(newWallet.closing_day) : null,
                created_by: user.id
            };

            if (editingWallet) {
                await financeService.updateWallet(editingWallet.id, payload);
            } else {
                await financeService.createWallet(payload);
            }

            await loadWallets();
            setIsModalOpen(false);
            setEditingWallet(null); // Clear editing wallet after save
        } catch (error) {
            console.error("Error saving wallet:", error);
            alert(`Erro ao salvar carteira: ${error.message}`);
        }
    };

    const handleDeleteWallet = async (id) => {
        if (!confirm("Tem certeza que deseja excluir esta carteira?\n\nEssa ação é irreversível e impedirá a visualização das transações vinculadas.")) return;

        try {
            await financeService.deleteWallet(id);
            await loadWallets();
            setIsModalOpen(false);
            setEditingWallet(null);
            setSelectedCard(0);
        } catch (error) {
            console.error("Error deleting wallet:", error);
            alert("Erro ao excluir carteira.");
        }
    };

    const handleEditWallet = (wallet) => {
        setEditingWallet(wallet);
        setIsModalOpen(true);
    };

    const handleAddWallet = () => {
        setEditingWallet(null); // Ensure no wallet is being edited
        setIsModalOpen(true);
    };

    if (loading) return <div className="text-white p-8">Carregando carteiras...</div>;

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto p-8">
            <NewWalletModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingWallet(null); }} // Clear editing wallet on close
                onSave={handleSaveWallet}
                initialData={editingWallet} // Pass initial data for editing
                onDelete={handleDeleteWallet}
            />

            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Minhas Carteiras</h1>
                    <p className="text-gray-400">Gerencie seus cartões e contas bancárias.</p>
                </div>
                <button
                    onClick={handleAddWallet} // Use handleAddWallet
                    className="bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-green-500/20 active:scale-95"
                >
                    <Plus size={20} /> Adicionar Nova
                </button>
            </div>

            {/* Cards Carousel */}
            <div className="overflow-x-auto pb-10 pt-4 -mx-6 px-6 scrollbar-hide">
                <div className="flex gap-8 w-max">
                    {cards.length === 0 ? (
                        <div className="text-gray-500 italic">Nenhuma carteira encontrada. Adicione uma nova.</div>
                    ) : (
                        cards.map((card, index) => (
                            <CardComponent
                                key={card.id || index}
                                card={card}
                                selected={selectedCard === index}
                                onClick={() => setSelectedCard(index)}
                                onEdit={() => handleEditWallet(card)}
                            />
                        ))
                    )}

                    {/* Add Card Placeholder */}
                    <div
                        onClick={() => setIsModalOpen(true)}
                        className="w-20 h-48 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-green-500 hover:border-green-500/50 cursor-pointer transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-green-500/10 flex items-center justify-center transition-colors">
                            <Plus size={20} />
                        </div>
                        <span className="text-xs font-medium">Novo</span>
                    </div>
                </div>
            </div>

            {/* Selected Card Details */}
            {cards.length > 0 && cards[selectedCard] && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Balance Info */}
                    {/* Balance Info */}
                    <div className="bg-[#18181b] rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10" />

                        <h3 className="text-gray-400 font-medium mb-1">
                            {cards[selectedCard].type === 'Credit' ? 'Limite Disponível' : 'Saldo Disponível'}
                        </h3>
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-3xl font-bold text-white">
                                R$ {Number(
                                    cards[selectedCard].type === 'Credit'
                                        ? (cards[selectedCard].limit_amount - (usedLimits[cards[selectedCard].id] || 0))
                                        : cards[selectedCard].balance
                                ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        {cards[selectedCard].type === 'Credit' && (
                            <div className="flex gap-8 mb-6 border-t border-white/5 pt-4">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Fechamento</p>
                                    <p className="text-white font-bold text-lg">Dia {cards[selectedCard].closing_day || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Vencimento</p>
                                    <p className="text-white font-bold text-lg">Dia {cards[selectedCard].due_day || '-'}</p>
                                </div>
                            </div>
                        )}

                        {cards[selectedCard].limit_amount > 0 && (() => {
                            const card = cards[selectedCard];
                            const isCredit = card.type === 'Credit';
                            const used = isCredit ? (usedLimits[card.id] || 0) : (card.balance < 0 ? Math.abs(card.balance) : 0);
                            const percentage = Math.min(100, Math.max(0, (used / card.limit_amount) * 100));

                            let barColor = 'bg-green-500';
                            if (percentage > 85) barColor = 'bg-red-500';
                            else if (percentage > 50) barColor = 'bg-yellow-500';

                            return (
                                <div>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="text-gray-400">
                                            {isCredit ? 'Limite Utilizado' : 'Cheque Especial Utilizado'}
                                        </span>
                                        <span className={`font-bold ${percentage > 85 ? 'text-red-500' : 'text-white'}`}>
                                            {Math.round(percentage)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${barColor} rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.3)]`}
                                            style={{
                                                width: `${percentage}%`
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-right">
                                        {isCredit ? 'Limite Total: ' : 'Cheque Especial: '}
                                        R$ {Number(card.limit_amount).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Actions */}
                    <div className="bg-[#18181b] rounded-3xl p-6 border border-white/5 lg:col-span-2">
                        <h3 className="text-white font-bold mb-6">Ações Rápidas</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                {
                                    icon: Plus,
                                    label: 'Depositar',
                                    color: 'bg-blue-500/10 text-blue-500',
                                    show: cards[selectedCard].type !== 'Credit'
                                },
                                {
                                    icon: CreditCard,
                                    label: 'Pagar Fatura',
                                    color: 'bg-orange-500/10 text-orange-500',
                                    show: cards[selectedCard].type === 'Credit'
                                },
                                {
                                    icon: Copy,
                                    label: 'Copiar Dados',
                                    color: 'bg-purple-500/10 text-purple-500',
                                    show: true
                                },
                                {
                                    icon: Shield,
                                    label: 'Bloquear',
                                    color: 'bg-red-500/10 text-red-500',
                                    show: true
                                },
                            ].filter(action => action.show).map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => handleAction(action.label)}
                                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-[#141414] hover:bg-[#202025] border border-white/5 transition-colors group"
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action.color} mb-1 group-hover:scale-110 transition-transform`}>
                                        <action.icon size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-300">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Transactions for Selected Card - Placeholder if no real relation yet */}
            {cards.length > 0 && (
                <div className="bg-[#18181b] rounded-3xl p-6 border border-white/5">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-white font-bold">Últimas Movimentações - {cards[selectedCard].provider} end. {cards[selectedCard].last4}</h3>
                        <button
                            onClick={() => navigate('/finance/transactions', { state: { filterWalletId: cards[selectedCard].id } })}
                            className="text-sm text-green-500 hover:text-green-400 font-medium transition-colors"
                        >
                            Ver Extrato Completo
                        </button>
                    </div>

                    <div className="space-y-4">
                        <p className="text-gray-500 text-sm">Nenhuma movimentação recente nesta carteira.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletView;
