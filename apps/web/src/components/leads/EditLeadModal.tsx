// apps/web/src/components/leads/EditLeadModal.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { leadsAPI, Lead, LeadSource, LeadPriority, LeadStage } from '@/lib/leads-api';
import { X, Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';

const updateLeadSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    source: z.enum(['WEB', 'REFERRAL', 'LINKEDIN', 'EVENT', 'COLD_CALL', 'OTHER']).optional(),
    stage: z.enum(['NEW', 'CONTACTED', 'MEETING_SCHEDULED', 'PROPOSAL_SENT', 'WON', 'LOST', 'NURTURE']).optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    notes: z.string().optional(),
});

type UpdateLeadFormData = z.infer<typeof updateLeadSchema>;

interface EditLeadModalProps {
    lead: Lead;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditLeadModal({ lead, onClose, onSuccess }: EditLeadModalProps) {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<UpdateLeadFormData>({
        resolver: zodResolver(updateLeadSchema),
        defaultValues: {
            name: lead.name,
            email: lead.email,
            phone: lead.phone || '',
            source: lead.source,
            stage: lead.stage,
            priority: lead.priority,
            notes: lead.notes || '',
        },
    });

    const onSubmit = async (data: UpdateLeadFormData) => {
        setError(null);
        setIsLoading(true);

        try {
            await leadsAPI.updateLead(lead.id, data);
            onSuccess();
        } catch (err) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error || 'Error al actualizar el lead');
            } else {
                setError('Error al actualizar el lead');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Editar Lead</h2>
                    <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <div className="rounded-md bg-red-50 p-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre</label>
                        <input
                            {...register('name')}
                            type="text"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                        <input
                            {...register('phone')}
                            type="tel"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Etapa</label>
                        <select
                            {...register('stage')}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="NEW">Nuevo</option>
                            <option value="CONTACTED">Contactado</option>
                            <option value="MEETING_SCHEDULED">Reunión Agendada</option>
                            <option value="PROPOSAL_SENT">Propuesta Enviada</option>
                            <option value="WON">Ganado</option>
                            <option value="LOST">Perdido</option>
                            <option value="NURTURE">Seguimiento</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Origen</label>
                        <select
                            {...register('source')}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="WEB">Web</option>
                            <option value="REFERRAL">Referido</option>
                            <option value="LINKEDIN">LinkedIn</option>
                            <option value="EVENT">Evento</option>
                            <option value="COLD_CALL">Llamada Fría</option>
                            <option value="OTHER">Otro</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                        <select
                            {...register('priority')}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="HIGH">Alta</option>
                            <option value="MEDIUM">Media</option>
                            <option value="LOW">Baja</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Notas</label>
                        <textarea
                            {...register('notes')}
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}