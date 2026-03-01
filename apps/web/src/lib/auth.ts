// apps/web/src/lib/auth.ts

import { User } from './api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';

// ════════════════════════════════════════════
// Token Management
// ════════════════════════════════════════════

export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
};

// ════════════════════════════════════════════
// User Management
// ════════════════════════════════════════════

export const getUser = (): User | null => {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    try {
        return JSON.parse(userStr) as User;
    } catch {
        return null;
    }
};

export const setUser = (user: User): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUser = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
};

// ════════════════════════════════════════════
// Auth State
// ════════════════════════════════════════════

export const isAuthenticated = (): boolean => {
    return !!getToken();
};

export const logout = (): void => {
    removeToken();
    removeUser();

    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
};

// ════════════════════════════════════════════
// JWT Helpers
// ════════════════════════════════════════════

interface JwtPayload {
    userId: string;
    email: string;
    role: 'AGENT' | 'ADMIN' | 'OPERATIONS';
    iat: number;
    exp: number;
}

export const decodeToken = (token: string): JwtPayload | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

export const isTokenExpired = (token: string): boolean => {
    const decoded = decodeToken(token);
    if (!decoded) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
};

export const getTokenExpiryTime = (token: string): Date | null => {
    const decoded = decodeToken(token);
    if (!decoded) return null;

    return new Date(decoded.exp * 1000);
};