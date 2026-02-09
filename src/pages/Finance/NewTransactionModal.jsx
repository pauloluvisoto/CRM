import React, { useState, useEffect } from 'react';
import { X, Save, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const NewTransactionModal = ({ isOpen, onClose, onSuccess, initialType = 'expense' }) => {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [costCenters, setCostCenters] = useState([]);

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: initialType,
        status: 'pending',
        due_date: new Date().toISOString().split('T')[0],
        category_id: '',
        account_id: '',
        cost_center_id: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({ ...prev, type: initialType }));
            fetchOptions();
        }
    }, [isOpen, initialType]);

    const fetchOptions = async () => {
        const { data: catData } = await supabase.from('financial_categories').select('*');
        const { data: accData } = await supabase.from('financial_accounts').select('*');
        const { data: ccData } = await supabase.from('financial_cost_centers').select('*');

        setCategories(catData || []);
        setAccounts(accData || []);
        setCostCenters(ccData || []);

        // Set defaults if available
        if (accData?.length > 0 && !formData.account_id) {
            setFormData(prev => ({ ...prev, account_id: accData[0].id }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from('transactions').insert([{
                description: formData.description,
                amount: parseFloat(formData.amount),
                type: formData.type,
                status: formData.status,
                due_date: formData.due_date,
                category_id: formData.category_id || null,
                account_id: formData.account_id,
                cost_center_id: formData.cost_center_id || null,
                paid_date: formData.status === 'paid' ? new Date().toISOString() : null
            }]);

            if (error) throw error;

            if (onSuccess) onSuccess();
            onClose();
            setFormData({
                description: '', amount: '', type: 'expense', status: 'pending',
                due_date: new Date().toISOString().split('T')[0], category_id: '', account_id: ''
            });

        } catch (err) {
            console.error('Error creating transaction:', err);
            alert('Erro ao criar transação: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredCategories = categories.filter(c => c.type === formData.type);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}><X size={20} /></button>
                <div className="modal-header">
                    <h2>Nova Transação</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Type Toggle */}
                    <div className="type-toggle">
                        <button
                            type="button"
                            className={`type-btn expense ${formData.type === 'expense' ? 'active' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                        >
                            <ArrowDownLeft size={16} /> Despesa
                        </button>
                        <button
                            type="button"
                            className={`type-btn income ${formData.type === 'income' ? 'active' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                        >
                            <ArrowUpRight size={16} /> Receita
                        </button>
                    </div>

                    <div className="form-group">
                        <label>Descrição</label>
                        <input name="description" className="form-input" required value={formData.description} onChange={handleChange} placeholder="Ex: Conta de Luz" />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Valor (R$)</label>
                            <input type="number" name="amount" step="0.01" className="form-input" required value={formData.amount} onChange={handleChange} placeholder="0.00" />
                        </div>
                        <div className="form-group">
                            <label>Vencimento</label>
                            <input type="date" name="due_date" className="form-input" required value={formData.due_date} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Categoria</label>
                            <select name="category_id" className="form-input" value={formData.category_id} onChange={handleChange}>
                                <option value="">Sem categoria</option>
                                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Conta</label>
                            <select name="account_id" className="form-input" required value={formData.account_id} onChange={handleChange}>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Status</label>
                        <select name="status" className="form-input" value={formData.status} onChange={handleChange}>
                            <option value="pending">Pendente (Agendar)</option>
                            <option value="paid">{formData.type === 'expense' ? 'Pago' : 'Recebido'}</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Centro de Custo</label>
                        <select name="cost_center_id" className="form-input" value={formData.cost_center_id} onChange={handleChange}>
                            <option value="">Nenhum</option>
                            {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                        </select>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Salvando...' : <><Save size={18} /> Salvar</>}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
                .modal-content { background: var(--bg-secondary); padding: 2rem; border-radius: 12px; width: 100%; max-width: 500px; position: relative; border: 1px solid var(--border-color); }
                .close-btn { position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: var(--text-secondary); cursor: pointer; }
                .modal-header { margin-bottom: 1.5rem; }
                .modal-header h2 { font-size: 1.5rem; color: var(--text-primary); margin: 0; }
                
                .form-group { margin-bottom: 1.25rem; flex: 1; }
                .form-row { display: flex; gap: 1rem; }
                .form-group label { display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem; }
                .form-input { width: 100%; padding: 0.75rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); }
                
                .type-toggle { display: flex; gap: 1rem; margin-bottom: 1.5rem; background: var(--bg-primary); padding: 4px; border-radius: 8px; }
                .type-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0.6rem; border: none; border-radius: 6px; cursor: pointer; background: transparent; color: var(--text-secondary); font-weight: 500; transition: all 0.2s; }
                .type-btn.expense.active { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
                .type-btn.income.active { background: rgba(34, 197, 94, 0.2); color: #22c55e; }

                .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
                .btn-cancel { background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; }
                .btn-submit { background: var(--primary); border: none; color: black; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default NewTransactionModal;
