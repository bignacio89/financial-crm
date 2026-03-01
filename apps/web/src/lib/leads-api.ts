// apps/web/src/lib/leads-api.ts

import api, { ApiResponse } from './api';

// ════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════

export type LeadStage =
    | 'NEW'
    | 'CONTACTED'
    | 'MEETING_SCHEDULED'
    | 'PROPOSAL_SENT'
    | 'WON'
    | 'LOST'
    | 'NURTURE';

export type LeadSource =
    | 'WEB'
    | 'REFERRAL'
    | 'LINKEDIN'
    | 'EVENT'
    | 'COLD_CALL'
    | 'OTHER';

export type LeadPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    source: LeadSource;
    stage: LeadStage;
    priority: LeadPriority;
    score: number;
    notes: string | null;
    agentId: string;
    createdAt: string;
    updatedAt: string;
    lastContact: string | null;
    agent?: {
        id: string;
        name: string;
        email: string;
    };
}

export interface LeadStats {
    total: number;
    byStage: {
        new: number;
        contacted: number;
        meetings: number;
        proposals: number;
        won: number;
        lost: number;
    };
    byPriority: {
        high: number;
        medium: number;
        low: number;
    };
    conversionRate: string;
}

export interface CreateLeadData {
    name: string;
    email: string;
    phone?: string;
    source: LeadSource;
    notes?: string;
    priority?: LeadPriority;
}

export interface UpdateLeadData {
    name?: string;
    email?: string;
    phone?: string;
    source?: LeadSource;
    stage?: LeadStage;
    priority?: LeadPriority;
    notes?: string;
}

export interface GetLeadsParams {
    stage?: LeadStage;
    priority?: LeadPriority;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
}

// ════════════════════════════════════════════
// API FUNCTIONS
// ════════════════════════════════════════════

export const leadsAPI = {
    /**
     * Get all leads with optional filters
     */
    getLeads: async (params?: GetLeadsParams): Promise<{ leads: Lead[]; total: number }> => {
        const response = await api.get<ApiResponse<{ leads: Lead[]; total: number }>>(
            '/api/leads',
            { params }
        );
        return response.data.data!;
    },

    /**
     * Get lead statistics
     */
    getStats: async (): Promise<LeadStats> => {
        const response = await api.get<ApiResponse<LeadStats>>('/api/leads/stats');
        return response.data.data!;
    },

    /**
     * Get single lead by ID
     */
    getLeadById: async (id: string): Promise<Lead> => {
        const response = await api.get<ApiResponse<{ lead: Lead }>>(`/api/leads/${id}`);
        return response.data.data!.lead;
    },

    /**
     * Create new lead
     */
    createLead: async (data: CreateLeadData): Promise<Lead> => {
        const response = await api.post<ApiResponse<{ lead: Lead }>>('/api/leads', data);
        return response.data.data!.lead;
    },

    /**
     * Update lead
     */
    updateLead: async (id: string, data: UpdateLeadData): Promise<Lead> => {
        const response = await api.put<ApiResponse<{ lead: Lead }>>(`/api/leads/${id}`, data);
        return response.data.data!.lead;
    },

    /**
     * Delete lead
     */
    deleteLead: async (id: string): Promise<void> => {
        await api.delete(`/api/leads/${id}`);
    },
};