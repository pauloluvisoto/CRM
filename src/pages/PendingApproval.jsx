import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';

const PendingApproval = () => {
    const { signOut, user } = useAuth();

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#09090b',
            color: 'white',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <div style={{
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                padding: '2rem',
                borderRadius: '50%',
                marginBottom: '2rem',
                color: '#eab308'
            }}>
                <ShieldAlert size={64} />
            </div>

            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Aguardando Aprovação</h1>

            <p style={{ color: '#a1a1aa', maxWidth: '500px', marginBottom: '2rem', lineHeight: '1.6' }}>
                Olá, <strong>{user?.email}</strong>. Seu cadastro foi realizado com sucesso, mas sua conta ainda precisa ser ativada por um administrador.
            </p>

            <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '3rem' }}>
                Entre em contato com seu gestor para solicitar o acesso.
            </p>

            <button
                onClick={signOut}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#27272a',
                    color: 'white',
                    border: '1px solid #3f3f46',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: 'medium',
                    transition: 'all 0.2s'
                }}
            >
                <LogOut size={18} /> Sair da conta
            </button>
        </div>
    );
};

export default PendingApproval;
