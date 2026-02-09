import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Shield, UserPlus, Trash2, Mail, Settings, Users, X } from 'lucide-react';

const TeamSettings = () => {
    const { user, isAdmin } = useAuth();

    // Data State
    const [teamMembers, setTeamMembers] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [teams, setTeams] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);

    // UI State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form inputs
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('sales');
    const [inviteTeam, setInviteTeam] = useState('');
    const [newTeamName, setNewTeamName] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Profiles
            const { data: profiles, error: profileError } = await supabase.from('profiles').select('*').order('full_name');
            if (profileError) console.error("Profile Fetch Error:", profileError);

            setTeamMembers(profiles?.filter(p => p.status === 'active') || []);
            setPendingUsers(profiles?.filter(p => p.status === 'pending') || []);

            // 2. Fetch Teams
            const { data: teamsData } = await supabase.from('teams').select('*').order('name');
            setTeams(teamsData || []);

            // 3. Fetch Invitations
            if (isAdmin) {
                const { data: invites } = await supabase.from('invitations').select('*').order('created_at', { ascending: false });
                setInvitations(invites || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvite = async () => {
        if (!inviteEmail) return;
        try {
            await supabase.from('invitations').insert({
                email: inviteEmail.trim().toLowerCase(),
                role: inviteRole,
                team_id: inviteTeam || null,
                status: 'pending'
            });
            alert('Convite criado! O usuário terá acesso assim que se cadastrar com este email.');
            setIsInviteModalOpen(false);
            setInviteEmail('');
            fetchData();
        } catch (err) {
            alert('Erro ao criar convite: ' + err.message);
        }
    };

    const handleCreateTeam = async () => {
        if (!newTeamName) return;
        try {
            await supabase.from('teams').insert({
                name: newTeamName,
                supervisor_id: user.id // Default to creator for now
            });
            setIsTeamModalOpen(false);
            setNewTeamName('');
            fetchData();
        } catch (err) {
            alert('Erro ao criar time: ' + err.message);
        }
    };

    const handleApproveUser = async (userId, role, teamId) => {
        try {
            await supabase.from('profiles').update({
                status: 'active',
                role: role,
                team_id: teamId || null
            }).eq('id', userId);
            fetchData();
        } catch (err) { alert(err.message); }
    };

    const handleRemoveUser = async (userId) => {
        if (!confirm('Bloquear acesso deste usuário?')) return;
        try {
            await supabase.from('profiles').update({ status: 'blocked' }).eq('id', userId);
            fetchData();
        } catch (err) { alert(err.message); }
    };

    const handleDeleteInvite = async (inviteId) => {
        if (!confirm('Excluir este convite pendente?')) return;
        try {
            const { error } = await supabase.from('invitations').delete().eq('id', inviteId);
            if (error) throw error;
            fetchData();
        } catch (err) { alert('Erro ao excluir convite: ' + err.message); }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!confirm('Tem certeza que deseja EXCLUIR este time? Os membros ficarão sem time.')) return;
        try {
            // Optional: Set members to null team first, or rely on ON DELETE SET NULL if configured
            await supabase.from('profiles').update({ team_id: null }).eq('team_id', teamId);

            const { error } = await supabase.from('teams').delete().eq('id', teamId);
            if (error) throw error;
            fetchData();
        } catch (err) { alert('Erro ao excluir time: ' + err.message); }
    };

    // --- STYLES (Inline to guarantee identity match) ---
    const styles = {
        container: {
            padding: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
            color: 'var(--text-primary)',
        },
        card: {
            background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.8) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        },
        headerCard: {
            background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.7) 0%, rgba(20, 20, 30, 0.9) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1.75rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            position: 'relative',
            zIndex: 10
        },
        primaryButton: {
            background: 'linear-gradient(135deg, #bef264 0%, #a3e635 100%)',
            color: '#1a1a1a',
            fontWeight: '700',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(190, 242, 100, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        secondaryButton: {
            backgroundColor: 'var(--bg-hover)',
            color: 'var(--text-primary)',
            fontWeight: '500',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            fontSize: '0.9rem'
        },
        sectionTitle: {
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        },
        teamHeader: {
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.2)'
        },
        teamInitial: {
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-hover)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.1rem'
        },
        badge: {
            backgroundColor: 'var(--bg-hover)',
            color: 'var(--text-secondary)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '500'
        }
    };

    if (!isAdmin) return (
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...styles.card, padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
                <Shield size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Acesso Restrito</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Apenas administradores podem gerenciar a equipe.</p>
            </div>
        </div>
    );

    return (
        <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
            {/* Header */}
            <div style={styles.headerCard}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', margin: 0 }}>Gestão de Equipe</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '0.9rem' }}>Gerencie times, permissões e convites.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setIsTeamModalOpen(true)} style={styles.secondaryButton}>
                        <Shield size={18} /> Novo Time
                    </button>
                    <button onClick={() => setIsInviteModalOpen(true)} style={styles.primaryButton}>
                        <UserPlus size={18} /> Convidar Membro
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

                {/* Left Column: Teams */}
                <div>
                    {/* Pending Approvals (Only if any) */}
                    {pendingUsers.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ ...styles.sectionTitle, color: 'var(--warning)' }}>
                                <Shield size={20} /> Solicitações de Acesso
                            </h2>
                            <div style={{ ...styles.card, border: '1px solid var(--warning)' }}>
                                {pendingUsers.map(user => (
                                    <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{user.full_name || 'Usuário sem nome'}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cadastrado em {new Date(user.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleRemoveUser(user.id)}
                                                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer' }}
                                                title="Rejeitar"
                                            >
                                                <X size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleApproveUser(user.id, 'sales', null)} // Default to Sales as requested
                                                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: 'black', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                title="Aprovar como Vendedor"
                                            >
                                                <Shield size={16} /> Aprovar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <h2 style={styles.sectionTitle}>
                        <Shield size={20} color="var(--primary)" /> Times Ativos
                    </h2>

                    {teams.length === 0 && (
                        <div style={{ ...styles.card, padding: '2rem', textAlign: 'center', borderStyle: 'dashed', backgroundColor: 'rgba(13, 31, 18, 0.5)' }}>
                            <Shield size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p style={{ color: 'var(--text-secondary)' }}>Nenhum time criado ainda.</p>
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {teams.map(team => (
                            <div key={team.id} style={styles.card}>
                                <div style={styles.teamHeader}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={styles.teamInitial}>{team.name[0]}</div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{team.name}</h3>
                                            <span style={styles.badge}>{teamMembers.filter(m => m.team_id === team.id).length} membros</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteTeam(team.id)}
                                        title="Excluir Time"
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div style={{ padding: '0.5rem' }}>
                                    {teamMembers.filter(m => m.team_id === team.id).length === 0 && (
                                        <div style={{ padding: '1rem', textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            Este time está vazio.
                                        </div>
                                    )}
                                    {teamMembers.filter(m => m.team_id === team.id).map(member => (
                                        <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '6px' }} className="hover:bg-white/5">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {member.full_name?.[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{member.full_name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member.role === 'sales' ? 'Vendedor' : member.role}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveUser(member.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Users without team */}
                    <div style={{ marginTop: '2rem' }}>
                        <h2 style={styles.sectionTitle}>
                            <Users size={20} color="gray" /> Sem Time
                        </h2>
                        <div style={styles.card}>
                            {teamMembers.filter(m => !m.team_id).length === 0 ? (
                                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Todos os usuários estão em times.
                                </div>
                            ) : (
                                <div style={{ padding: '0.5rem' }}>
                                    {teamMembers.filter(m => !m.team_id).map(member => (
                                        <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                                    {member.full_name?.[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{member.full_name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member.email}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveUser(member.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Invites */}
                <div>
                    <div style={{ ...styles.card, padding: '1.5rem', position: 'sticky', top: '1rem' }}>
                        <h2 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={16} /> Convites Pendentes
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {invitations.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-muted)' }}>
                                    <p style={{ fontSize: '0.9rem' }}>Nenhum convite.</p>
                                </div>
                            ) : (
                                invitations.map(invite => (
                                    <div key={invite.id} style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', padding: '1px 6px', borderRadius: '4px', backgroundColor: invite.role === 'admin' ? 'purple' : 'var(--bg-hover)', color: 'white' }}>
                                                {invite.role}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteInvite(invite.id)}
                                                title="Excluir Convite"
                                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>{invite.email}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enviado em {new Date(invite.created_at).toLocaleDateString()}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ ...styles.card, padding: '2rem', width: '100%', maxWidth: '400px' }}>
                        <h2 style={{ margin: '0 0 1.5rem', color: 'white' }}>Convidar Membro</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email do Usuário</label>
                                <input
                                    style={{ width: '100%', padding: '0.8rem', backgroundColor: 'black', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', outline: 'none' }}
                                    placeholder="exemplo@email.com"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Função</label>
                                    <select
                                        style={{ width: '100%', padding: '0.8rem', backgroundColor: 'black', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', outline: 'none' }}
                                        value={inviteRole}
                                        onChange={e => setInviteRole(e.target.value)}
                                    >
                                        <option value="sales">Vendedor</option>
                                        <option value="supervisor">Supervisor</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Time (Opcional)</label>
                                    <select
                                        style={{ width: '100%', padding: '0.8rem', backgroundColor: 'black', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', outline: 'none' }}
                                        value={inviteTeam}
                                        onChange={e => setInviteTeam(e.target.value)}
                                    >
                                        <option value="">Sem Time</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setIsInviteModalOpen(false)} style={{ ...styles.secondaryButton, flex: 1, justifyContent: 'center' }}>Cancelar</button>
                            <button onClick={handleCreateInvite} style={{ ...styles.primaryButton, flex: 1, justifyContent: 'center' }}>Enviar Convite</button>
                        </div>
                    </div>
                </div>
            )}

            {isTeamModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ ...styles.card, padding: '2rem', width: '100%', maxWidth: '400px' }}>
                        <h2 style={{ margin: '0 0 1.5rem', color: 'white' }}>Criar Time</h2>
                        <input
                            style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', backgroundColor: 'black', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }}
                            placeholder="Nome do Time"
                            value={newTeamName}
                            onChange={e => setNewTeamName(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setIsTeamModalOpen(false)} style={{ ...styles.secondaryButton, flex: 1, justifyContent: 'center' }}>Cancelar</button>
                            <button onClick={handleCreateTeam} style={{ ...styles.primaryButton, flex: 1, justifyContent: 'center' }}>Criar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamSettings;
