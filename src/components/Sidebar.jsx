import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Trello, Users, Settings, BarChart3, MessageSquare, LogOut, Wallet, ChevronRight, ChevronDown, Plus, Shield, Briefcase, Bell } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Sidebar = () => {
  const { signOut, user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [pipelines, setPipelines] = useState([]);
  const [isPipelineMenuOpen, setIsPipelineMenuOpen] = useState(false);
  const [isClientsMenuOpen, setIsClientsMenuOpen] = useState(false);

  useEffect(() => {
    fetchPipelines();
    // Auto-open menu if we are in pipeline route
    if (location.pathname.includes('/pipeline')) {
      setIsPipelineMenuOpen(true);
    }
    if (location.pathname.includes('/clients')) {
      setIsClientsMenuOpen(true);
    }
  }, [location.pathname]); // Re-check on nav change

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
    // Pipeline is handled manually
    // { icon: Briefcase, label: 'Clientes', path: '/clients' }, // Handled manually now
    { icon: Users, label: 'Contatos', path: '/contacts' },
    { icon: Wallet, label: 'Financeiro', path: '/finance' },
    { icon: MessageSquare, label: 'Mensagens', path: '/messages' },
    { icon: BarChart3, label: 'Relatórios', path: '/reports', disabled: true },
    // Show Team Settings only for Admins
    ...(role === 'admin' ? [{ icon: Shield, label: 'Equipe', path: '/team', disabled: true }] : []),
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <h1 className="logo-text">recupera<span className="logo-suffix">.ia</span></h1>
      </div>

      <nav className="nav-menu">
        {/* MANUAL DASHBOARD ITEM */}
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span className="nav-label">Dashboard</span>
        </NavLink>

        {/* PIPELINE SUBMENU */}
        <div className="nav-group">
          <div
            className={`nav-item cursor-pointer ${location.pathname.includes('/pipeline') ? 'active-parent' : ''}`}
            onClick={() => setIsPipelineMenuOpen(!isPipelineMenuOpen)}
          >
            <Trello size={20} />
            <span className="nav-label flex-1">Pipelines</span>
            {isPipelineMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>

          {isPipelineMenuOpen && (
            <div className="submenu">
              {pipelines.map(p => (
                <NavLink
                  key={p.id}
                  to={`/pipeline/${p.id}`}
                  className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                >
                  {p.name}
                </NavLink>
              ))}
              <div
                className="submenu-item create-new"
                onClick={() => navigate('/pipeline/new')}
              >
                <Plus size={14} /> Novo
              </div>
            </div>
          )}
        </div>

        {/* CLIENTS SUBMENU */}
        <div className="nav-group">
          <div
            className={`nav-item cursor-pointer ${location.pathname.includes('/clients') ? 'active-parent' : ''}`}
            onClick={() => setIsClientsMenuOpen(!isClientsMenuOpen)}
          >
            <Briefcase size={20} />
            <span className="nav-label flex-1">Clientes</span>
            {isClientsMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>

          {isClientsMenuOpen && (
            <div className="submenu">
              <NavLink
                to="/clients/onboarding"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
              >
                Onboarding
              </NavLink>
              <NavLink
                to="/clients/maintenance"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
              >
                Manutenção
              </NavLink>
            </div>
          )}
        </div>

        {/* REST OF ITEMS */}
        {navItems.filter(i => i.path !== '/dashboard' && i.path !== '/pipeline').map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={(e) => item.disabled && e.preventDefault()}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${item.disabled ? 'disabled-item' : ''}`}
          >
            <item.icon size={20} />
            <span className="nav-label">{item.label}</span>
            {item.disabled && <span className="coming-soon-badge">Em Breve</span>}
          </NavLink>
        ))}

        <div style={{ marginTop: 'auto' }}>
          <NavLink
            to="/notifications"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Bell size={20} />
            <span className="nav-label">Notificações</span>
            <span className="notification-badge">3</span>
          </NavLink>
        </div>
      </nav>

      <div className="user-profile">
        <div className="avatar">{user?.email?.[0].toUpperCase()}</div>
        <div className="user-info">
          <span className="user-name">{user?.email || 'Usuário'}</span>
          <span className="user-role" style={{ textTransform: 'capitalize' }}>
            {role ? (role === 'admin' ? 'Administrador' : role === 'supervisor' ? 'Supervisor' : 'Vendedor') : 'Carregando...'}
          </span>
        </div>
        <button onClick={handleLogout} className="logout-btn" title="Sair">
          <LogOut size={18} />
        </button>
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          background: linear-gradient(180deg, rgba(20, 20, 30, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          height: 100vh;
          backdrop-filter: blur(12px);
          box-shadow: 2px 0 12px rgba(0, 0, 0, 0.3);
        }

        .logo-container {
          height: var(--header-height);
          display: flex;
          align-items: center;
          padding: 0 var(--spacing-lg);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.8) 100%);
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.05em;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .logo-suffix {
            color: #bef264;
            text-shadow: 0 0 10px rgba(190, 242, 100, 0.3);
        }

        .nav-menu {
          flex: 1;
          padding: var(--spacing-md) var(--spacing-sm);
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          overflow-y: auto;
        }

        .nav-menu::-webkit-scrollbar {
          width: 4px;
        }

        .nav-menu::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }

        .nav-menu::-webkit-scrollbar-thumb {
          background: rgba(190, 242, 100, 0.2);
          border-radius: 2px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: 0.75rem var(--spacing-md);
          border-radius: 10px;
          color: var(--text-secondary);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateX(2px);
        }

        .nav-item.active {
          background: linear-gradient(135deg, #bef264 0%, #a3e635 100%);
          color: #1a1a1a;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(190, 242, 100, 0.3);
          border-color: transparent;
        }

        .active-parent {
            color: #bef264;
            background: rgba(190, 242, 100, 0.08);
            border-color: rgba(190, 242, 100, 0.2);
        }

        .submenu {
            margin-left: 2rem;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            border-left: 2px solid rgba(190, 242, 100, 0.2);
            padding-left: 0.75rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
        }

        .submenu-item {
            padding: 0.5rem 1rem;
            font-size: 0.85rem;
            color: var(--text-secondary);
            border-radius: 8px;
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border: 1px solid transparent;
        }

        .submenu-item:hover {
            color: var(--text-primary);
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.1);
            transform: translateX(2px);
        }

        .submenu-item.active {
            color: #bef264;
            background: rgba(190, 242, 100, 0.1);
            border-color: rgba(190, 242, 100, 0.3);
            font-weight: 600;
        }
        
        .create-new {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-muted);
            font-style: italic;
            cursor: pointer;
        }
        .create-new:hover {
            color: #bef264;
            font-weight: 600;
        }

        .user-profile {
          padding: var(--spacing-md);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.8) 0%, rgba(20, 20, 30, 0.9) 100%);
          backdrop-filter: blur(10px);
        }

        .avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, rgba(190, 242, 100, 0.2) 0%, rgba(163, 230, 53, 0.1) 100%);
          color: #bef264;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          border: 2px solid rgba(190, 242, 100, 0.3);
          box-shadow: 0 0 12px rgba(190, 242, 100, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .avatar:hover {
          transform: scale(1.05);
          box-shadow: 0 0 16px rgba(190, 242, 100, 0.3);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .logout-btn {
            color: var(--text-secondary);
            padding: 0.625rem;
            border-radius: 8px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .logout-btn:hover {
            color: #ef4444;
            background: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.3);
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .notification-badge {
            background: #bef264;
            color: #1a1a1a;
            font-size: 0.7rem;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 999px;
            margin-left: auto;
        }

        .disabled-item {
            opacity: 0.5;
            cursor: not-allowed !important;
        }

        .disabled-item:hover {
            background: transparent !important;
            color: var(--text-secondary) !important;
            transform: none !important;
            border-color: transparent !important;
        }

        .coming-soon-badge {
            background: rgba(255, 255, 255, 0.1);
            color: #a1a1aa;
            font-size: 0.65rem;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: auto;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
