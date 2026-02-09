import React, { useState, useEffect, useRef } from 'react';
import {
    Users,
    CheckCircle2,
    Circle,
    Clock,
    MessageSquare,
    Plus,
    Trash2,
    ThumbsUp,
    Reply,
    ChevronDown,
    ChevronUp,
    Send,
    ArrowRight,
    X,
    Smile,
    GripVertical,
    Bell,
    Pencil,
    Calendar,
    Search
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './Clients.css';
import CalendarPopover from '../components/CalendarPopover';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AddClientModal from '../components/AddClientModal';

const DEFAULT_TASKS = [
    { title: 'Reunião de Kick-off', status: 'todo' },
    { title: 'Coleta de Dados Iniciais', status: 'todo' },
    { title: 'Configuração da Plataforma', status: 'todo' },
    { title: 'Importação de Base de Contatos', status: 'todo' },
    { title: 'Definição de Funis de Venda', status: 'todo' },
    { title: 'Integração com WhatsApp/E-mail', status: 'todo' },
    { title: 'Treinamento da Equipe', status: 'todo' },
    { title: 'Configuração de Automações', status: 'todo' },
    { title: 'Homologação do Ambiente', status: 'todo' },
    { title: 'Go-Live (Entrega Final)', status: 'todo' },
];

const NotificationToast = ({ notification, onClose }) => {
    if (!notification) return null;
    return (
        <div className="notification-toast">
            <Bell size={24} color="#bef264" />
            <div className="toast-content">
                <h4>Nova Menção!</h4>
                <p>{notification}</p>
            </div>
            <button onClick={onClose} className="close-toast"><X size={16} /></button>
        </div>
    );
};

const Clients = ({ mode = 'onboarding' }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // newest, oldest, alphabetical, deadline
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchClients();
    }, [mode]); // Refetch when mode changes

    const fetchClients = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply filter based on mode
            // We assume 'stage' column exists. If strictly mimicking previous behavior without migration, this might fail.
            // Using a client-side filter fallback if needed, but standard is DB filter.
            if (mode) {
                query = query.eq('stage', mode);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Map Supabase data to local shape (handling missing JSON fields)
            const mappedClients = data.map(c => ({
                id: c.id,
                companyName: c.company_name || c.name || 'Empresa Sem Nome',
                contactName: c.contact_name || 'Sem contato',
                startDate: c.created_at,
                stage: c.stage || 'onboarding',
                lastFollowup: c.last_followup_at,
                nextFollowup: c.next_followup_at,
                // Ensure tasks/comments exist, default to initial structure if new
                tasks: c.tasks || DEFAULT_TASKS.map(t => ({ ...t, id: crypto.randomUUID() })),
                comments: c.comments || []
            }));

            setClients(mappedClients);
        } catch (error) {
            console.error('Error fetching clients:', error);
            showNotification('Erro ao carregar clientes');
        } finally {
            setLoading(false);
        }
    };

    const updateClientInDb = async (updatedClient) => {
        // Optimistic Update
        const oldClients = [...clients];
        setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));

        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    tasks: updatedClient.tasks,
                    comments: updatedClient.comments,
                    stage: updatedClient.stage,
                    last_followup_at: updatedClient.lastFollowup,
                    next_followup_at: updatedClient.nextFollowup,
                    // Map other fields back if editable here
                })
                .eq('id', updatedClient.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating client:', error);
            showNotification('Erro ao salvar alterações');
            setClients(oldClients); // Rollback
        }
    };

    const handleAddClient = async (formData) => {
        if (!user) {
            showNotification('Usuário não autenticado');
            return;
        }

        const newClient = {
            company_name: formData.companyName,
            contact_name: formData.contactName,
            // Using default tasks for new client
            tasks: DEFAULT_TASKS.map(t => ({ ...t, id: crypto.randomUUID() })),
            comments: [],
            status: 'active',
            stage: mode,
            user_id: user.id
        };

        try {
            const { data, error } = await supabase
                .from('clients')
                .insert([newClient])
                .select()
                .single();

            if (error) throw error;

            // Add to local state
            const mappedNew = {
                id: data.id,
                companyName: data.company_name,
                contactName: data.contact_name,
                startDate: data.created_at,
                stage: data.stage,
                lastFollowup: data.last_followup_at,
                nextFollowup: data.next_followup_at,
                tasks: data.tasks,
                comments: data.comments
            };
            setClients([mappedNew, ...clients]);
            showNotification('Cliente adicionado com sucesso!');
        } catch (error) {
            console.error('Error adding client:', error);
            showNotification(`Erro: ${error.message || 'Falha desconhecida'}`);
        }
    };

    const deleteClient = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

        // Optimistic Delete
        const oldClients = [...clients];
        setClients(clients.filter(c => c.id !== id));

        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showNotification('Cliente removido');
        } catch (error) {
            console.error('Error deleting client:', error);
            showNotification('Erro ao remover cliente');
            setClients(oldClients); // Rollback
        }
    };

    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 5000);
    };

    return (
        <div className="clients-page">
            <NotificationToast notification={notification} onClose={() => setNotification(null)} />
            <AddClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleAddClient}
            />

            <header className="clients-header">
                <div className="page-title">
                    <h1>
                        <Users size={32} />
                        {mode === 'onboarding' ? 'Onboarding de Clientes' : 'Gestão de Manutenção'}
                    </h1>
                    <p className="page-subtitle">
                        {mode === 'onboarding'
                            ? 'Acompanhe o progresso de entrega dos novos clientes (Onboarding)'
                            : 'Gerencie o relacionamento e ciclos de manutenção (Manutenção/Sucesso)'}
                    </p>
                </div>
            </header>

            <div className="toolbar-container">
                <div className="search-section">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="toolbar-separator"></div>

                <div className="filter-section">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="newest">📅 Recentes</option>
                        <option value="oldest">📅 Antigos</option>
                        <option value="alphabetical">Az Alfabética</option>
                        <option value="deadline">⏰ Prazo (Urgência)</option>
                    </select>
                </div>

                <div className="toolbar-separator"></div>

                <button className="btn-new-client-toolbar" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} /> Novo Cliente
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#a1a1aa' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div className="spinner" style={{ width: '24px', height: '24px', border: '2px solid #3f3f46', borderTopColor: '#bef264', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <p>Carregando clientes...</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                </div>
            ) : clients.length === 0 ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4rem',
                    background: '#18181b',
                    borderRadius: '12px',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    color: '#71717a'
                }}>
                    <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#e4e4e7' }}>Nenhum cliente encontrado</h3>
                    <p style={{ margin: 0 }}>Clone um novo cliente para começar.</p>
                </div>
            ) : (
                <div className="clients-grid">
                    {clients
                        .filter(client => {
                            if (!searchTerm) return true;
                            const term = searchTerm.toLowerCase();
                            const company = client.companyName ? client.companyName.toLowerCase() : '';
                            const contact = client.contactName ? client.contactName.toLowerCase() : '';
                            return company.includes(term) || contact.includes(term);
                        })
                        .sort((a, b) => {
                            if (sortBy === 'alphabetical') {
                                const nameA = a.companyName || '';
                                const nameB = b.companyName || '';
                                return nameA.localeCompare(nameB);
                            }
                            if (sortBy === 'oldest') return new Date(a.startDate) - new Date(b.startDate);
                            if (sortBy === 'newest') return new Date(b.startDate) - new Date(a.startDate);
                            if (sortBy === 'deadline') {
                                const getDeadline = (c) => {
                                    const start = new Date(c.startDate);
                                    if (c.stage === 'onboarding') {
                                        const d = new Date(start); d.setDate(d.getDate() + 7); return d;
                                    }
                                    return c.nextFollowup ? new Date(c.nextFollowup) : new Date(8640000000000000);
                                };
                                return getDeadline(a) - getDeadline(b);
                            }
                            return 0;
                        })
                        .map(client => (
                            <ClientCard
                                key={client.id}
                                client={client}
                                mode={mode}
                                onUpdate={updateClientInDb}
                                onDelete={deleteClient}
                                onNotify={showNotification}
                            />
                        ))}
                </div>
            )}
        </div>
    );
};



