// apps/web/src/components/leads/LeadCard.tsx

'use client';

import { Lead } from '@/lib/leads-api';
import { Mail, Phone, Edit, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LeadCardProps {
    lead: Lead;
    onEdit: (lead: Lead) => void;
    onDelete: (id: string) => void;
}

const stageBadgeColors = {
    NEW: 'bg-blue-100 text-blue-800 border-blue-200',
    CONTACTED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    MEETING_SCHEDULED: 'bg-purple-100 text-purple-800 border-purple-200',
    PROPOSAL_SENT: 'bg-orange-100 text-orange-800 border-orange-200',
    WON: 'bg-green-100 text-green-800 border-green-200',
    LOST: 'bg-red-100 text-red-800 border-red-200',
    NURTURE: 'bg-gray-100 text-gray-800 border-gray-200',
};

const stageLabels = {
    NEW: 'Nuevo',
    CONTACTED: 'Contactado',
    MEETING_SCHEDULED: 'Reunión Agendada',
    PROPOSAL_SENT: 'Propuesta Enviada',
    WON: 'Ganado',
    LOST: 'Perdido',
    NURTURE: 'Seguimiento',
};

const priorityBadgeColors = {
    HIGH: 'bg-red-100 text-red-800 border-red-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    LOW: 'bg-green-100 text-green-800 border-green-200',
};

const priorityLabels = {
    HIGH: 'Alta',
    MEDIUM: 'Media',
    LOW: 'Baja',
};

const sourceLabels = {
    WEB: 'Web',
    REFERRAL: 'Referido',
    LINKEDIN: 'LinkedIn',
    EVENT: 'Evento',
    COLD_CALL: 'Llamada Fría',
    OTHER: 'Otro',
};

export default function LeadCard({ lead, onEdit, onDelete }: LeadCardProps) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {sourceLabels[lead.source]}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onEdit(lead)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Editar"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(lead.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{lead.email}</span>
                </div>
                {lead.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{lead.phone}</span>
                    </div>
                )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
                <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${stageBadgeColors[lead.stage]
                        }`}
                >
                    {stageLabels[lead.stage]}
                </span>
                <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${priorityBadgeColors[lead.priority]
                        }`}
                >
                    {priorityLabels[lead.priority]}
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                    Score: {lead.score}
                </span>
            </div>

            {/* Notes */}
            {lead.notes && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {lead.notes}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                        {format(new Date(lead.createdAt), "d MMM yyyy", { locale: es })}
                    </span>
                </div>
                {lead.lastContact && (
                    <span className="text-xs text-gray-500">
                        Último contacto: {format(new Date(lead.lastContact), "d MMM", { locale: es })}
                    </span>
                )}
            </div>
        </div>
    );
}