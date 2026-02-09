import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { logActivity } from '../../../utils/logger';
import { CheckSquare, Square, Calendar, Plus, Trash2 } from 'lucide-react';

const TasksTab = ({ dealId }) => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, [dealId]);

    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('deal_tasks')
                .select('*')
                .eq('deal_id', dealId)
                .order('is_completed', { ascending: true }) // Pending first
                .order('due_date', { ascending: true }); // Soonest first

            if (error) throw error;
            setTasks(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        setAdding(true);
        try {
            const { data, error } = await supabase
                .from('deal_tasks')
                .insert([{
                    deal_id: dealId,
                    title: newTaskTitle,
                    due_date: newTaskDate ? new Date(newTaskDate).toISOString() : null,
                    assigned_to: user?.id
                }])
                .select()
                .single();

            if (error) throw error;

            setTasks(prev => [...prev, data].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
            setNewTaskTitle('');
            setNewTaskDate('');

            // Log
            logActivity({
                actionType: 'CREATE',
                entityType: 'TASK',
                entityId: data.id,
                details: { name: data.title },
                userId: user?.id
            });

        } catch (err) {
            console.error(err);
            alert('Erro ao criar tarefa');
        } finally {
            setAdding(false);
        }
    };

    const toggleTask = async (task) => {
        try {
            const newStatus = !task.is_completed;
            const { error } = await supabase
                .from('deal_tasks')
                .update({ is_completed: newStatus })
                .eq('id', task.id);

            if (error) throw error;

            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: newStatus } : t));

        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Apagar tarefa?')) return;
        try {
            await supabase.from('deal_tasks').delete().eq('id', taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (err) { console.error(err); }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    return (
        <div className="tasks-tab">
            <form onSubmit={handleAddTask} className="task-form">
                <input
                    className="task-input"
                    placeholder="Nova tarefa..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                />
                <input
                    type="date"
                    className="date-input"
                    value={newTaskDate}
                    onChange={e => setNewTaskDate(e.target.value)}
                />
                <button type="submit" className="btn-add" disabled={adding || !newTaskTitle.trim()}>
                    <Plus size={16} />
                </button>
            </form>

            <div className="tasks-list">
                {loading ? <p className="text-muted">Carregando tarefas...</p> :
                    tasks.length === 0 ? <p className="text-muted text-center py-4">Nenhuma tarefa.</p> :
                        tasks.map(task => (
                            <div key={task.id} className={`task-item ${task.is_completed ? 'completed' : ''}`}>
                                <button className="check-btn" onClick={() => toggleTask(task)}>
                                    {task.is_completed ? <CheckSquare size={20} className="checked" /> : <Square size={20} />}
                                </button>

                                <div className="task-info">
                                    <span className="task-title">{task.title}</span>
                                    {task.due_date && (
                                        <span className="task-date">
                                            <Calendar size={12} /> {formatDate(task.due_date)}
                                        </span>
                                    )}
                                </div>

                                <button className="btn-del-task" onClick={() => handleDeleteTask(task.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
            </div>

            <style>{`
                .tasks-tab {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .task-form {
                    display: flex;
                    gap: 0.5rem;
                }
                .task-input {
                    flex: 1;
                    background-color: var(--bg-hover);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 0.75rem;
                    color: var(--text-primary);
                }
                .date-input {
                    background-color: var(--bg-hover);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 0.75rem;
                    color: var(--text-primary);
                }
                .btn-add {
                    background-color: var(--primary);
                    color: var(--primary-text);
                    border: none;
                    border-radius: 8px;
                    width: 42px;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                }

                .tasks-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    max-height: 300px;
                    overflow-y: auto;
                }

                .task-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    background-color: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    transition: opacity 0.2s;
                }
                .task-item.completed { opacity: 0.6; }
                .task-item.completed .task-title { text-decoration: line-through; }

                .check-btn {
                    background: transparent; border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex; align-items: center;
                }
                .checked { color: var(--primary); }

                .task-info { flex: 1; display: flex; flex-direction: column; }
                .task-title { font-weight: 500; color: var(--text-primary); }
                .task-date { font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 2px; }

                .btn-del-task {
                    background: transparent; border: none;
                    color: var(--text-muted); cursor: pointer;
                }
                .btn-del-task:hover { color: #f87171; }
            `}</style>
        </div>
    );
};

export default TasksTab;
