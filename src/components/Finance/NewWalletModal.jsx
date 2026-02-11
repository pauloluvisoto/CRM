import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';

const NewWalletModal = ({ isOpen, onClose, onSave, initialData, onDelete }) => {
    const GRADIENTS = [
        { name: 'Padrão', value: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)' },
        { name: 'Roxo', value: 'linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)' },
        { name: 'Azul', value: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)' },
        { name: 'Verde', value: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' },
        { name: 'Vermelho', value: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)' },
        { name: 'Preto', value: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)' },
        { name: 'Gold', value: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)' },
        { name: 'Platinum', value: 'linear-gradient(135deg, #E2E8F0 0%, #475569 100%)' },
    ];
    const CARD_BRANDS = ['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD'];
    const BANKS = ['NUBANK', 'INTER', 'ITAU', 'BRADESCO', 'SANTANDER', 'CAIXA', 'BB', 'C6', 'BTG', 'XP', 'SICOOB', 'SICREDI'];

    const [formData, setFormData] = useState({
        holder_name: '',
        provider: 'VISA',
        custom_provider: '',
        last4: '',
        expiry_date: '',
        balance: '',
        limit_amount: '',
        due_day: '',
        closing_day: '',
        type: 'Credit',
        gradient: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)' // Default gradient
    });

    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const isCredit = initialData.type === 'Credit';
                const list = isCredit ? CARD_BRANDS : BANKS;
                const isKnownProvider = list.includes(initialData.provider);

                setFormData({
                    holder_name: initialData.holder_name || '',
                    provider: isKnownProvider ? initialData.provider : 'OUTRO',
                    custom_provider: isKnownProvider ? '' : initialData.provider,
                    last4: initialData.last4 || '',
                    expiry_date: initialData.expiry_date || '',
                    balance: initialData.balance || '',
                    limit_amount: initialData.limit_amount || '',
                    due_day: initialData.due_day || '',
                    closing_day: initialData.closing_day || '',
                    type: initialData.type || 'Credit',
                    gradient: initialData.gradient || 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)'
                });
            } else {
                setFormData({
                    holder_name: '',
                    provider: 'VISA',
                    custom_provider: '',
                    last4: '',
                    expiry_date: '',
                    balance: '',
                    limit_amount: '',
                    due_day: '',
                    closing_day: '',
                    type: 'Credit',
                    gradient: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)'
                });
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalProvider = formData.provider === 'OUTRO' ? formData.custom_provider : formData.provider;

        // Remove helper field and update provider
        const { custom_provider, ...dataToSave } = formData;
        onSave({ ...dataToSave, provider: finalProvider });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        // Reset provider when switching types to avoid mismatch
        const defaultProvider = newType === 'Credit' ? CARD_BRANDS[0] : BANKS[0];
        setFormData({
            ...formData,
            type: newType,
            provider: defaultProvider,
            custom_provider: ''
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#1E1E1E] rounded-3xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1E1E1E]">
                    <h3 className="text-xl font-bold text-white">{initialData ? 'Editar Carteira' : 'Adicionar Nova Carteira'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Nome do Titular</label>
                        <input
                            required
                            name="holder_name"
                            value={formData.holder_name}
                            onChange={handleChange}
                            className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                            placeholder="Nome impresso no cartão"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Tipo</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleTypeChange}
                                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors appearance-none"
                            >
                                <option value="Credit">Crédito</option>
                                <option value="Debit">Conta Corrente / Débito</option>
                                <option value="Corporate">Corporativo</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">
                                {formData.type === 'Credit' ? 'Bandeira' : 'Banco'}
                            </label>
                            <select
                                name="provider"
                                value={formData.provider}
                                onChange={handleChange}
                                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors appearance-none"
                            >
                                {(formData.type === 'Credit' ? CARD_BRANDS : BANKS).map(brand => (
                                    <option key={brand} value={brand}>{brand}</option>
                                ))}
                                <option value="OUTRO">Outro</option>
                            </select>
                        </div>
                    </div>

                    {formData.provider === 'OUTRO' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Nome do {formData.type === 'Credit' ? 'Bandeira' : 'Banco'}</label>
                            <input
                                required
                                name="custom_provider"
                                value={formData.custom_provider}
                                onChange={handleChange}
                                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                                placeholder={formData.type === 'Credit' ? 'Ex: Diners Club' : 'Ex: Banco Neon'}
                            />
                        </div>
                    )}

                    {formData.type === 'Credit' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Dia do Fechamento</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    name="closing_day"
                                    value={formData.closing_day}
                                    onChange={handleChange}
                                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                                    placeholder="Ex: 5"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Dia do Vencimento</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    name="due_day"
                                    value={formData.due_day}
                                    onChange={handleChange}
                                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                                    placeholder="Ex: 10"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Últimos 4 Dígitos</label>
                            <input
                                required
                                maxLength="4"
                                name="last4"
                                value={formData.last4}
                                onChange={handleChange}
                                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                                placeholder="0000"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Validade</label>
                            <input
                                required
                                maxLength="5"
                                name="expiry_date"
                                value={formData.expiry_date}
                                onChange={handleChange}
                                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                                placeholder="MM/AA"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">
                                {formData.type === 'Credit' ? 'Gasto Atual (Fatura)' : 'Saldo Atual'}
                            </label>
                            <input
                                type="number"
                                required
                                name="balance"
                                value={formData.balance}
                                onChange={handleChange}
                                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">
                                {formData.type === 'Credit' ? 'Limite do Cartão' : 'Cheque Especial (Opcional)'}
                            </label>
                            <input
                                type="number"
                                name="limit_amount"
                                value={formData.limit_amount}
                                onChange={handleChange}
                                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    {/* Color Picker */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Cor do Cartão</label>
                        <div className="flex gap-2 flex-wrap">
                            {GRADIENTS.map((g) => (
                                <button
                                    key={g.name}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, gradient: g.value })}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${formData.gradient === g.value ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent hover:scale-105'}`}
                                    style={{ background: g.value }}
                                    title={g.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-medium">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 rounded-xl bg-green-500 text-black font-bold hover:bg-green-400 transition-colors shadow-lg shadow-green-500/20">{initialData ? 'Salvar Alterações' : 'Salvar Carteira'}</button>
                        </div>
                        {initialData && onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(initialData.id)}
                                className="w-full py-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <Trash2 size={18} /> Excluir Carteira
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewWalletModal;
