import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Save, TrendingUp, Copy } from 'lucide-react';

const GoalsSettings = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedYear, setSelectedYear] = useState(2026);
    const [availableYears, setAvailableYears] = useState([]);

    // Business Variables
    const [ticketPrice, setTicketPrice] = useState(597);
    const [commissionRate, setCommissionRate] = useState(0.20);
    const [minRevenue, setMinRevenue] = useState(1194);
    const [churnRate, setChurnRate] = useState(5); // %
    const [defaultCogs, setDefaultCogs] = useState(251);
    const [defaultOpex, setDefaultOpex] = useState(32000);

    useEffect(() => {
        fetchBusinessVariables();
        fetchAvailableYears();
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchGoals();
        }
    }, [selectedYear]);

    const fetchBusinessVariables = async () => {
        try {
            const { data, error } = await supabase.from('business_variables').select('*');
            if (error) throw error;

            data?.forEach(v => {
                if (v.var_key === 'ticket_price') setTicketPrice(v.var_value);
                if (v.var_key === 'commission_rate') setCommissionRate(v.var_value);
                if (v.var_key === 'min_revenue_guaranteed') setMinRevenue(v.var_value);
                if (v.var_key === 'churn_rate') setChurnRate(v.var_value);
                if (v.var_key === 'default_cogs') setDefaultCogs(v.var_value);
                if (v.var_key === 'default_opex') setDefaultOpex(v.var_value);
            });
        } catch (err) {
            console.error('Error fetching variables:', err);
        }
    };

    const fetchAvailableYears = async () => {
        try {
            const { data, error } = await supabase
                .from('financial_goals')
                .select('year')
                .order('year', { ascending: false });

            if (error) throw error;
            const uniqueYears = [...new Set(data?.map(g => g.year) || [])];
            setAvailableYears(uniqueYears);
        } catch (err) {
            console.error('Error fetching years:', err);
        }
    };

    const fetchGoals = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('financial_goals')
                .select('*')
                .eq('year', selectedYear)
                .order('month');

            if (error) throw error;

            // Calculate accumulated customers and auto-compute metrics
            let accumulatedCustomers = 0;
            const processedGoals = (data || []).map((g, index) => {
                const newSales = g.target_sales_qty || 0;
                const churnLoss = index > 0 ? Math.ceil(accumulatedCustomers * (churnRate / 100)) : 0;
                accumulatedCustomers = accumulatedCustomers + newSales - churnLoss;

                // Revenue from ALL customers (recurring)
                const revenueFixed = accumulatedCustomers * ticketPrice;
                const revenueVariable = accumulatedCustomers * (minRevenue * commissionRate);
                const totalRevenue = revenueFixed + revenueVariable;

                // COGS ALWAYS calculated (clientes × 251) - NEVER use DB value
                const cogsPerCustomer = 251;
                const actualCogs = accumulatedCustomers * cogsPerCustomer;

                // OPEX uses manual value or default
                const actualOpex = (g.target_opex && g.target_opex > 0) ? g.target_opex : defaultOpex;

                // Calculate metrics
                const grossMargin = totalRevenue - actualCogs;
                const grossMarginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

                const ebitda = totalRevenue - actualCogs - actualOpex;
                const ebitdaPct = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;


                // Net profit: use EBITDA unless user explicitly overrode it
                const hasManualNetProfit = g.target_net_profit !== null && g.target_net_profit !== undefined && g.target_net_profit !== 0 && g.target_net_profit !== ebitda;
                const netProfit = hasManualNetProfit ? g.target_net_profit : ebitda;
                const netProfitPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

                return {
                    ...g,
                    accumulated_customers: accumulatedCustomers,
                    target_revenue_fixed: revenueFixed,
                    target_revenue_variable: revenueVariable,
                    target_cogs: actualCogs,
                    target_opex: actualOpex,
                    target_gross_margin: grossMargin,
                    target_gross_margin_pct: grossMarginPct,
                    target_ebitda: ebitda,
                    target_ebitda_pct: ebitdaPct,
                    target_net_profit: netProfit,
                    target_net_profit_pct: netProfitPct,
                    churn_loss: churnLoss
                };
            });

            setGoals(processedGoals);
        } catch (err) {
            console.error('Error fetching goals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (id, field, value) => {
        setGoals(prev => {
            const newGoals = prev.map(g => {
                if (g.id !== id) return g;
                return { ...g, [field]: parseFloat(value) || 0 };
            });

            // Recalculate all metrics after change
            return recalculateMetrics(newGoals);
        });
    };

    const recalculateMetrics = (goalsList) => {
        let accumulatedCustomers = 0;

        return goalsList.map((g, index) => {
            const newSales = g.target_sales_qty || 0;
            const churnLoss = index > 0 ? Math.ceil(accumulatedCustomers * (churnRate / 100)) : 0;
            accumulatedCustomers = accumulatedCustomers + newSales - churnLoss;

            // Revenue from ALL customers (both fixed and variable are recurring)
            const revenueFixed = accumulatedCustomers * ticketPrice;
            const revenueVariable = accumulatedCustomers * (minRevenue * commissionRate);
            const totalRevenue = revenueFixed + revenueVariable;

            // COGS ALWAYS calculated - IGNORE any manual input
            const cogsPerCustomer = 251;
            const actualCogs = accumulatedCustomers * cogsPerCustomer;

            const actualOpex = (g.target_opex && g.target_opex > 0) ? g.target_opex : defaultOpex;

            const grossMargin = totalRevenue - actualCogs;
            const grossMarginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

            const ebitda = totalRevenue - actualCogs - actualOpex;
            const ebitdaPct = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

            const hasManualNetProfit = g.target_net_profit !== null && g.target_net_profit !== undefined && g.target_net_profit !== 0 && g.target_net_profit !== ebitda;
            const netProfit = hasManualNetProfit ? g.target_net_profit : ebitda;
            const netProfitPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

            return {
                ...g,
                accumulated_customers: accumulatedCustomers,
                target_revenue_fixed: revenueFixed,
                target_revenue_variable: revenueVariable,
                target_cogs: actualCogs,
                target_opex: actualOpex,
                target_gross_margin: grossMargin,
                target_gross_margin_pct: grossMarginPct,
                target_ebitda: ebitda,
                target_ebitda_pct: ebitdaPct,
                target_net_profit: netProfit,
                target_net_profit_pct: netProfitPct,
                churn_loss: churnLoss
            };
        });
    };

    const handleApplyDefaults = () => {
        setGoals(prev => prev.map(g => ({
            ...g,
            target_cogs: defaultCogs,
            target_opex: defaultOpex
        })));
    };

    const handleSaveVariables = async () => {
        try {
            await supabase.from('business_variables').upsert([
                { var_key: 'ticket_price', var_value: ticketPrice },
                { var_key: 'commission_rate', var_value: commissionRate },
                { var_key: 'min_revenue_guaranteed', var_value: minRevenue },
                { var_key: 'churn_rate', var_value: churnRate },
                { var_key: 'default_cogs', var_value: defaultCogs },
                { var_key: 'default_opex', var_value: defaultOpex }
            ]);
            alert('Variáveis salvas!');
        } catch (err) {
            alert('Erro: ' + err.message);
        }
    };

    const handleCreateNewYear = async () => {
        const newYear = selectedYear + 1;
        try {
            const inserts = Array.from({ length: 12 }, (_, i) => ({
                year: newYear,
                month: i + 1
            }));

            const { error } = await supabase.from('financial_goals').insert(inserts);
            if (error) throw error;

            await fetchAvailableYears();
            setSelectedYear(newYear);
            alert(`Ano ${newYear} criado com sucesso!`);
        } catch (err) {
            alert('Erro: ' + err.message);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const goal of goals) {
                const { error } = await supabase
                    .from('financial_goals')
                    .update({
                        target_sales_qty: goal.target_sales_qty || 0,
                        target_revenue_fixed: goal.target_revenue_fixed || 0,
                        target_revenue_variable: goal.target_revenue_variable || 0,
                        target_cogs: goal.target_cogs || 0,
                        target_opex: goal.target_opex || 0,
                        target_gross_margin: goal.target_gross_margin || 0,
                        target_gross_margin_pct: goal.target_gross_margin_pct || 0,
                        target_ebitda: goal.target_ebitda || 0,
                        target_ebitda_pct: goal.target_ebitda_pct || 0,
                        target_net_profit: goal.target_net_profit || 0,
                        target_net_profit_pct: goal.target_net_profit_pct || 0,
                        accumulated_customers: goal.accumulated_customers || 0
                    })
                    .eq('id', goal.id);

                if (error) throw error;
            }
            alert('Metas salvas com sucesso!');
        } catch (err) {
            alert('Erro ao salvar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const fmt = (val) => 'R$ ' + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

    return (
        <div className="goals-page">
            <div className="header">
                <div>
                    <h1><TrendingUp size={24} /> Metas Financeiras {selectedYear}</h1>
                    <p className="subtitle">Business Plan com MRR + Churn</p>
                </div>
                <div className="header-controls">
                    <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="year-selector">
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button className="btn-new-year" onClick={handleCreateNewYear}>
                        + Novo Ano
                    </button>
                    <button className="btn-save" onClick={handleSave} disabled={saving}>
                        <Save size={18} /> {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>

            {/* Business Variables Config */}
            <div className="config-panel">
                <h3>⚙️ Configurações de Negócio</h3>
                <div className="config-row">
                    <div className="config-item">
                        <label>Ticket MRR (R$)</label>
                        <input type="number" value={ticketPrice} onChange={e => setTicketPrice(parseFloat(e.target.value))} />
                    </div>
                    <div className="config-item">
                        <label>Taxa Comissão (%)</label>
                        <input type="number" step="0.01" value={commissionRate * 100} onChange={e => setCommissionRate(parseFloat(e.target.value) / 100)} />
                    </div>
                    <div className="config-item">
                        <label>Faturamento Mín. (R$)</label>
                        <input type="number" value={minRevenue} onChange={e => setMinRevenue(parseFloat(e.target.value))} />
                    </div>
                    <div className="config-item">
                        <label>Churn Mensal (%)</label>
                        <input type="number" step="0.1" value={churnRate} onChange={e => setChurnRate(parseFloat(e.target.value))} />
                    </div>
                    <div className="config-item">
                        <label>COGS Padrão (R$)</label>
                        <input type="number" value={defaultCogs} onChange={e => setDefaultCogs(parseFloat(e.target.value))} />
                    </div>
                    <div className="config-item">
                        <label>OPEX Padrão (R$)</label>
                        <input type="number" value={defaultOpex} onChange={e => setDefaultOpex(parseFloat(e.target.value))} />
                    </div>
                    <button className="btn-save-config" onClick={handleSaveVariables}>Salvar Config</button>
                    <button className="btn-apply-defaults" onClick={handleApplyDefaults}><Copy size={14} /> Aplicar Padrões</button>
                </div>
            </div>

            {loading ? <p>Carregando...</p> : (
                <div className="goals-table-wrapper">
                    <table className="goals-table">
                        <thead>
                            <tr>
                                <th rowSpan="2">Mês</th>
                                <th rowSpan="2">Vendas</th>
                                <th rowSpan="2">Clientes</th>
                                <th colSpan="2">Receita Fixa (MRR)</th>
                                <th colSpan="2">Receita Variável (MRR)</th>
                                <th rowSpan="2">Churn</th>
                                <th colSpan="2">COGS</th>
                                <th colSpan="2">Despesas Operacionais</th>
                                <th colSpan="2">Margem Bruta</th>
                                <th colSpan="2">EBITDA</th>
                                <th colSpan="2">Lucro Líquido</th>
                            </tr>
                            <tr>
                                <th>R$</th>
                                <th>%</th>
                                <th>R$</th>
                                <th>%</th>
                                <th>R$</th>
                                <th>%</th>
                                <th>R$</th>
                                <th>%</th>
                                <th>R$</th>
                                <th>%</th>
                                <th>R$</th>
                                <th>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {goals.map((goal, idx) => {
                                const totalRevenue = (goal.target_revenue_fixed || 0) + (goal.target_revenue_variable || 0);
                                return (
                                    <tr key={goal.id}>
                                        <td className="month-cell">{months[goal.month - 1]}</td>
                                        <td>
                                            <input type="number" value={goal.target_sales_qty || ''}
                                                onChange={e => handleChange(goal.id, 'target_sales_qty', e.target.value)} />
                                        </td>
                                        <td className="calc-cell">{goal.accumulated_customers || 0}</td>
                                        <td className="calc-cell revenue">{fmt(goal.target_revenue_fixed || 0)}</td>
                                        <td className="calc-cell revenue">{totalRevenue > 0 ? ((goal.target_revenue_fixed / totalRevenue) * 100).toFixed(2) : '0,00'}%</td>
                                        <td className="editable-revenue">
                                            <input
                                                key={`rev-${goal.id}-${goal.target_revenue_variable}`}
                                                type="text"
                                                defaultValue={goal.target_revenue_variable ? fmt(goal.target_revenue_variable) : ''}
                                                onFocus={e => e.target.value = goal.target_revenue_variable || ''}
                                                onBlur={e => {
                                                    const val = parseFloat(e.target.value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
                                                    handleChange(goal.id, 'target_revenue_variable', val);
                                                    e.target.value = val ? fmt(val) : '';
                                                }}
                                            />
                                        </td>
                                        <td className="calc-cell revenue">{totalRevenue > 0 ? ((goal.target_revenue_variable / totalRevenue) * 100).toFixed(2) : '0,00'}%</td>
                                        <td className="calc-cell churn">{idx > 0 ? goal.churn_loss : '-'}</td>
                                        <td className="calc-cell expense">{fmt(goal.target_cogs || 0)}</td>
                                        <td className="calc-cell expense">{totalRevenue > 0 ? ((goal.target_cogs / totalRevenue) * 100).toFixed(2) : '0,00'}%</td>
                                        <td className="editable-expense">
                                            <input
                                                key={`opex-${goal.id}-${goal.target_opex}`}
                                                type="text"
                                                defaultValue={goal.target_opex ? fmt(goal.target_opex) : ''}
                                                onFocus={e => e.target.value = goal.target_opex || ''}
                                                onBlur={e => {
                                                    const val = parseFloat(e.target.value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
                                                    handleChange(goal.id, 'target_opex', val);
                                                    e.target.value = val ? fmt(val) : '';
                                                }}
                                            />
                                        </td>
                                        <td className="calc-cell expense">{totalRevenue > 0 ? ((goal.target_opex / totalRevenue) * 100).toFixed(2) : '0,00'}%</td>
                                        <td className={`calc-cell ${(goal.target_gross_margin || 0) < 0 ? 'negative' : ''}`}>{fmt(goal.target_gross_margin || 0)}</td>
                                        <td className={`calc-cell ${(goal.target_gross_margin_pct || 0) < 0 ? 'negative' : ''}`}>{(goal.target_gross_margin_pct || 0).toFixed(2)}%</td>
                                        <td className={`calc-cell ${(goal.target_ebitda || 0) < 0 ? 'negative' : ''}`}>{fmt(goal.target_ebitda || 0)}</td>
                                        <td className={`calc-cell ${(goal.target_ebitda_pct || 0) < 0 ? 'negative' : ''}`}>{(goal.target_ebitda_pct || 0).toFixed(2)}%</td>
                                        <td className={`calc-cell ${(goal.target_net_profit || 0) < 0 ? 'negative' : ''}`}>{fmt(goal.target_net_profit || 0)}</td>
                                        <td className={`calc-cell ${(goal.target_net_profit_pct || 0) < 0 ? 'negative' : ''}`}>{(goal.target_net_profit_pct || 0).toFixed(2)}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="totals-row">
                                <td className="totals-label" colSpan="2"><strong>Total Anual</strong></td>
                                <td className="calc-cell"><strong>{goals.reduce((sum, g) => sum + (g.accumulated_customers || 0), 0) / (goals.length || 1)}</strong></td>
                                <td className="calc-cell revenue"><strong>{fmt(goals.reduce((sum, g) => sum + (g.target_revenue_fixed || 0), 0))}</strong></td>
                                <td className="calc-cell revenue"><strong>{goals.length > 0 ? ((goals.reduce((sum, g) => sum + (g.target_revenue_fixed || 0), 0) / goals.reduce((sum, g) => sum + ((g.target_revenue_fixed || 0) + (g.target_revenue_variable || 0)), 0)) * 100).toFixed(2) : '0,00'}%</strong></td>
                                <td className="calc-cell revenue"><strong>{fmt(goals.reduce((sum, g) => sum + (g.target_revenue_variable || 0), 0))}</strong></td>
                                <td className="calc-cell revenue"><strong>{goals.length > 0 ? ((goals.reduce((sum, g) => sum + (g.target_revenue_variable || 0), 0) / goals.reduce((sum, g) => sum + ((g.target_revenue_fixed || 0) + (g.target_revenue_variable || 0)), 0)) * 100).toFixed(2) : '0,00'}%</strong></td>
                                <td className="calc-cell churn"><strong>-</strong></td>
                                <td className="calc-cell expense"><strong>{fmt(goals.reduce((sum, g) => sum + (g.target_cogs || 0), 0))}</strong></td>
                                <td className="calc-cell expense"><strong>{goals.length > 0 ? ((goals.reduce((sum, g) => sum + (g.target_cogs || 0), 0) / goals.reduce((sum, g) => sum + ((g.target_revenue_fixed || 0) + (g.target_revenue_variable || 0)), 0)) * 100).toFixed(2) : '0,00'}%</strong></td>
                                <td className="calc-cell expense"><strong>{fmt(goals.reduce((sum, g) => sum + (g.target_opex || 0), 0))}</strong></td>
                                <td className="calc-cell expense"><strong>{goals.length > 0 ? ((goals.reduce((sum, g) => sum + (g.target_opex || 0), 0) / goals.reduce((sum, g) => sum + ((g.target_revenue_fixed || 0) + (g.target_revenue_variable || 0)), 0)) * 100).toFixed(2) : '0,00'}%</strong></td>
                                <td className="calc-cell"><strong>{fmt(goals.reduce((sum, g) => sum + (g.target_gross_margin || 0), 0))}</strong></td>
                                <td className="calc-cell"><strong>{goals.length > 0 ? ((goals.reduce((sum, g) => sum + (g.target_gross_margin || 0), 0) / goals.reduce((sum, g) => sum + ((g.target_revenue_fixed || 0) + (g.target_revenue_variable || 0)), 0)) * 100).toFixed(2) : '0,00'}%</strong></td>
                                <td className={`calc-cell ${goals.reduce((sum, g) => sum + (g.target_ebitda || 0), 0) < 0 ? 'negative' : ''}`}><strong>{fmt(goals.reduce((sum, g) => sum + (g.target_ebitda || 0), 0))}</strong></td>
                                <td className={`calc-cell ${goals.reduce((sum, g) => sum + (g.target_ebitda || 0), 0) < 0 ? 'negative' : ''}`}><strong>{goals.length > 0 ? ((goals.reduce((sum, g) => sum + (g.target_ebitda || 0), 0) / goals.reduce((sum, g) => sum + ((g.target_revenue_fixed || 0) + (g.target_revenue_variable || 0)), 0)) * 100).toFixed(2) : '0,00'}%</strong></td>
                                <td className={`calc-cell ${goals.reduce((sum, g) => sum + (g.target_net_profit || 0), 0) < 0 ? 'negative' : ''}`}><strong>{fmt(goals.reduce((sum, g) => sum + (g.target_net_profit || 0), 0))}</strong></td>
                                <td className={`calc-cell ${goals.reduce((sum, g) => sum + (g.target_net_profit || 0), 0) < 0 ? 'negative' : ''}`}><strong>{goals.length > 0 ? ((goals.reduce((sum, g) => sum + (g.target_net_profit || 0), 0) / goals.reduce((sum, g) => sum + ((g.target_revenue_fixed || 0) + (g.target_revenue_variable || 0)), 0)) * 100).toFixed(2) : '0,00'}%</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            <style>{`
                .goals-page { padding: 2rem; max-width: 100%; margin: 0 auto; color: var(--text-primary); overflow-x: auto; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .header h1 { display: flex; align-items: center; gap: 12px; font-size: 1.8rem; margin: 0; }
                .subtitle { color: var(--text-secondary); margin-top: 0.5rem; }
                
                .header-controls { display: flex; gap: 1rem; align-items: center; }
                .year-selector { padding: 0.75rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); font-weight: 600; }
                
                .btn-save, .btn-new-year, .btn-save-config, .btn-apply-defaults { background: var(--primary); color: black; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; }
                .btn-new-year { background: rgba(99, 102, 241, 0.2); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); }
                .btn-apply-defaults { background: rgba(132, 204, 22, 0.2); color: #84cc16; border: 1px solid rgba(132, 204, 22, 0.3); }
                .btn-save-config { padding: 0.5rem 1rem; font-size: 0.9rem; }
                .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

                .config-panel { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; }
                .config-panel h3 { margin: 0 0 1rem 0; font-size: 1.1rem; }
                .config-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
                .config-item { display: flex; flex-direction: column; gap: 0.5rem; }
                .config-item label { font-size: 0.85rem; color: var(--text-secondary); }
                .config-item input { padding: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); width: 120px; }

                .goals-table-wrapper { overflow-x: auto; background: var(--bg-secondary); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border-color); }
                .goals-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
                .goals-table th { background: var(--bg-primary); padding: 0.5rem; text-align: center; font-weight: 600; border: 1px solid var(--border-color); white-space: nowrap; }
                .goals-table td { padding: 0.5rem; border: 1px solid var(--border-color); text-align: center; }
                
                .month-cell { font-weight: 600; color: var(--primary); }
                .calc-cell { background: rgba(132, 204, 22, 0.1); color: #84cc16; font-weight: 600; font-family: monospace; font-size: 0.8rem; white-space: nowrap; }
                .calc-cell.churn { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .calc-cell.base { background: rgba(14, 165, 233, 0.1); color: #0ea5e9; }
                .calc-cell.new { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
                .calc-cell.var { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
                .calc-cell.revenue { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
                .calc-cell.negative { background: rgba(239, 68, 68, 0.15); color: #ef4444 !important; font-weight: 700; }
                .calc-cell.expense { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                
                .editable-revenue { background: rgba(34, 197, 94, 0.05); }
                .editable-revenue input { width: 100px !important; background: rgba(34, 197, 94, 0.1) !important; border: 2px solid #22c55e !important; color: #22c55e !important; font-weight: 600; }
                .editable-expense { background: rgba(239, 68, 68, 0.05); }
                .editable-expense input { width: 100px !important; background: rgba(239, 68, 68, 0.1) !important; border: 2px solid #ef4444 !important; color: #ef4444 !important; font-weight: 600; }
                
                .goals-table input { width: 80px; padding: 0.4rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-family: monospace; font-size: 0.75rem; text-align: center; }
                .goals-table input:focus { outline: none; border-color: var(--primary); }
                
                .totals-row { background: rgba(132, 204, 22, 0.15); border-top: 2px solid var(--primary) !important; }
                .totals-row td { font-size: 0.9rem; padding: 0.75rem 0.5rem; }
                .totals-label { text-align: left !important; font-size: 1rem; color: var(--primary); }
            `}</style>
        </div>
    );
};

export default GoalsSettings;
