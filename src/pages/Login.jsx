
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import '../index.css'; // Ensure global variables are available

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        // 1. Check for Invitation
        const { data: invite } = await supabase
          .from('invitations')
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .single();

        // 2. Sign Up
        const { error: authError, data } = await signUp({ email, password });
        if (authError) throw authError;

        // 3. Create Profile with correct defaults
        if (data.user) {
          const updates = {
            id: data.user.id,
            email: email,
            role: invite ? invite.role : 'sales', // Default to sales if no invite
            status: invite ? 'active' : 'pending', // Pending if no invite
            team_id: invite ? invite.team_id : null,
            full_name: email.split('@')[0]
          };

          await supabase.from('profiles').upsert(updates);

          // 4. Mark invite as accepted if exists
          if (invite) {
            await supabase.from('invitations').update({ status: 'accepted' }).eq('id', invite.id);
          }
        }

        setSuccessMsg(invite
          ? 'Cadastro realizado! Você já foi adicionado à sua equipe.'
          : 'Cadastro realizado! Aguarde a aprovação do administrador para acessar.');

        setIsSignUp(false);
      } else {
        const { error } = await signIn({ email, password });
        if (error) throw error;
        navigate('/');
      }
    } catch (error) {
      setError(isSignUp ? 'Falha ao cadastrar: ' + error.message : 'Falha ao fazer login. Verifique suas credenciais.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <style>{`
        .login-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          overflow: hidden;
        }

        .login-left {
          flex: 1;
          background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
          display: flex;
          flex-direction: column;
          justify-content: center; /* Center vertically */
          align-items: flex-start; /* Align to the LEFT */
          padding: 6rem; /* Increased padding */
          position: relative;
          border-right: 1px solid var(--border-color);
        }

        /* ... existing pseudo element code ... */

        .brand-logo {
          font-family: 'Outfit', sans-serif;
          font-size: 5rem; /* Slightly larger */
          font-weight: 800;
          letter-spacing: -0.05em;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
          z-index: 1;
          line-height: 1.1;
        }
        
        .brand-logo span {
          color: var(--primary);
        }

        .tagline {
           color: var(--text-secondary);
           font-size: 1.5rem; /* Larger tagline */
           text-align: left; /* Left align text */
           z-index: 1;
           max-width: 500px;
           line-height: 1.4;
        }

        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-primary);
          position: relative;
        }

        .login-form-wrapper {
          width: 100%;
          max-width: 400px;
          padding: 3rem;
          background-color: rgba(26, 29, 33, 0.4); /* Glass-like effect */
          border: 1px solid var(--border-color);
          border-radius: 1rem;
          backdrop-filter: blur(10px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .form-header {
           margin-bottom: 2rem;
           text-align: center;
        }

        .form-title {
           font-size: 2rem;
           font-weight: 700;
           margin-bottom: 0.5rem;
           color: var(--text-primary);
        }

        .form-subtitle {
           color: var(--text-secondary);
           font-size: 0.95rem;
        }

        .input-group {
          margin-bottom: 1.5rem;
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
          width: 20px;
          height: 20px;
        }

        .form-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          background-color: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          color: var(--text-primary);
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(183, 255, 0, 0.1);
          background-color: rgba(0, 0, 0, 0.3);
        }

        .login-btn {
          width: 100%;
          padding: 1rem;
          background: var(--primary);
          color: #000;
          font-weight: 600;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 1rem;
          margin-top: 1rem;
        }

        .login-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(183, 255, 0, 0.3);
          background-color: #a3e600; /* Slightly darker lime */
        }
        
        .login-btn:active {
            transform: translateY(0);
        }

        .forgot-password {
          text-align: center;
          margin-top: 1.5rem;
        }

        .forgot-password a {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s;
        }
        
        .forgot-password a:hover {
            color: var(--primary);
        }

        .auth-toggle {
          text-align: center;
          margin-top: 1.5rem;
          color: var(--text-secondary);
        }

        .auth-toggle button {
          color: var(--primary);
          background: none;
          border: none;
          font-weight: 600;
          cursor: pointer;
          margin-left: 0.5rem;
          font-size: 0.95rem;
        }
        
        .auth-toggle button:hover {
            text-decoration: underline;
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
           .login-container {
             flex-direction: column;
           }
           .login-left {
             display: none; /* Hide left panel on mobile for simplicity */
           }
           .login-form-wrapper {
             box-shadow: none;
             background: transparent;
             border: none;
           }
        }

      `}</style>

      <div className="login-left">
        <h1 className="brand-logo">
          recupera<span>.ia</span>
        </h1>
        <p className="tagline">
          Inteligência Artificial para recuperar vendas perdidas e potencializar seu time comercial.
        </p>
      </div>

      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="form-header">
            <h2 className="form-title">{isSignUp ? 'Criar Conta' : 'Bem-vindo'}</h2>
            <p className="form-subtitle">
              {isSignUp ? 'Preencha os dados para começar' : 'Faça login para acessar o painel'}
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              fontSize: '0.9rem'
            }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleAuth}>
            <div className="input-group">
              <Mail className="input-icon" />
              <input
                type="email"
                placeholder="seunome@empresa.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <Lock className="input-icon" />
              <input
                type="password"
                placeholder="Sua senha"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (isSignUp ? 'Cadastrando...' : 'Entrando...') : (
                <>
                  {isSignUp ? 'Cadastrar' : 'Entrar'} <ArrowRight size={20} />
                </>
              )}
            </button>

            <div className="auth-toggle">
              {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
              <button type="button" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
