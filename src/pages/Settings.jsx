import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Bell, Shield, LogOut, Moon, Sun, Save, Puzzle, Users, MessageCircle } from 'lucide-react'; // Added MessageCircle
import WhatsAppSettings from '../components/Settings/WhatsAppSettings';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false
  });

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="settings-container">
      <style>{`
        .settings-container {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
          color: var(--text-primary);
        }

        .settings-header {
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 1rem;
        }

        .settings-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .settings-section {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 1.75rem;
          margin-bottom: 2rem;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .settings-section:hover {
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          margin-bottom: 1.5rem;
          color: #bef264;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.625rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: var(--text-primary);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .form-input:focus {
          outline: none;
          border-color: rgba(190, 242, 100, 0.5);
          background: rgba(190, 242, 100, 0.05);
          box-shadow: 0 0 0 3px rgba(190, 242, 100, 0.1);
        }

        .toggle-group {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .toggle-group:last-child {
            border-bottom: none;
        }

        .toggle-label {
          font-weight: 500;
        }

        .toggle-switch {
          position: relative;
          width: 54px;
          height: 28px;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .toggle-switch.active {
          background: linear-gradient(135deg, #bef264 0%, #a3e635 100%);
          border-color: transparent;
          box-shadow: 0 0 12px rgba(190, 242, 100, 0.3);
        }

        .toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .toggle-switch.active .toggle-thumb {
          transform: translateX(26px);
          background: #1a1a1a;
        }

        .save-btn {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          background: linear-gradient(135deg, #bef264 0%, #a3e635 100%);
          color: #1a1a1a;
          font-weight: 700;
          padding: 0.875rem 1. 75rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(190, 242, 100, 0.3);
        }

        .save-btn:hover {
          background: linear-gradient(135deg, #a3e635 0%, #84cc16 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(190, 242, 100, 0.4);
        }
        
        .save-btn:active {
            transform: translateY(0);
        }
      `}</style>

      <div className="settings-header">
        <h1 className="settings-title">Configurações</h1>
      </div>

      {/* Team Link (New) */}
      <div className="settings-section" style={{ cursor: 'pointer', borderLeft: '4px solid var(--primary)' }}>
        <Link to="/team" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(180, 240, 58, 0.1)', padding: '10px', borderRadius: '50%' }}>
            <Users size={24} color="var(--primary)" />
          </div>
          <div>
            <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Gerenciar Equipe</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Adicione membros e defina permissões de acesso.</p>
          </div>
        </Link>
      </div>

      {/* WhatsApp Integration Section */}
      <WhatsAppSettings />

      {/* Profile Section */}
      <div className="settings-section">
        <div className="section-header">
          <User size={24} />
          <h2 className="section-title">Perfil</h2>
        </div>

        <div className="form-group">
          <label className="form-label">Nome Completo</label>
          <input type="text" className="form-input" defaultValue="Paulo Silva" />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" defaultValue="paulo@empresa.com" readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
        </div>
      </div>

      {/* Notifications Section */}
      <div className="settings-section">
        <div className="section-header">
          <Bell size={24} />
          <h2 className="section-title">Notificações</h2>
        </div>

        <div className="toggle-group">
          <span className="toggle-label">Notificações por Email</span>
          <div
            className={`toggle-switch ${notifications.email ? 'active' : ''}`}
            onClick={() => toggleNotification('email')}
          >
            <div className="toggle-thumb"></div>
          </div>
        </div>

        <div className="toggle-group">
          <span className="toggle-label">Notificações Push (Navegador)</span>
          <div
            className={`toggle-switch ${notifications.push ? 'active' : ''}`}
            onClick={() => toggleNotification('push')}
          >
            <div className="toggle-thumb"></div>
          </div>
        </div>

        <div className="toggle-group">
          <span className="toggle-label">Ofertas e Marketing</span>
          <div
            className={`toggle-switch ${notifications.marketing ? 'active' : ''}`}
            onClick={() => toggleNotification('marketing')}
          >
            <div className="toggle-thumb"></div>
          </div>
        </div>
      </div>

      {/* Appearance Section (Mock) */}
      <div className="settings-section">
        <div className="section-header">
          <Moon size={24} />
          <h2 className="section-title">Aparência</h2>
        </div>

        <div className="toggle-group">
          <span className="toggle-label">Modo Escuro (Sempre Ativo)</span>
          <div className="toggle-switch active" style={{ cursor: 'not-allowed', opacity: 0.7 }}>
            <div className="toggle-thumb"></div>
          </div>
        </div>
      </div>

      {/* Integrations Section - Instagram */}
      <div className="settings-section">
        <div className="section-header">
          <Puzzle size={24} />
          <h2 className="section-title">Outras Integrações</h2>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 'bold', color: '#d6249f' }}>Instagram (Meta API)</label>
          <label className="form-label">Access Token</label>
          <input type="password" className="form-input" placeholder="••••••••••••" />
          <label className="form-label" style={{ marginTop: '0.5rem' }}>Page ID</label>
          <input type="text" className="form-input" placeholder="Ex: 100234..." />
        </div>

        <div className="form-group" style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
          <label className="form-label" style={{ color: 'var(--text-primary)' }}>Seu Webhook (Para Receber Mensagens)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              readOnly
              value="https://api.seucrm.com/webhook"
              style={{ background: '#111', fontFamily: 'monospace' }}
            />
            <button className="save-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => {
              navigator.clipboard.writeText('https://api.seucrm.com/webhook');
              alert('Copiado!');
            }}>Copiar</button>
          </div>
        </div>
      </div>

      <button className="save-btn" onClick={handleSave}>
        {loading ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
      </button>

    </div>
  );
};

export default Settings;
