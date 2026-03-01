// apps/web/src/app/(auth)/register/page.tsx

import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <RegisterForm />
        </div>
    );
}