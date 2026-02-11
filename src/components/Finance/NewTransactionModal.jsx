import React, { useState } from 'react';
import { X } from 'lucide-react';
import CategorySelect from './CategorySelect';

const NewTransactionModal = ({ isOpen, onClose, onSave, initialType = 'income', transactionToEdit = null, wallets = [] }) => {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        type: initialType,
        wallet_id: '',
        category_id: '',
        recurrence: 'none',
        installments: 2
    });

    React.useEffect(() => {
        if (isOpen) {
            if (transactionToEdit) {
                // Formatting date to YYYY-MM-DD for input
                let dateValue = new Date().toISOString().split('T')[0];
                if (transactionToEdit.rawDate) {
                    dateValue = new Date(transactionToEdit.rawDate).toISOString().split('T')[0];
                } else if (transactionToEdit.date) {
                    dateValue = new Date().toISOString().split('T')[0];
                }

                setFormData({
                    description: transactionToEdit.description || '',
                    amount: transactionToEdit.amount || '',
                    date: dateValue,
                    status: transactionToEdit.status === 'completed' ? 'paid' : 'pending',
                    type: transactionToEdit.type || initialType,
                    wallet_id: transactionToEdit.wallet_id || (wallets.length > 0 ? wallets[0].id : ''),
                    category_id: transactionToEdit.category_id || ''
                });
            } else {
                setFormData({
                    description: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    status: 'pending',
                    type: initialType,
                    wallet_id: wallets.length > 0 ? wallets[0].id : '',
                    category_id: ''
                });
            }
        }
    }, [isOpen, transactionToEdit, initialType, wallets]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#1E1E1E] rounded-3xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1E1E1E]">
                    <h3 className="text-xl font-bold text-white">
                        {transactionToEdit
                            ? (formData.type === 'income' ? 'Editar Recebimento' : 'Editar Despesa')
                            : (formData.type === 'income' ? 'Solicitar / Novo Recebimento' : 'Transferir / Nova Despesa')
                        }
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Descrição</label>
                        <input
                            required
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                            placeholder={formData.type === 'income' ? "Ex: Venda de Serviço" : "Ex: Pagamento de Fornecedor"}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Valor</label>
                            <input
                                type="number"
                                required
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Data</label>
                            <input
                                type="date"
                                required
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <CategorySelect
                            value={formData.category_id}
                            onChange={(val) => setFormData({ ...formData, category_id: val })}
                            type={formData.type}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Carteira / Conta</label>
                        <select
                            name="wallet_id"
                            value={formData.wallet_id || ''}
                            onChange={handleChange}
                            className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors appearance-none"
                        >
                            <option value="">Selecione uma carteira...</option>
                            {wallets && wallets
                                .filter(w => formData.type === 'income' ? w.type !== 'Credit' : true)
                                .map(wallet => (
                                    <option key={wallet.id} value={wallet.id}>
                                        {wallet.holder_name} ({wallet.provider})
                                    </option>
                                ))}
                        </select>
                    </div>

                    {!(wallets.find(w => w.id === formData.wallet_id)?.type === 'Credit' && formData.type === 'expense') && (
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors appearance-none"
                            >
                                <option value="pending">Pendente</option>
                                <option value="paid">{formData.type === 'income' ? 'Recebido' : 'Pago'}</option>
                            </select>
                        </div>
                    )}

                    {/* Recurrence Options */}
                    <div className="bg-[#141414] rounded-xl p-3 border border-white/5">
                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Repetição</label>
                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, recurrence: 'none' })}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${formData.recurrence === 'none' ? 'bg-white text-black' : 'bg-[#1E1E1E] text-gray-400 hover:text-white'}`}
                            >
                                Único
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, recurrence: 'installment' })}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${formData.recurrence === 'installment' ? 'bg-white text-black' : 'bg-[#1E1E1E] text-gray-400 hover:text-white'}`}
                            >
                                Parcelado
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, recurrence: 'recurring' })}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${formData.recurrence === 'recurring' ? 'bg-white text-black' : 'bg-[#1E1E1E] text-gray-400 hover:text-white'}`}
                            >
                                Recorrente
                            </button>
                        </div>

                        {formData.recurrence !== 'none' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">
                                    {formData.recurrence === 'installment' ? 'Número de Parcelas' : 'Repetir por (Meses)'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="360"
                                    name="installments"
                                    value={formData.installments === 0 ? 0 : (formData.installments || 2)}
                                    onChange={handleChange}
                                    className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
                                />
                                <p className="text-[10px] text-gray-500 mt-2">
                                    {formData.recurrence === 'installment'
                                        ? `Serão criadas ${formData.installments || 2} transações de ${(Number(formData.amount) / (formData.installments || 2)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`
                                        : (formData.installments == 0
                                            ? "Renovação Automática: Uma nova transação será criada automaticamente quando esta for paga."
                                            : `Serão criadas ${formData.installments || 2} transações idênticas de ${(Number(formData.amount)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`
                                        )
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-medium">Cancelar</button>

                        {(wallets.find(w => w.id === formData.wallet_id)?.type === 'Credit' && formData.type === 'expense') ? (
                            <button
                                type="button"
                                onClick={() => onSave({ ...formData, status: 'pending' })}
                                className="flex-1 py-3 rounded-xl bg-orange-500 text-black font-bold hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20"
                            >
                                Salvar Cobrança
                            </button>
                        ) : (
                            <>
                                {formData.status === 'pending' && (
                                    <button
                                        type="button"
                                        onClick={() => onSave({ ...formData, status: 'pending' })}
                                        className="flex-1 py-3 rounded-xl bg-[#2A2A2A] text-white font-medium hover:bg-[#333] transition-colors border border-white/5"
                                    >
                                        Salvar Pendente
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => onSave({ ...formData, status: 'paid' })}
                                    className="flex-1 py-3 rounded-xl bg-green-500 text-black font-bold hover:bg-green-400 transition-colors shadow-lg shadow-green-500/20"
                                >
                                    {formData.type === 'income' ? 'Confirmar Recebimento' : 'Confirmar Pagamento'}
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div >
        </div >
    );
};

export default NewTransactionModal;
