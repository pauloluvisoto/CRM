import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userStatus, setUserStatus] = useState(null); // 'active', 'pending', 'blocked'

    const handleUserSession = async (session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
            // EMERGENCY OVERRIDE FOR OWNER - Must be BEFORE database call to ensure accessibility
            if (currentUser.email === 'pluvisoto@gmail.com') {
                console.warn("Applying Emergency Admin Override for Owner (Bypass DB)");
                setRole('admin');
                setUserStatus('active');
                setLoading(false);
                return; // Exit early as we have everything we need
            }

            try {
                let { data, error } = await supabase
                    .from('profiles')
                    .select('role, status')
                    .eq('id', currentUser.id)
                    .maybeSingle();

                if (data) {
                    setRole(data.role);
                    setUserStatus(data.status || 'pending');
                }
            } catch (err) {
                console.error("Error fetching role:", err);
            }
        } else {
            setRole(null);
            setUserStatus(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        // Check active sessions and sets the user
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            await handleUserSession(session);
        };

        getSession();

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleUserSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        signUp: (data) => supabase.auth.signUp(data),
        signIn: (data) => supabase.auth.signInWithPassword(data),
        signOut: () => supabase.auth.signOut(),
        user,
        role,
        isAdmin: role === 'admin',
        isSupervisor: role === 'admin' || role === 'supervisor',
        status: userStatus,
        isPending: userStatus === 'pending',
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
