import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Trello, Users, Settings, BarChart3, MessageSquare, LogOut, ChevronRight, ChevronDown, Plus, Shield, Target, Bell } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Sidebar = () => {
  const { signOut, user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [pipelines, setPipelines] = useState([]);
  const [isPipelineMenuOpen, setIsPipelineMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2); // Mock count

  useEffect(() => {
    fetchPipelines();
    if (location.pathname.includes('/pipeline')) {
      setIsPipelineMenuOpen(true);
    }
  }, [location.pathname]);

  const fetchPipelines = async () => {
    try {
      const { data, error } = await supabase.from('pipelines').select('*').order('created_at', { ascending: true });
      if (!error && data) {
        setPipelines(data);
      }
    } catch (err) {
      console.error('Error fetching pipelines in sidebar:', err);
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Erro ao sair: " + error.message);
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Contatos', path: '/contacts' },
    { icon: MessageSquare, label: 'Mensagens', path: '/messages' },
    { icon: Bell, label: 'Notificações', path: '/notifications', badge: unreadNotifications },
    { icon: BarChart3, label: 'Financeiro', path: '/finance' },
    { icon: BarChart3, label: 'Relatórios', path: '/reports' },
    ...(role === 'admin' ? [{ icon: Shield, label: 'Equipe', path: '/team' }] : []),
    { icon: Target, label: 'Metas', path: '/goals-config' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  return (
    <aside className="w-64 flex flex-col h-screen border-r border-white/5 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] shadow-2xl relative z-40">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          recupera<span className="text-brand">.ia</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `group flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
              ? 'bg-brand text-black shadow-md'
              : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
            }`
          }
        >
          <LayoutDashboard size={18} className="flex-shrink-0" />
          <span>Dashboard</span>
        </NavLink>

        {/* PIPELINE GROUP */}
        <div className="flex flex-col gap-1">
          <div
            className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${location.pathname.includes('/pipeline')
              ? 'bg-white/5 text-brand'
              : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
            onClick={() => setIsPipelineMenuOpen(!isPipelineMenuOpen)}
          >
            <Trello size={18} className="flex-shrink-0" />
            <span className="flex-1">Pipelines</span>
            {isPipelineMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>

          {isPipelineMenuOpen && (
            <div className="ml-4 pl-4 border-l border-white/10 flex flex-col gap-0.5 my-1">
              {pipelines.map(p => (
                <NavLink
                  key={p.id}
                  to={`/pipeline/${p.id}`}
                  className={({ isActive }) =>
                    `block px-3 py-1.5 rounded-md text-xs font-medium transition-all truncate ${isActive
                      ? 'bg-brand/20 text-brand font-semibold'
                      : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
                    }`
                  }
                >
                  {p.name}
                </NavLink>
              ))}
              <div
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted hover:text-brand cursor-pointer transition-colors"
                onClick={() => navigate('/pipeline/new')}
              >
                <Plus size={12} /> Novo Pipeline
              </div>
            </div>
          )}
        </div>

        {/* Other Nav Items */}
        {navItems.filter(i => i.path !== '/dashboard' && i.path !== '/pipeline').map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${isActive
                ? 'bg-brand text-black shadow-md'
                : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold text-sm border border-brand/30">
          {user?.email?.[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-primary truncate">
            {user?.email?.split('@')[0] || 'Usuário'}
          </div>
          <div className="text-xs text-text-secondary capitalize">
            {role || 'Carregando...'}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
