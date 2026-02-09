import React, { useState } from 'react';
import { Bell, CheckCircle2, MessageSquare, AlertCircle, Info, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';

const Notifications = () => {
    const navigate = useNavigate();
    // Mock Notifications Data
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'mention',
            user: 'Paulo Luvisoto',
            text: 'mencionou você em um comentário no cliente Tech Solutions Ltda',
            time: 'Há 5 minutos',
            read: false,
            link: '/clients/tech-solutions' // Ensure this matches a valid ID or flow
        },
        {
            id: 2,
            type: 'system',
            user: 'Sistema',
            text: 'Novo cliente "Logística 2000" foi atribuído a você',
            time: 'Há 2 horas',
            read: false,
            link: '/clients/logistica-2000'
        },
        {
            id: 3,
            type: 'deadline',
            user: 'Alerta',
            text: 'Tarefa "Reunião de Kick-off" vence amanhã',
            time: 'Ontem',
            read: true,
            link: '/clients/tech-solutions'
        }
    ]);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const handleNotificationClick = (notification) => {
        // Mark as read locally
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));

        // Navigate if link exists
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'mention': return <MessageSquare size={18} className="icon-mention" />;
            case 'success': return <CheckCircle2 size={18} className="icon-success" />;
            case 'deadline': return <AlertCircle size={18} className="icon-deadline" />;
            case 'system': return <Info size={18} className="icon-system" />;
            default: return <Bell size={18} className="icon-default" />;
        }
    };

    return (
        <div className="notifications-page">
            <header className="page-header">
                <div>
                    <h1><Bell className="header-icon" /> Notificações</h1>
                    <p>Fique por dentro das últimas atualizações</p>
                </div>
                <button onClick={markAllAsRead} className="mark-read-btn">
                    Marcar todas como lidas
                </button>
            </header>

            <div className="notifications-list">
                {notifications.length === 0 ? (
                    <div className="empty-state">
                        <Bell size={48} />
                        <h3>Tudo limpo!</h3>
                        <p>Você não tem novas notificações.</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            className={`notification-item ${n.read ? 'read' : 'unread'}`}
                            onClick={() => handleNotificationClick(n)}
                        >
                            <div className="notif-icon-wrapper">
                                {getIcon(n.type)}
                            </div>
                            <div className="notif-content">
                                <p>
                                    <strong>{n.user}</strong> {n.text}
                                </p>
                                <span className="notif-time">{n.time}</span>
                            </div>
                            {!n.read && <div className="unread-dot"></div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
