import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Check, Filter } from 'lucide-react';
import financeService from '../../services/financeService';

const CategoryManager = ({ isOpen, onClose, type = 'expense' }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [newCategory, setNewCategory] = useState({ name: '', group: '' });
    const [editData, setEditData] = useState({ name: '', group: '' });

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            const data = await financeService.getCategories();
            // Filter by type (income usually just one group, expense has many)
            // But we might want to see all or filter. Let's filter by type prop.
            setCategories(data.filter(c => c.type === type));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCategory.name || !newCategory.group) return;
        try {
            await financeService.createCategory({ ...newCategory, type });
            setNewCategory({ name: '', group: '' });
            fetchCategories();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza? Isso pode afetar transações existentes.')) return;
        try {
            await financeService.deleteCategory(id);
            fetchCategories();
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (cat) => {
        setEditingId(cat.id);
        setEditData({ name: cat.name, group: cat.group });
    };

    const saveEdit = async (id) => {
        try {
            await financeService.updateCategory(id, editData);
            setEditingId(null);
            fetchCategories();
        } catch (error) {
            console.error(error);
        }
    };

    if (!isOpen) return null;

    const groupOptions = type === 'income'
        ? [{ value: 'revenue', label: 'Receita' }]
        : [
            { value: 'opex', label: 'Despesa Operacional (OpEx)' },
            { value: 'cogs', label: 'Custo da Venda (COGS)' },
            { value: 'marketing', label: 'Marketing' },
            { value: 'taxes', label: 'Impostos/Taxas' }
        ];

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#1E1E1E] rounded-3xl w-full max-w-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1E1E1E]">
                    <div>
                        <h3 className="text-xl font-bold text-white">Gerenciar Categorias</h3>
                        <p className="text-sm text-gray-400">Classifique suas {type === 'income' ? 'receitas' : 'despesas'} para o Business Plan</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* Create New */}
                    <div className="flex gap-4 mb-6 bg-[#141414] p-4 rounded-xl border border-white/5">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Nome da Categoria</label>
                            <input
                                value={newCategory.name}
                                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                placeholder="Ex: API WhatsApp"
                                className="w-full bg-[#1E1E1E] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                            />
                        </div>
                        <div className="w-48">
                            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Grupo Business Plan</label>
                            <select
                                value={newCategory.group}
                                onChange={e => setNewCategory({ ...newCategory, group: e.target.value })}
                                className="w-full bg-[#1E1E1E] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                            >
                                <option value="">Selecione...</option>
                                {groupOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleCreate}
                                disabled={!newCategory.name || !newCategory.group}
                                className="bg-green-500 text-black p-2 rounded-lg hover:bg-green-400 disabled:opacity-50 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    {loading ? (
                        <p className="text-center text-gray-500">Carregando...</p>
                    ) : (
                        <div className="space-y-2">
                            {categories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between bg-[#141414] p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                                    {editingId === cat.id ? (
                                        <div className="flex gap-4 flex-1 items-center">
                                            <input
                                                value={editData.name}
                                                onChange={e => setEditData({ ...editData, name: e.target.value })}
                                                className="flex-1 bg-[#1E1E1E] border border-white/10 rounded px-2 py-1 text-white text-sm"
                                            />
                                            <select
                                                value={editData.group}
                                                onChange={e => setEditData({ ...editData, group: e.target.value })}
                                                className="w-48 bg-[#1E1E1E] border border-white/10 rounded px-2 py-1 text-white text-sm"
                                            >
                                                {groupOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                            <button onClick={() => saveEdit(cat.id)} className="text-green-500 hover:bg-green-500/10 p-1 rounded">
                                                <Check size={16} />
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:bg-white/5 p-1 rounded">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${cat.group === 'revenue' ? 'bg-green-500' : cat.group === 'cogs' ? 'bg-yellow-500' : cat.group === 'marketing' ? 'bg-blue-500' : 'bg-red-500'}`} />
                                                <span className="text-white font-medium">{cat.name}</span>
                                                <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/5">
                                                    {groupOptions.find(g => g.value === cat.group)?.label || cat.group}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit(cat)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {categories.length === 0 && (
                                <p className="text-center text-gray-600 py-8">Nenhuma categoria encontrada.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;
