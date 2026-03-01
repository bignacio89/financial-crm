// apps/web/src/components/leads/StatsCard.tsx

interface StatsCardProps {
    title: string;
    value: string | number;
    color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}

const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    red: 'bg-red-50 text-red-700 border-red-200',
};

export default function StatsCard({ title, value, color }: StatsCardProps) {
    return (
        <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
            <p className="text-sm font-medium opacity-75">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
    );
}