const ClientCard = ({ client, mode, onUpdate, onDelete, onNotify }) => {
    const [expanded, setExpanded] = useState(false);
    const [newlyAddedTaskId, setNewlyAddedTaskId] = useState(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const navigate = useNavigate();

    // Dnd Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Status Logic
    const completedTasks = client.tasks.filter(t => t.status === 'done').length;
    const totalTasks = client.tasks.length;
    const progress = Math.round((completedTasks / totalTasks) * 100) || 0;

    // Timer Logic
    const startDate = new Date(client.startDate);
    let deadlineDate, isUrgent, isLate, daysLeft, timerText;

    if (mode === 'maintenance') {
        // Maintenance Logic: 15 days cycle
        // Prefer nextFollowup, else lastFollowup + 15, else startDate + 15
        const baseDate = client.lastFollowup ? new Date(client.lastFollowup) : startDate;
        deadlineDate = client.nextFollowup ? new Date(client.nextFollowup) : new Date(baseDate.getTime() + (15 * 24 * 60 * 60 * 1000));

        const now = new Date();
        const diffTime = deadlineDate - now;
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        isLate = diffTime < 0;
        isUrgent = daysLeft <= 3 && !isLate;

        if (isLate) {
            timerText = `Dias sem followup: ${Math.abs(daysLeft)}`;
        } else {
            timerText = `${daysLeft} dias`;
        }
    } else {
        // Onboarding Logic: 7 days fixed
        deadlineDate = new Date(startDate);
        deadlineDate.setDate(deadlineDate.getDate() + 7);

        const now = new Date();
        const diffTime = deadlineDate - now;
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        isLate = diffTime < 0;
        isUrgent = daysLeft <= 3;
        timerText = isLate ? 'Atrasado' : `${daysLeft} dias`;
    }

    const statusClass = isLate ? 'status-late' : isUrgent ? 'status-urgent' : 'status-normal';

    // Auto-create Followup Task for Maintenance
    useEffect(() => {
        if (mode === 'maintenance' && isLate) {
            const hasFollowupTask = client.tasks.some(t => t.title.toLowerCase().includes('followup do cliente') && t.status !== 'done');
            if (!hasFollowupTask) {
                const newTask = {
                    id: crypto.randomUUID(),
                    title: 'Followup do cliente',
                    status: 'todo'
                };
                onUpdate({ ...client, tasks: [newTask, ...client.tasks] });
                onNotify(`⚠️ Followup necessário para ${client.companyName}`);
            }
        }
    }, [mode, isLate, client.tasks, client.companyName]); // Be careful with loops, logic above prevents dupes via 'hasFollowupTask' check

    const handleProfileClick = (e) => {
        e.stopPropagation();
        navigate(`/clients/${client.id}`);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = client.tasks.findIndex(t => t.id === active.id);
            const newIndex = client.tasks.findIndex(t => t.id === over.id);
            const newTasks = arrayMove(client.tasks, oldIndex, newIndex);
            onUpdate({ ...client, tasks: newTasks });
        }
    };

    const handleTaskToggle = (index) => {
        const task = client.tasks[index];
        const newStatus = task.status === 'todo' ? 'doing' : task.status === 'doing' ? 'done' : 'todo';
        let newTasks = [...client.tasks];
        newTasks[index] = { ...task, status: newStatus };

        let clientUpdates = { tasks: newTasks };

        // Maintenance specific logic on task completion
        if (mode === 'maintenance' && newStatus === 'done' && task.title.toLowerCase().includes('followup')) {
            // Reset cycle
            const now = new Date();
            const next = new Date(now);
            next.setDate(next.getDate() + 15);

            clientUpdates.lastFollowup = now.toISOString();
            clientUpdates.nextFollowup = next.toISOString();

            onNotify("Followup registrado! Ciclo reiniciado.");
            // Optionally remove the task? User said "contador desaparece" - logic implies reset. 
            // The task remains as 'done' in history.
        }

        onUpdate({ ...client, ...clientUpdates });
    };

    const handleCalendarSelect = (newDateIso) => {
        onUpdate({ ...client, nextFollowup: newDateIso });
        setShowCalendar(false);
    };

    return (
        <div className={`client-card ${expanded ? 'is-expanded' : ''}`}>
            {/* Header */}
            <div className="card-header" onClick={() => setExpanded(!expanded)}>
                <div className="client-info" onClick={handleProfileClick} title="Ver Perfil Completo">
                    <div className="company-logo">
                        {client.companyName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="company-details">
                        <h3>{client.companyName}</h3>
                        <div className="card-meta">
                            <Users size={14} /> {client.contactName}
                            <span>•</span>
                            <span>Início: {startDate.toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="card-metrics">
                    {/* Timer */}
                    <div className={`timer-widget ${statusClass}`} style={{ position: 'relative' }}>
                        <div className="time-display">
                            <Clock size={16} />
                            {timerText}
                            {mode === 'maintenance' && (
                                <button className="edit-date-btn"
                                    onClick={(e) => { e.stopPropagation(); setShowCalendar(!showCalendar); }}
                                    title="Alterar data de followup"
                                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '4px' }}>
                                    <Calendar size={12} />
                                </button>
                            )}
                            {showCalendar && (
                                <CalendarPopover
                                    selectedDate={deadlineDate}
                                    onSelect={handleCalendarSelect}
                                    onClose={() => setShowCalendar(false)}
                                />
                            )}
                        </div>
                        <div className="time-dates">
                            {mode === 'onboarding' ? (
                                `${startDate.getDate().toString().padStart(2, '0')}/${startDate.getMonth() + 1} ➔ ${deadlineDate.getDate().toString().padStart(2, '0')}/${deadlineDate.getMonth() + 1}`
                            ) : (
                                (() => {
                                    const nextCycle = new Date(deadlineDate);
                                    nextCycle.setDate(nextCycle.getDate() + 15);
                                    return `Próx: ${deadlineDate.getDate().toString().padStart(2, '0')}/${deadlineDate.getMonth() + 1} ➔ ${nextCycle.getDate().toString().padStart(2, '0')}/${nextCycle.getMonth() + 1}`;
                                })()
                            )}
                        </div>
                    </div>

                    {/* Progress */}
                    {mode === 'onboarding' && (
                        <div className="progress-widget">
                            <div className="progress-labels">
                                <span>{completedTasks}/{totalTasks}</span>
                                <span style={{ color: '#bef264', fontWeight: 'bold' }}>{progress}%</span>
                            </div>
                            <div className="progress-bar-bg">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <button className="expand-btn" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
                        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    <button
                        className="expand-btn"
                        style={{ color: '#ef4444', marginLeft: '-10px' }}
                        onClick={(e) => { e.stopPropagation(); onDelete(client.id); }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="card-expanded">

                    {/* Tasks Column */}
                    <div className="tasks-section">
                        <div className="section-title">
                            <span><CheckCircle2 size={14} style={{ display: 'inline', marginRight: '6px' }} /> {mode === 'maintenance' ? 'Próximos Passos (Manutenção)' : 'Checklist de Onboarding'}</span>
                        </div>

                        <div className="task-list">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={client.tasks}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {client.tasks.map((task, index) => (
                                        <SortableTaskItem
                                            key={task.id}
                                            id={task.id}
                                            task={task}
                                            autoFocus={task.id === newlyAddedTaskId}
                                            onToggle={() => handleTaskToggle(index)}
                                            onDelete={() => {
                                                const newTasks = client.tasks.filter(t => t.id !== task.id);
                                                onUpdate({ ...client, tasks: newTasks });
                                            }}
                                            onChangeTitle={(newTitle) => {
                                                const newTasks = [...client.tasks];
                                                newTasks[index] = { ...task, title: newTitle };
                                                onUpdate({ ...client, tasks: newTasks });
                                            }}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>

                        <button
                            onClick={() => {
                                const newId = crypto.randomUUID();
                                const newTask = {
                                    id: newId,
                                    title: '',
                                    status: 'todo'
                                };
                                onUpdate({ ...client, tasks: [...client.tasks, newTask] });
                                setNewlyAddedTaskId(newId);
                            }}
                            className="add-task-btn"
                            style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
                        >
                            <Plus size={14} /> Adicionar Nova Tarefa
                        </button>

                        {progress === 100 && mode === 'onboarding' && (
                            <div className="success-banner">
                                <div className="success-content">
                                    <CheckCircle2 size={24} />
                                    <span>Onboarding Concluído!</span>
                                </div>
                                <button className="move-btn" onClick={() => onUpdate({ ...client, stage: 'maintenance' })}>
                                    Mover para Expansão <ArrowRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Comments Column */}
                    <CommentsPanel client={client} onUpdate={onUpdate} onNotify={onNotify} />

                </div>
            )
            }
        </div >
    );
};

const MOCK_USERS = ['Paulo', 'Maria', 'João', 'Sistema', 'Ana', 'Carlos', 'Você'];

const CommentsPanel = ({ client, onUpdate, onNotify }) => {
    const [inputValue, setInputValue] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // { id, user, text }
    const commentsEndRef = useRef(null);
    const currentUser = 'Você'; // Mock current user

    // Mentions State
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [client.comments]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);

        // Detect Mention
        const cursor = e.target.selectionStart;
        const lastAt = value.lastIndexOf('@', cursor);

        if (lastAt !== -1) {
            const query = value.slice(lastAt + 1, cursor);
            // Show menu if we have an @ and no spaces in the query (simple regex-ish logic)
            if (!/\s/.test(query)) {
                setMentionQuery(query);
                setShowMentions(true);
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }
    };

    const selectMention = (userName) => {
        const cursor = inputRef.current.selectionStart;
        const lastAt = inputValue.lastIndexOf('@', cursor);

        const prefix = inputValue.slice(0, lastAt);
        const suffix = inputValue.slice(cursor);

        const newValue = `${prefix}@${userName} ${suffix}`;
        setInputValue(newValue);
        setShowMentions(false);
        inputRef.current.focus();
    };

    const handleSend = () => {
        try {
            if (!inputValue.trim()) return;

            // Check for mentions
            const mentionMatch = inputValue.match(/@(\w+)/g);
            if (mentionMatch) {
                mentionMatch.forEach(match => {
                    const mentionedUser = match.substring(1); // remove @
                    if (mentionedUser !== currentUser) {
                        onNotify(`Você mencionou ${mentionedUser} em um comentário.`);
                    }
                });
            }

            const newComment = {
                id: crypto.randomUUID(),
                user: currentUser,
                text: inputValue,
                timestamp: new Date().toISOString(),
                reactions: {}, // { emoji: ['user1', 'user2'] }
                replyTo: replyingTo ? {
                    id: replyingTo.id,
                    user: replyingTo.user,
                    snippet: replyingTo.text
                } : null
            };

            const safeComments = Array.isArray(client.comments) ? client.comments : [];
            onUpdate({ ...client, comments: [...safeComments, newComment] });

            setInputValue('');
            setReplyingTo(null);
            setShowMentions(false);
        } catch (error) {
            console.error("Crash in handleSend:", error);
            alert("Erro ao enviar comentário. Verifique o console.");
        }
    };

    const handleReaction = (commentId, emoji) => {
        const updatedComments = client.comments.map(c => {
            if (c.id === commentId) {
                const currentReactions = c.reactions?.[emoji] || [];
                const userIndex = currentReactions.indexOf(currentUser);

                let newReactionsList;
                if (userIndex > -1) {
                    // Remove like
                    newReactionsList = currentReactions.filter(u => u !== currentUser);
                } else {
                    // Add like
                    newReactionsList = [...currentReactions, currentUser];
                }

                return {
                    ...c,
                    reactions: {
                        ...c.reactions,
                        [emoji]: newReactionsList
                    }
                };
            }
            return c;
        });
        onUpdate({ ...client, comments: updatedComments });
    };

    // Filter users for mentions
    const filteredUsers = MOCK_USERS.filter(u =>
        u.toLowerCase().startsWith(mentionQuery.toLowerCase())
    );

    return (
        <div className="comments-panel">
            <div className="section-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={14} /> Comentários e Discussão
                </span>
            </div>

            <div className="comments-list">
                {(!client.comments || client.comments.length === 0) && (
                    <div style={{ textAlign: 'center', color: '#52525b', fontSize: '0.85rem', marginTop: '2rem' }}>
                        Nenhum comentário. Inicie a discussão.
                    </div>
                )}

                {client.comments?.map(comment => (
                    <div key={comment.id} className="comment-bubble">
                        {comment.replyTo && (
                            <div className="reply-context">
                                <span className="reply-author">Respondendo a {comment.replyTo.user}</span>
                                <span className="reply-preview">{comment.replyTo.snippet}</span>
                            </div>
                        )}

                        <div className="comment-header">
                            <span className="comment-user">{comment.user}</span>
                            <span>{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="comment-text">
                            {/* Highlight mentions simply */}
                            {comment.text.split(' ').map((word, i) =>
                                word.startsWith('@') ? <span key={i} style={{ color: '#bef264', fontWeight: 600 }}>{word} </span> : word + ' '
                            )}
                        </p>

                        <div className="comment-footer">
                            {/* Reactions Display */}
                            <div className="reactions-list">
                                {Object.entries(comment.reactions || {}).map(([emoji, users]) => {
                                    // Handle legacy numbers if exists, convert to array logic on fly visually
                                    const count = Array.isArray(users) ? users.length : (typeof users === 'number' ? users : 0);
                                    if (count === 0) return null;

                                    const userReacted = Array.isArray(users) && users.includes(currentUser);

                                    return (
                                        <span
                                            key={emoji}
                                            className={`reaction-pill ${userReacted ? 'active' : ''}`}
                                            onClick={() => handleReaction(comment.id, emoji)}
                                            style={userReacted ? { borderColor: '#bef264', color: '#bef264', background: 'rgba(190, 242, 100, 0.1)' } : {}}
                                        >
                                            {emoji} {count}
                                        </span>
                                    );
                                })}
                            </div>

                            {/* Actions */}
                            <div className="comment-actions">
                                <button className="action-btn" title="Curtir" onClick={() => handleReaction(comment.id, '👍')}>
                                    <ThumbsUp size={12} />
                                </button>
                                <button className="action-btn" title="Responder" onClick={() => setReplyingTo({ id: comment.id, user: comment.user, text: comment.text })}>
                                    <Reply size={12} /> Responder
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={commentsEndRef} />
            </div>

            <div className="comment-input-wrapper" style={{ position: 'relative' }}>
                {showMentions && filteredUsers.length > 0 && (
                    <div className="mentions-dropdown">
                        {filteredUsers.map(u => (
                            <div key={u} className="mention-item" onClick={() => selectMention(u)}>
                                <span className="user-avatar-small" style={{ width: 20, height: 20, fontSize: 10 }}>{u.charAt(0)}</span>
                                {u}
                            </div>
                        ))}
                    </div>
                )}

                {replyingTo && (
                    <div className="replying-to-bar">
                        <span>Respondendo a <strong>@{replyingTo.user}</strong></span>
                        <button onClick={() => setReplyingTo(null)} className="cancel-reply-btn">
                            <X size={14} />
                        </button>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Escreva um comentário... (use @ para notificar)"
                    className="comment-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && inputValue.trim()) {
                            handleSend();
                        }
                    }}
                />
                <Send size={16} className="send-icon" onClick={handleSend} />
            </div>
        </div>
    );
};


const SortableTaskItem = ({ id, task, onToggle, onDelete, onChangeTitle, autoFocus }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id });

    // isEditing starts true if it's a new task (autoFocus)
    const [isEditing, setIsEditing] = useState(autoFocus);
    const inputRef = useRef(null);

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    let icon = <Circle size={20} />;
    let statusClass = 'task-todo';

    if (task.status === 'doing') {
        icon = <Clock size={20} />;
        statusClass = 'task-doing';
    } else if (task.status === 'done') {
        icon = <CheckCircle2 size={20} />;
        statusClass = 'task-done';
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`task-item ${statusClass} ${isDragging ? 'dragging' : ''}`}
        >
            <div className="drag-handle" {...attributes} {...listeners}>
                <GripVertical size={16} />
            </div>

            <button onClick={onToggle} className="task-status-btn">
                {icon}
            </button>

            <div className="task-content-wrapper" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                {isEditing ? (
                    <input
                        ref={inputRef}
                        value={task.title}
                        onChange={(e) => onChangeTitle(e.target.value)}
                        className="task-input"
                        onBlur={() => setIsEditing(false)}
                        onKeyDown={handleKeyDown}
                        placeholder="Nome da tarefa..."
                    />
                ) : (
                    <span
                        className="task-title-text"
                        onDoubleClick={() => setIsEditing(true)}
                        style={{ flex: 1, cursor: 'pointer', padding: '0.5rem', color: '#e4e4e7' }}
                    >
                        {task.title || <i style={{ opacity: 0.5 }}>Sem título</i>}
                    </span>
                )}
            </div>

            {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="task-edit-btn" style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', marginRight: '0.2rem' }}>
                    <Pencil size={14} />
                </button>
            )}

            <button onClick={onDelete} className="task-delete-btn">
                <Trash2 size={14} />
            </button>
        </div>
    );
};

export default Clients;
