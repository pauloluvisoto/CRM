import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Power, Save, X } from 'lucide-react';
import financeService from '../../services/financeService';
import CategorySelect from './CategorySelect';

const FinanceAutomations = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newRule, setNewRule] = useState({
        name: '',
        percentage: 6.0,
        fixed_amount: 0,
        calculation_type: 'percent', // 'percent' | 'fixed'
        target_category_id: '',
        active: true,
        trigger_source: 'income'
    });

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        try {
            setLoading(true);
            const data = await financeService.getAutomationRules();
            setRules(data);
        } catch (error) {
            console.error("Error loading rules:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await financeService.createAutomationRule(newRule);
            setIsCreating(false);
            setNewRule({ name: '', percentage: 6.0, target_category_id: '', active: true, trigger_source: 'income' });
            loadRules();
        } catch (error) {
            console.error("Error creating rule:", error);
            alert("Erro ao criar regra.");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza?')) return;
        try {
            await financeService.deleteAutomationRule(id);
            loadRules();
        } catch (error) {
            console.error("Error deleting rule:", error);
        }
    };

    const toggleActive = async (rule) => {
        try {
            await financeService.updateAutomationRule(rule.id, { active: !rule.active });
            loadRules();
        } catch (error) {
            console.error("Error updating rule:", error);
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-[#141414] text-white">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Automação Financeira</h1>
                    <p className="text-gray-400">Configure custos automáticos gerados a partir de vendas.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-[#22C55E] text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#16a34a] transition-colors"
                >
                    <Plus size={20} /> Nova Regra
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rules.map((rule) => (
                    <div key={rule.id} className={`bg-[#1E1E1E] border ${rule.active ? 'border-green-500/30' : 'border-white/5'} p-6 rounded-2xl relative group transition-all`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{rule.name}</h3>
                                <p className="text-sm text-gray-500">{rule.trigger_source === 'income' ? 'Ao receber Venda' : 'Outro'}</p>
                            </div>
                            <button
                                onClick={() => toggleActive(rule)}
                                className={`p-2 rounded-full ${rule.active ? 'bg-green-500/20 text-green-500' : 'bg-gray-700/50 text-gray-500'}`}
                                title={rule.active ? 'Ativo' : 'Inativo'}
                            >
                                <Power size={18} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <span className="text-4xl font-bold text-white">
                                {rule.calculation_type === 'fixed'
                                    ? `R$ ${Number(rule.fixed_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                    : `${rule.percentage}%`
                                }
                            </span>
                            <span className="text-gray-500 text-sm ml-2">
                                {rule.calculation_type === 'fixed' ? 'por venda' : 'do valor da venda'}
                            </span>
                        </div>

                        <div className="text-sm text-gray-400 mb-4">
                            Gera despesa em: <span className="text-white font-medium">{rule.transaction_categories?.name || 'Sem Categoria'}</span>
                        </div>

                        <div className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDelete(rule.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal (Inline for simplicity) */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1E1E1E] p-6 rounded-3xl w-full max-w-md border border-white/10">
                        <h2 className="text-xl font-bold mb-6">Nova Regra de Automação</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Nome da Regra</label>
                                <input
                                    type="text"
                                    value={newRule.name}
                                    onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                                    className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white focus:border-green-500 outline-none"
                                    placeholder="Ex: Imposto Simples"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Tipo de Cálculo</label>
                                <div className="flex gap-4 mb-4">
                                    <button
                                        onClick={() => setNewRule({ ...newRule, calculation_type: 'percent' })}
                                        className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${newRule.calculation_type === 'percent' ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        Porcentagem (%)
                                    </button>
                                    <button
                                        onClick={() => setNewRule({ ...newRule, calculation_type: 'fixed' })}
                                        className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${newRule.calculation_type === 'fixed' ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        Valor Fixo (R$)
                                    </button>
                                </div>

                                {newRule.calculation_type === 'percent' ? (
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Porcentagem (%)</label>
                                        <input
                                            type="number"
                                            value={newRule.percentage}
                                            onChange={e => setNewRule({ ...newRule, percentage: parseFloat(e.target.value) })}
                                            className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white focus:border-green-500 outline-none"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Valor Fixo (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newRule.fixed_amount}
                                            onChange={e => setNewRule({ ...newRule, fixed_amount: parseFloat(e.target.value) })}
                                            className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white focus:border-green-500 outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Categoria de Despesa Gerada</label>
                                <CategorySelect
                                    type="expense"
                                    value={newRule.target_category_id}
                                    onChange={val => setNewRule({ ...newRule, target_category_id: val })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="flex-1 py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreate}
                                className="flex-1 bg-[#22C55E] text-black py-3 rounded-xl font-bold hover:bg-[#16a34a] transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Salvar Regra
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceAutomations;
