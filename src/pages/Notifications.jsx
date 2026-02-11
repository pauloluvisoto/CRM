import React, { useState } from 'react';
import { Bell, CheckCircle2, MessageSquare, AlertCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'mention',
            user: 'Paulo Luvisoto',
            text: 'mencionou você em um comentário no cliente Tech Solutions Ltda',
            time: 'Há 5 minutos',
            read: false,
            link: '/contacts'
        },
        {
            id: 2,
            type: 'system',
            user: 'Sistema',
            text: 'Novo negócio "Logística 2000" foi criado no pipeline',
            time: 'Há 2 horas',
            read: false,
            link: '/pipeline'
        },
        {
            id: 3,
            type: 'deadline',
            user: 'Alerta',
            text: 'Reunião de follow-up agendada para amanhã às 14h',
            time: 'Ontem',
            read: true,
            link: '/dashboard'
        }
    ]);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const handleNotificationClick = (notification) => {
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'mention': return <MessageSquare size={18} className="text-blue-400" />;
            case 'success': return <CheckCircle2 size={18} className="text-green-400" />;
            case 'deadline': return <AlertCircle size={18} className="text-red-400" />;
            case 'system': return <Info size={18} className="text-gray-400" />;
            default: return <Bell size={18} className="text-brand" />;
        }
    };

    return (
        <div className="flex flex-col h-full p-8 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-text-primary mb-2">
                        <Bell className="text-brand" size={32} />
                        Notificações
                    </h1>
                    <p className="text-text-secondary">Fique por dentro das últimas atualizações</p>
                </div>
                <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 rounded-lg border border-white/10 text-text-secondary hover:text-text-primary hover:border-brand/50 hover:bg-brand/5 transition-all text-sm"
                >
                    Marcar todas como lidas
                </button>
            </div>

            {/* Notifications List */}
            <div className="flex flex-col gap-3 max-w-4xl">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Bell size={64} className="text-text-muted mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold text-text-secondary mb-2">Tudo limpo!</h3>
                        <p className="text-text-muted">Você não tem novas notificações.</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            className={`group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${n.read
                                    ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                    : 'bg-white/[0.05] border-l-4 border-l-brand border-white/10 hover:bg-white/[0.08]'
                                }`}
                            onClick={() => handleNotificationClick(n)}
                        >
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                {getIcon(n.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-primary leading-relaxed">
                                    <strong className="font-semibold">{n.user}</strong> {n.text}
                                </p>
                                <span className="text-xs text-text-muted mt-1 block">{n.time}</span>
                            </div>

                            {/* Unread Indicator */}
                            {!n.read && (
                                <div className="w-2 h-2 rounded-full bg-brand shadow-lg shadow-brand/50 flex-shrink-0" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
