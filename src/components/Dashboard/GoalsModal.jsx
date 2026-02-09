
import React, { useState, useEffect } from 'react';
import { X, Target, Save, DollarSign, Users, Briefcase, TrendingUp, BarChart2, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const GoalsModal = ({ isOpen, onClose, userId, goals, onGoalsUpdated }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        leads_goal: 0,
        sales_qty_goal: 0,
        lead_to_meeting_goal: 0,
        meetings_goal: 0,
        no_show_rate_goal: 0,
        meeting_to_sale_goal: 0
    });

    useEffect(() => {
        if (goals) {
            setFormData({
                leads_goal: goals.leads_goal || 0,
                sales_qty_goal: goals.sales_qty_goal || 0,
                lead_to_meeting_goal: goals.lead_to_meeting_goal || 0,
                meetings_goal: goals.meetings_goal || 0,
                no_show_rate_goal: goals.no_show_rate_goal || 0,
                meeting_to_sale_goal: goals.meeting_to_sale_goal || 0
            });
        }
    }, [goals, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const today = new Date();
            const month = today.getMonth() + 1;
            const year = today.getFullYear();

            const { data, error } = await supabase
                .from('user_goals')
                .upsert({
                    user_id: userId,
                    leads_goal: parseInt(formData.leads_goal),
                    sales_qty_goal: parseInt(formData.sales_qty_goal),
                    lead_to_meeting_goal: parseFloat(formData.lead_to_meeting_goal),
                    meetings_goal: parseFloat(formData.meetings_goal),
                    no_show_rate_goal: parseFloat(formData.no_show_rate_goal),
                    meeting_to_sale_goal: parseFloat(formData.meeting_to_sale_goal),
                    month,
                    year
                }, { onConflict: 'user_id, month, year' })
                .select()
                .single();

            if (error) throw error;

            if (onGoalsUpdated) onGoalsUpdated(data);
            onClose();
        } catch (error) {
            console.error('Error saving goals:', error);
            alert('Erro ao salvar metas: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    backdrop-filter: blur(10px);
                }
                .modal-content {
                    background: linear-gradient(135deg, rgba(30,30,40,0.98) 0%, rgba(20,20,30,1) 100%);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 24px;
                    width: 100%;
                    max-width: 450px;
                    padding: 2.5rem;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .modal-header h2 {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-transform: uppercase;
                    letter-spacing: -0.5px;
                }
                .goal-field {
                    margin-bottom: 1.25rem;
                }
                .goal-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255,255,255,0.6);
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 0.5rem;
                }
                .goal-input-wrapper {
                    position: relative;
                }
                .goal-input {
                    width: 100%;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 0.75rem 1rem;
                    color: white;
                    font-size: 1.1rem;
                    font-weight: 700;
                    transition: all 0.3s ease;
                }
                .goal-input:focus {
                    outline: none;
                    border-color: #bef264;
                    background: rgba(190,242,100,0.05);
                }
                .input-suffix {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255,255,255,0.3);
                    font-weight: 700;
                    font-size: 0.8rem;
                }
                .modal-footer {
                    display: flex;
                    gap: 12px;
                    margin-top: 1.5rem;
                }
                .btn-save {
                    flex: 1;
                    background: #bef264;
                    color: black;
                    border: none;
                    padding: 0.875rem;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .btn-save:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(190,242,100,0.3);
                }
            `}</style>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><Target size={24} color="#bef264" /> Metas do Mês</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="goal-field">
                        <label className="goal-label"><Users size={14} /> Meta de Novos Leads</label>
                        <div className="goal-input-wrapper">
                            <input
                                type="number"
                                className="goal-input"
                                value={formData.leads_goal}
                                onChange={e => setFormData({ ...formData, leads_goal: e.target.value })}
                            />
                            <span className="input-suffix">UND</span>
                        </div>
                    </div>

                    <div className="goal-field">
                        <label className="goal-label"><TrendingUp size={14} /> Meta: Agendamentos / Leads</label>
                        <div className="goal-input-wrapper">
                            <input
                                type="number"
                                className="goal-input"
                                value={formData.lead_to_meeting_goal}
                                onChange={e => setFormData({ ...formData, lead_to_meeting_goal: e.target.value })}
                                step="0.1"
                            />
                            <span className="input-suffix">%</span>
                        </div>
                    </div>

                    <div className="goal-field">
                        <label className="goal-label"><BarChart2 size={14} /> Meta: Reuniões / Agendamentos</label>
                        <div className="goal-input-wrapper">
                            <input
                                type="number"
                                className="goal-input"
                                value={formData.meetings_goal}
                                onChange={e => setFormData({ ...formData, meetings_goal: e.target.value })}
                                step="0.1"
                            />
                            <span className="input-suffix">%</span>
                        </div>
                    </div>

                    <div className="goal-field">
                        <label className="goal-label"><Target size={14} /> Meta: Reunião → Venda (Ganho)</label>
                        <div className="goal-input-wrapper">
                            <input
                                type="number"
                                className="goal-input"
                                value={formData.meeting_to_sale_goal}
                                onChange={e => setFormData({ ...formData, meeting_to_sale_goal: e.target.value })}
                                step="0.1"
                            />
                            <span className="input-suffix">%</span>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="submit" className="btn-save" disabled={loading}>
                            <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Metas'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoalsModal;
