// apps/web/src/app/(dashboard)/leads/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    leadsAPI,
    Lead,
    LeadStats,
    LeadStage,
    LeadPriority,
} from '@/lib/leads-api';
import { Loader2, Plus, Search, Filter } from 'lucide-react';
import CreateLeadModal from '@/components/leads/CreateLeadModal';
import EditLeadModal from '@/components/leads/EditLeadModal';
import LeadCard from '@/components/leads/LeadCard';
import StatsCard from '@/components/leads/StatsCard';

export default function LeadsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [leads, setLeads] = useState<Lead[]>([]);
    const [stats, setStats] = useState<LeadStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [stageFilter, setStageFilter] = useState<LeadStage | ''>('');
    const [priorityFilter, setPriorityFilter] = useState<LeadPriority | ''>('');
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchLeads();
            fetchStats();
        }
    }, [user, stageFilter, priorityFilter, searchQuery]);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const data = await leadsAPI.getLeads({
                stage: stageFilter || undefined,
                priority: priorityFilter || undefined,
                search: searchQuery || undefined,
            });
            setLeads(data.leads);
            setError(null);
        } catch (err) {
            console.error('Error fetching leads:', err);
            setError('Failed to load leads');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await leadsAPI.getStats();
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const handleLeadCreated = () => {
        fetchLeads();
        fetchStats();
        setShowCreateModal(false);
    };

    const handleLeadUpdated = () => {
        fetchLeads();
        fetchStats();
        setEditingLead(null);
    };

    const handleLeadDeleted = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este lead?')) return;

        try {
            await leadsAPI.deleteLead(id);
            fetchLeads();
            fetchStats();
        } catch (err) {
            console.error('Error deleting lead:', err);
            alert('Error al eliminar el lead');
        }
    };

    if (authLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                                Mis Leads
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Gestiona tu pipeline de ventas
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo Lead
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Stats */}
                {stats && (
                    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatsCard
                            title="Total Leads"
                            value={stats.total}
                            color="blue"
                        />
                        <StatsCard
                            title="Nuevos"
                            value={stats.byStage.new}
                            color="green"
                        />
                        <StatsCard
                            title="En Reunión"
                            value={stats.byStage.meetings}
                            color="yellow"
                        />
                        <StatsCard
                            title="Tasa Conversión"
                            value={stats.conversionRate}
                            color="purple"
                        />
                    </div>
                )}

                {/* Filters */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        {/* Stage Filter */}
                        <select
                            value={stageFilter}
                            onChange={(e) => setStageFilter(e.target.value as LeadStage | '')}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Todas las etapas</option>
                            <option value="NEW">Nuevo</option>
                            <option value="CONTACTED">Contactado</option>
                            <option value="MEETING_SCHEDULED">Reunión Agendada</option>
                            <option value="PROPOSAL_SENT">Propuesta Enviada</option>
                            <option value="WON">Ganado</option>
                            <option value="LOST">Perdido</option>
                            <option value="NURTURE">Seguimiento</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value as LeadPriority | '')}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Todas las prioridades</option>
                            <option value="HIGH">Alta</option>
                            <option value="MEDIUM">Media</option>
                            <option value="LOW">Baja</option>
                        </select>
                    </div>

                    <div className="text-sm text-gray-600">
                        {leads.length} lead{leads.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Leads List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : error ? (
                    <div className="rounded-md bg-red-50 p-4">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                        <p className="text-sm text-gray-600">
                            No hay leads que coincidan con los filtros.
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                            Crear tu primer lead →
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {leads.map((lead) => (
                            <LeadCard
                                key={lead.id}
                                lead={lead}
                                onEdit={(lead) => setEditingLead(lead)}
                                onDelete={handleLeadDeleted}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Modals */}
            {showCreateModal && (
                <CreateLeadModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleLeadCreated}
                />
            )}

            {editingLead && (
                <EditLeadModal
                    lead={editingLead}
                    onClose={() => setEditingLead(null)}
                    onSuccess={handleLeadUpdated}
                />
            )}
        </div>
    );
}