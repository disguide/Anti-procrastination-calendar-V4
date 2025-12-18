
import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from '../../hooks/useTranslation';

interface ActivityChartProps {
    data: { date: string; minutes: number }[];
}

const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
    const { t } = useTranslation();

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-zinc-900 text-white text-xs p-2 rounded-lg shadow-xl border border-zinc-800">
                    <p className="font-bold mb-1">{label}</p>
                    <p>{payload[0].value} {t('minutesShort') || 'min'}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-64 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 px-2">{t('activitySummary')}</h3>
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={data}>
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#71717a' }}
                        tickFormatter={(val) => val.slice(5)} // Show MM-DD
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.minutes > 60 ? '#f97316' : '#3b82f6'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ActivityChart;
