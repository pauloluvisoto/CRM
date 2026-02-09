import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Clock, Move, Plus, Trash2, Edit } from 'lucide-react';

const ActivityFeed = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();

        // Optional: Realtime subscription
        const channel = supabase
            .channel('public:activity_logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, payload => {
                setActivities(prev => [payload.new, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchActivities = async () => {
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setActivities(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'MOVE': return <Move size={14} />;
            case 'CREATE': return <Plus size={14} />;
            case 'DELETE': return <Trash2 size={14} />;
            case 'UPDATE': return <Edit size={14} />;
            default: return <Clock size={14} />;
        }
    };

    const getMessage = (act) => {
        const d = act.details || {};
        const name = d.name ? <b>{d.name}</b> : 'Item desconhecido';

        switch (act.action_type) {
            case 'MOVE':
                return <span>{name} movido de <i>{d.from}</i> para <i>{d.to}</i></span>;
            case 'CREATE':
                return <span>{name} criado</span>;
            case 'UPDATE':
                return <span>{name} atualizado</span>;
            case 'DELETE':
                return <span>{name} removido</span>;
            default:
                return <span>Atividade em {act.entity_type}</span>;
        }
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="text-zinc-500 text-sm">Carregando atividades...</div>;
    if (activities.length === 0) return <div className="text-zinc-500 text-sm">Nenhuma atividade recente.</div>;

    return (
        <ul className="activity-list">
            {activities.map(act => (
                <li key={act.id}>
                    <span className="time">{formatTime(act.created_at)}</span>
                    <span className="icon-badge" data-type={act.action_type}>
                        {getIcon(act.action_type)}
                    </span>
                    <span className="text">{getMessage(act)}</span>
                </li>
            ))}
            <style>{`
                .activity-list {
                    list-style: none;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .activity-list li {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                .time {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    min-width: 40px;
                }
                .icon-badge {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    background-color: var(--bg-hover);
                    color: var(--text-secondary);
                }
                .icon-badge[data-type="CREATE"] { background: rgba(132, 204, 22, 0.2); color: #bef264; }
                .icon-badge[data-type="MOVE"] { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
                .icon-badge[data-type="DELETE"] { background: rgba(239, 68, 68, 0.2); color: #f87171; }
                
                .text b { color: var(--text-primary); font-weight: 500; }
                .text i { font-style: normal; color: var(--text-primary); background: var(--bg-hover); padding: 0 4px; border-radius: 4px; }
            `}</style>
        </ul>
    );
};

export default ActivityFeed;
