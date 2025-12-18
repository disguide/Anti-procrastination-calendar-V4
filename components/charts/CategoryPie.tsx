
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from '../../hooks/useTranslation';

interface CategoryPieProps {
    data: { name: string; value: number }[];
}

const COLORS = ['#3b82f6', '#f97316', '#8b5cf6', '#10b981', '#ef4444', '#ec4899'];

const CategoryPie: React.FC<CategoryPieProps> = ({ data }) => {
    const { t } = useTranslation();

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-zinc-900 text-white text-xs p-2 rounded-lg shadow-xl border border-zinc-800">
                    <p className="font-bold mb-1">{payload[0].name}</p>
                    <p>{payload[0].value} {t('minutesShort') || 'min'}</p>
                </div>
            );
        }
        return null;
    };

    // Filter out 0 value entries to avoid rendering issues
    const activeData = data.filter(d => d.value > 0);

    return (
        <div className="h-64 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-2">{t('categories')}</h3>
            {activeData.length > 0 ? (
                <div className="flex-1 flex items-center">
                    <div className="w-1/2 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={activeData}
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {activeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 pl-4 space-y-2 overflow-y-auto max-h-40 no-scrollbar">
                        {activeData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <div className="truncate flex-1 font-medium text-zinc-700 dark:text-zinc-300">{entry.name}</div>
                                <div className="font-bold text-zinc-900 dark:text-white">{entry.value}m</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs italic">
                    No data available
                </div>
            )}
        </div>
    );
};

export default CategoryPie;
