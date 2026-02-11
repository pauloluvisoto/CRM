import React, { useState, useEffect } from 'react';
import { Plus, Settings } from 'lucide-react';
import financeService from '../../services/financeService';
import CategoryManager from './CategoryManager';

const CategorySelect = ({ value, onChange, type = 'expense' }) => {
    const [categories, setCategories] = useState([]);
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, [isManagerOpen]); // Re-fetch when manager closes

    const fetchCategories = async () => {
        try {
            const data = await financeService.getCategories();
            setCategories(data.filter(c => c.type === type));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="relative">
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Categoria (Business Plan)</label>
                <div className="flex gap-2">
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="flex-1 bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors appearance-none"
                    >
                        <option value="">Sem Categoria (OpEx Padrão)</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => setIsManagerOpen(true)}
                        className="bg-[#1E1E1E] border border-white/10 rounded-xl px-4 hover:bg-white/5 transition-colors text-gray-300"
                        title="Gerenciar Categorias"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            <CategoryManager
                isOpen={isManagerOpen}
                onClose={() => setIsManagerOpen(false)}
                type={type}
            />
        </>
    );
};

export default CategorySelect;
