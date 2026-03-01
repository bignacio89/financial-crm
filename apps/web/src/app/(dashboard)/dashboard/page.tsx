// apps/web/src/app/(dashboard)/dashboard/page.tsx

'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const getRoleTitle = (role: string) => {
        switch (role) {
            case 'AGENT':
                return 'Asesor';
            case 'ADMIN':
                return 'Administrador';
            case 'OPERATIONS':
                return 'Operaciones';
            default:
                return role;
        }
    };

    const getRoleDescription = (role: string) => {
        switch (role) {
            case 'AGENT':
                return 'Gestiona tus leads, clientes y ofertas desde este panel.';
            case 'ADMIN':
                return 'Administra el sistema, usuarios y configuración global.';
            case 'OPERATIONS':
                return 'Procesa ofertas, gestiona incidencias y aprueba waivers.';
            default:
                return 'Bienvenido al sistema.';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            {getRoleDescription(user.role)}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Welcome Card */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="sm:flex sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">
                                    ¡Bienvenido, {user.name}!
                                </h3>
                                <div className="mt-2 max-w-xl text-sm text-gray-500">
                                    <p>Has iniciado sesión correctamente como {getRoleTitle(user.role)}.</p>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-0">
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800">
                                    {getRoleTitle(user.role)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Info */}
                <div className="mt-8 overflow-hidden rounded-lg bg-white shadow">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                            Información de Usuario
                        </h3>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                                <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Rol</dt>
                                <dd className="mt-1 text-sm text-gray-900">{getRoleTitle(user.role)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Estado</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {user.isActive ? (
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                            Inactivo
                                        </span>
                                    )}
                                </dd>
                            </div>
                            {user.role === 'AGENT' && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Puede Renunciar Fees</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {user.canWaiverFees ? (
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                Sí
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                No
                                            </span>
                                        )}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Quick Actions - Role-based */}
                <div className="mt-8 overflow-hidden rounded-lg bg-white shadow">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                            Acciones Rápidas
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {user.role === 'AGENT' && (
                                <>
                                    <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-50">
                                        <div className="text-sm font-medium text-gray-900">Mis Leads</div>
                                        <div className="mt-1 text-sm text-gray-500">Ver y gestionar leads</div>
                                    </button>
                                    <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-50">
                                        <div className="text-sm font-medium text-gray-900">Mis Clientes</div>
                                        <div className="mt-1 text-sm text-gray-500">Ver clientes activos</div>
                                    </button>
                                    <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-50">
                                        <div className="text-sm font-medium text-gray-900">Mis Ofertas</div>
                                        <div className="mt-1 text-sm text-gray-500">Ver ofertas en proceso</div>
                                    </button>
                                </>
                            )}
                            {user.role === 'ADMIN' && (
                                <>
                                    <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-50">
                                        <div className="text-sm font-medium text-gray-900">Gestionar Usuarios</div>
                                        <div className="mt-1 text-sm text-gray-500">Crear y editar asesores</div>
                                    </button>
                                    <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-50">
                                        <div className="text-sm font-medium text-gray-900">Configurar Productos</div>
                                        <div className="mt-1 text-sm text-gray-500">Gestionar catálogo</div>
                                    </button>
                                    <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-50">
                                        <div className="text-sm font-medium text-gray-900">Reportes</div>
                                        <div className="mt-1 text-sm text-gray-500">Dashboard ejecutivo</div>
                                    </button>
                                </>
                            )}
                            {user.role === 'OPERATIONS' && (
                                <>
                                    <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-50">
                                        <div className="text-sm font-medium text-gray-900">Cola de Ofertas</div>
                                        <div className="mt-1 text-sm text-gray-500">Procesar ofertas pendientes</div>
                                    </button>
                                    <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-50">
                                        <div className="text-sm font-medium text-gray-900">Fee Waivers</div>
                                        <div className="mt-1 text-sm text-gray-500">Aprobar renuncias de fees</div>
                                    </button>
                                    <button className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-50">
                                        <div className="text-sm font-medium text-gray-900">Incidencias</div>
                                        <div className="mt-1 text-sm text-gray-500">Gestionar problemas</div>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coming Soon */}
                <div className="mt-8 rounded-lg bg-blue-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                🚀 Funcionalidades en Desarrollo
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>
                                    Estamos construyendo el resto del sistema. Próximamente: Gestión de Leads, Creación de Ofertas, Sistema de Fees, y más.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}