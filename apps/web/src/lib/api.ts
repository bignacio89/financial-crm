// apps/web/src/lib/api.ts

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor - add token to requests
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Get token from localStorage
        const token = localStorage.getItem('auth_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        // Handle 401 Unauthorized - token expired or invalid
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Clear invalid token
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');

            // Redirect to login
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }

            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default api;

// ════════════════════════════════════════════
// API Response Types
// ════════════════════════════════════════════

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'AGENT' | 'ADMIN' | 'OPERATIONS';
    canWaiverFees: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

// ════════════════════════════════════════════
// API Functions
// ════════════════════════════════════════════

export const authAPI = {
    register: async (data: {
        email: string;
        password: string;
        name: string;
        role?: 'AGENT' | 'ADMIN' | 'OPERATIONS';
    }): Promise<AuthResponse> => {
        const response = await api.post<ApiResponse<AuthResponse>>(
            '/api/auth/register',
            data
        );
        return response.data.data!;
    },

    login: async (data: {
        email: string;
        password: string;
    }): Promise<AuthResponse> => {
        const response = await api.post<ApiResponse<AuthResponse>>(
            '/api/auth/login',
            data
        );
        return response.data.data!;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await api.get<ApiResponse<{ user: User }>>(
            '/api/auth/me'
        );
        return response.data.data!.user;
    },

    refreshToken: async (): Promise<string> => {
        const response = await api.post<ApiResponse<{ token: string }>>(
            '/api/auth/refresh'
        );
        return response.data.data!.token;
    },
};