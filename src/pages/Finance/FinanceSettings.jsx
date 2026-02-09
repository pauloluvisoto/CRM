import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Wallet, Tag, Building2, Save, X } from 'lucide-react';

const FinanceSettings = () => {
    const [activeTab, setActiveTab] = useState('categories'); // categories, accounts, cost_centers
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', type: 'expense', color: '#888888', code: '', balance: 0 });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        const table =
            activeTab === 'categories' ? 'financial_categories' :
                activeTab === 'accounts' ? 'financial_accounts' : 'financial_cost_centers';

        try {
            const { data: rows, error } = await supabase.from(table).select('*').order('created_at');
            if (error) throw error;
            setData(rows || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza? Isso pode afetar transações existentes.')) return;

        const table =
            activeTab === 'categories' ? 'financial_categories' :
                activeTab === 'accounts' ? 'financial_accounts' : 'financial_cost_centers';

        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            setData(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const table =
            activeTab === 'categories' ? 'financial_categories' :
                activeTab === 'accounts' ? 'financial_accounts' : 'financial_cost_centers';

        const payload = { name: newItem.name };

        if (activeTab === 'categories') {
            payload.type = newItem.type;
            payload.color = newItem.color;
        } else if (activeTab === 'accounts') {
            payload.type = 'bank'; // Default for now
            payload.balance = parseFloat(newItem.balance) || 0;
        } else if (activeTab === 'cost_centers') {
            payload.code = newItem.code;
        }

        try {
            const { data: inserted, error } = await supabase.from(table).insert([payload]).select();
            if (error) throw error;

            setData(prev => [...prev, inserted[0]]);
            setIsAdding(false);
            setNewItem({ name: '', type: 'expense', color: '#888888', code: '', balance: 0 });
        } catch (err) {
            alert('Erro ao adicionar: ' + err.message);
        }
    };

    return (
        <div className="settings-page">
            <h1 className="page-title">Configurações Financeiras</h1>

            <div className="tabs">
                <button className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
                    <Tag size={16} /> Categorias
                </button>
                <button className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`} onClick={() => setActiveTab('accounts')}>
                    <Wallet size={16} /> Contas Bancárias
                </button>
                <button className={`tab-btn ${activeTab === 'cost_centers' ? 'active' : ''}`} onClick={() => setActiveTab('cost_centers')}>
                    <Building2 size={16} /> Centros de Custo
                </button>
            </div>

            <div className="content-area">
                <div className="list-header">
                    <h2>Gerenciar {activeTab === 'categories' ? 'Categorias' : activeTab === 'accounts' ? 'Contas' : 'Centros de Custo'}</h2>
                    <button className="btn-add" onClick={() => setIsAdding(true)}><Plus size={16} /> Adicionar</button>
                </div>

                {isAdding && (
                    <form className="add-form" onSubmit={handleAdd}>
                        <div className="form-group">
                            <input autoFocus type="text" placeholder="Nome" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required />
                        </div>

                        {activeTab === 'categories' && (
                            <>
                                <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })}>
                                    <option value="expense">Despesa</option>
                                    <option value="income">Receita</option>
                                </select>
                                <input type="color" value={newItem.color} onChange={e => setNewItem({ ...newItem, color: e.target.value })} title="Cor da etiqueta" />
                            </>
                        )}

                        {activeTab === 'accounts' && (
                            <input type="number" placeholder="Saldo Inicial" value={newItem.balance} onChange={e => setNewItem({ ...newItem, balance: e.target.value })} />
                        )}

                        {activeTab === 'cost_centers' && (
                            <input type="text" placeholder="Código (Opcional)" value={newItem.code} onChange={e => setNewItem({ ...newItem, code: e.target.value })} />
                        )}

                        <button type="submit" className="btn-save"><Save size={16} /></button>
                        <button type="button" className="btn-cancel" onClick={() => setIsAdding(false)}><X size={16} /></button>
                    </form>
                )}

                <div className="items-list">
                    {loading ? <p>Carregando...</p> : data.map(item => (
                        <div key={item.id} className="list-item">
                            <div className="item-info">
                                <span className="item-name">{item.name}</span>
                                {activeTab === 'categories' && (
                                    <span className="badge" style={{ backgroundColor: item.color + '30', color: item.color }}>
                                        {item.type === 'income' ? 'Receita' : 'Despesa'}
                                    </span>
                                )}
                                {activeTab === 'accounts' && (
                                    <span className="meta">Saldo: R$ {item.balance}</span>
                                )}
                                {activeTab === 'cost_centers' && item.code && (
                                    <span className="meta">Cód: {item.code}</span>
                                )}
                            </div>
                            <button className="btn-delete" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .settings-page { max-width: 800px; margin: 0 auto; pading: 2rem; color: var(--text-primary); }
                .page-title { margin-bottom: 2rem; font-size: 1.8rem; }
                
                .tabs { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
                .tab-btn { background: none; border: none; color: var(--text-secondary); padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; border-radius: 6px; transition: all 0.2s; }
                .tab-btn.active { background: var(--bg-hover); color: var(--primary); }
                
                .content-area { background: var(--bg-secondary); border-radius: 12px; padding: 2rem; border: 1px solid var(--border-color); }
                .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .list-header h2 { font-size: 1.2rem; margin: 0; }
                
                .btn-add { background: var(--primary); color: black; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer; }
                
                .add-form { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background: var(--bg-primary); padding: 1rem; border-radius: 8px; align-items: center; }
                .add-form input, .add-form select { padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: white; }
                .form-group { flex: 1; }
                .form-group input { width: 100%; }
                
                .btn-save { background: #22c55e; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer; display: flex; align-items: center; }
                .btn-cancel { background: #ef4444; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer; display: flex; align-items: center; }

                .items-list { display: flex; flex-direction: column; gap: 0.5rem; }
                .list-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-primary); border-radius: 8px; border: 1px solid var(--border-color); }
                .item-info { display: flex; align-items: center; gap: 1rem; }
                .item-name { font-weight: 500; }
                
                .badge { font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
                .meta { font-size: 0.85rem; color: var(--text-secondary); }
                
                .btn-delete { background: none; border: none; color: var(--text-secondary); cursor: pointer; transition: color 0.2s; }
                .btn-delete:hover { color: #ef4444; }
            `}</style>
        </div>
    );
};

export default FinanceSettings;
