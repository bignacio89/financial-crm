// apps/web/src/context/AuthContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, authAPI } from '@/lib/api';
import { getToken, setToken, removeToken, setUser as saveUser, removeUser, getUser as getSavedUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string, role?: 'AGENT' | 'ADMIN' | 'OPERATIONS') => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Initialize auth state from localStorage
    useEffect(() => {
        const initAuth = async () => {
            const token = getToken();
            const savedUser = getSavedUser();

            if (token && savedUser) {
                setUser(savedUser);

                // Verify token is still valid by fetching current user
                try {
                    const currentUser = await authAPI.getCurrentUser();
                    setUser(currentUser);
                    saveUser(currentUser);
                } catch (error) {
                    // Token invalid, clear auth
                    removeToken();
                    removeUser();
                    setUser(null);
                }
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await authAPI.login({ email, password });

            setToken(response.token);
            saveUser(response.user);
            setUser(response.user);

            // Usar window.location en lugar de router.push
            window.location.href = '/dashboard';
        } catch (error) {
            removeToken();
            removeUser();
            setUser(null);
            throw error;
        }
    };

    const register = async (
        email: string,
        password: string,
        name: string,
        role: 'AGENT' | 'ADMIN' | 'OPERATIONS' = 'AGENT'
    ) => {
        try {
            const response = await authAPI.register({ email, password, name, role });

            setToken(response.token);
            saveUser(response.user);
            setUser(response.user);

            // Usar window.location en lugar de router.push
            window.location.href = '/dashboard';
        } catch (error) {
            removeToken();
            removeUser();
            setUser(null);
            throw error;
        }
    };

    const logout = () => {
        removeToken();
        removeUser();
        setUser(null);
        router.push('/login');
    };

    const refreshUser = async () => {
        try {
            const currentUser = await authAPI.getCurrentUser();
            setUser(currentUser);
            saveUser(currentUser);
        } catch (error) {
            console.error('Failed to refresh user:', error);
            logout();
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};