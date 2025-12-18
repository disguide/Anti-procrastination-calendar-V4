
import React, { useMemo } from 'react';
import { Task, Theme, WorkLog } from '../types';
import { ArrowLeft, Trophy, Flame, Target, Activity, List, LayoutGrid, Clock, PiggyBank, Calendar } from 'lucide-react';
import { useAnalytics, TimeRange } from '../hooks/useAnalytics';
import { useTranslation } from '../hooks/useTranslation';
import StatCard from './insights/StatCard';
import ActivityChart from './charts/ActivityChart';
import CategoryPie from './charts/CategoryPie';

interface ProfileViewProps {
    tasks: Task[];
    workLogs: WorkLog[];
    archive?: any[];
    onBack?: () => void;
    theme: Theme;
    darkMode: boolean;
}

const ProfileView: React.FC<ProfileViewProps> = (props) => {
    const { tasks, workLogs, archive, onBack } = props;
    const { t } = useTranslation();

    // Use the analytics hook for range-based data
    const { range, setRange, totalFocusTime, tasksCompleted, activityData, categoryData, streak: currentStreakStats } = useAnalytics(tasks, workLogs);

    // Calculate All-Time Stats separately (including Archive)
    const allTimeStats = useMemo(() => {
        let totalTimeMs = workLogs.reduce((acc, log) => acc + log.duration, 0);
        let archiveCount = 0;
        let archiveTime = 0;
        let archiveEarned = 0;

        if (archive && Array.isArray(archive)) {
            archive.forEach((record: any) => {
                const time = record.totalFocusMs || record.totalTime || 0;
                const count = record.totalTasksCompleted || record.completedCount || 0;
                const earned = record.totalEarnedMinutes || 0;
                archiveTime += time;
                archiveCount += count;
                archiveEarned += earned;
            });
        }

        totalTimeMs += archiveTime;
        const totalEarned = workLogs.reduce((acc, log) => acc + (log.earnedMinutes || 0), 0) + archiveEarned;
        const totalCompleted = tasks.filter(t => t.isCompleted).length + archiveCount;

        return {
            totalHours: Math.max(0, totalTimeMs / 1000 / 60 / 60),
            totalCompleted,
            totalEarned
        };
    }, [workLogs, tasks, archive]);

    // Determine what to display based on Range
    // If range is ALL, use the aggregated All-Time stats for the hero cards.
    // If range is Week/Month/etc, use the hook's filtered stats.

    const displayStats = {
        hours: range === 'all' ? allTimeStats.totalHours : (totalFocusTime / 1000 / 60 / 60),
        tasks: range === 'all' ? allTimeStats.totalCompleted : tasksCompleted,
        earned: range === 'all' ? allTimeStats.totalEarned : (workLogs.reduce((acc, l) => {
            // Need to filter logs for earned if not 'all'. 
            // The hook calculates 'totalFocusTime' but not 'totalEarned'.
            // Let's approximate or just show All-Time earned for now? 
            // Users usually want to see their "Bank Balance" which is current state, 
            // OR "Earned in period".
            // Let's calculate earned in period quickly.
            // Re-using the logic from hook would be cleaner but adding it here is okay.
            const logDate = new Date(l.date);
            const now = new Date();
            let start = new Date(0);
            if (range === 'week') start = new Date(now.setDate(now.getDate() - 7));
            if (range === 'month') start = new Date(now.setMonth(now.getMonth() - 1));
            if (range === 'year') start = new Date(now.setFullYear(now.getFullYear() - 1));

            if (logDate >= start) return acc + (l.earnedMinutes || 0);
            return acc;
        }, 0))
    };

    // If range is NOT all, simple calc for correct 'earned' display above might be slightly off due to date boundary logic duplication
    // but good enough for prototype.

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white pb-32 transition-colors">

            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
                <div className="max-w-4xl mx-auto flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {onBack && (
                                <button onClick={onBack} className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                    <ArrowLeft size={20} className="text-zinc-500 dark:text-zinc-400" />
                                </button>
                            )}
                            <div>
                                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{t('insights')}</h1>
                                <p className="text-xs text-zinc-500">{t('productivityMetrics')}</p>
                            </div>
                        </div>

                        {/* Range Selector */}
                        <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800">
                            {(['week', 'month', 'all'] as const).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${range === r ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                                >
                                    {r === 'all' ? 'All' : r}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 space-y-6">

                {/* Hero Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label={t('totalFocusTime')}
                        value={displayStats.hours < 1 ? `${Math.round(displayStats.hours * 60)}m` : `${displayStats.hours.toFixed(1)}h`}
                        icon={Clock}
                        color="purple"
                    />
                    <StatCard
                        label={t('tasksCompleted')}
                        value={displayStats.tasks}
                        icon={Target}
                        color="green"
                    />
                    <StatCard
                        label={t('streak')}
                        value={currentStreakStats.current}
                        subValue={`${t('days')} (${t('streak')})`}
                        icon={Flame}
                        color="orange"
                    />
                    <StatCard
                        label={t('earned')}
                        value={Math.round(displayStats.earned)}
                        subValue="min"
                        icon={PiggyBank}
                        color="primary"
                    />
                </div>

                {/* Main Activity Chart */}
                <div className="w-full">
                    <ActivityChart data={activityData} />
                </div>

                {/* Split Row: Category & Recent */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CategoryPie data={categoryData} />

                    {/* Recent/Top Tasks List (Reuse logic or simplify) */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm h-64 flex flex-col">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 px-2">{t('activitySummary')}</h3>
                        {/* We use filtered tasks or recent logs? useAnalytics returns filtered tasks count but not list.
                            We can iterate categoryData or just show "Recent Completed" from props.tasks
                        */}
                        <div className="overflow-y-auto pr-2 space-y-2 flex-1">
                            {tasks.filter(t => t.isCompleted).sort((a, b) => (b.completionDate ? new Date(b.completionDate).getTime() : 0) - (a.completionDate ? new Date(a.completionDate).getTime() : 0)).slice(0, 5).map(task => (
                                <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <div className="flex flex-col truncate pr-2">
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{task.title}</span>
                                        <span className="text-[10px] text-zinc-400">{task.isCompleted ? 'Completed' : 'In Progress'}</span>
                                    </div>
                                    {task.tags && task.tags[0] && <span className="text-[10px] px-1.5 py-0.5 rounded border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500">#{task.tags[0]}</span>}
                                </div>
                            ))}
                            {tasks.filter(t => t.isCompleted).length === 0 && (
                                <div className="text-center text-zinc-400 text-xs italic py-10">
                                    {t('noActivity')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Achievements */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-zinc-800 dark:text-zinc-200 mb-6 flex items-center gap-2">
                        <Trophy size={18} className="text-yellow-500" />
                        {t('achievements')}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${allTimeStats.totalCompleted >= 10 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 opacity-50'}`}>
                            <div className={`p-2 rounded-full ${allTimeStats.totalCompleted >= 10 ? 'bg-blue-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'}`}>
                                <Target size={16} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{t('taskRookie')}</div>
                                <div className="text-xs text-zinc-500">{t('taskRookieDesc')}</div>
                            </div>
                        </div>

                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${allTimeStats.totalHours >= 10.0 ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 opacity-50'}`}>
                            <div className={`p-2 rounded-full ${allTimeStats.totalHours >= 10 ? 'bg-purple-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'}`}>
                                <Clock size={16} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{t('doubleDigits')}</div>
                                <div className="text-xs text-zinc-500">{t('doubleDigitsDesc')}</div>
                            </div>
                        </div>

                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${currentStreakStats.best >= 3 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 opacity-50'}`}>
                            <div className={`p-2 rounded-full ${currentStreakStats.best >= 3 ? 'bg-orange-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'}`}>
                                <Flame size={16} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{t('onFire')}</div>
                                <div className="text-xs text-zinc-500">{t('onFireDesc')}</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProfileView;
