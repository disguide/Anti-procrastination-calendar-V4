
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon: Icon, trend, color = "primary" }) => {
    const colorClasses = {
        primary: "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400",
        green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
        orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
        purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    }[color] || "bg-zinc-100 text-zinc-600";

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
            <div className={`p-3 rounded-xl ${colorClasses}`}>
                <Icon size={24} />
            </div>
            <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</div>
                <div className="text-2xl font-black text-zinc-900 dark:text-white leading-none mt-1">{value}</div>
                {subValue && <div className="text-[10px] font-bold text-zinc-500 mt-1">{subValue}</div>}
            </div>
        </div>
    );
};

export default StatCard;
