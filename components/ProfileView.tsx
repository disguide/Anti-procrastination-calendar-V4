
import React, { useMemo, useState } from 'react';
import { Task, Theme, WorkLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList, Tooltip } from 'recharts';
import { ArrowLeft, Trophy, Flame, Clock, Target, Activity, CalendarDays, EyeOff, List, ChevronLeft, ChevronRight, Tag, PiggyBank } from 'lucide-react';

interface ProfileViewProps {
  tasks: Task[];
  workLogs: WorkLog[];
  onBack?: () => void;
  theme: Theme;
  darkMode: boolean;
}

// Consistent tag coloring helper (duplicated to avoid export issues)
const getTagColor = (tag: string) => {
  const colors = [
    'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
    'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const ProfileView: React.FC<ProfileViewProps> = ({ tasks, workLogs, onBack, theme, darkMode }) => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [historyDate, setHistoryDate] = useState(new Date());

  // --- Analytics Calculation (Lifetime Stats) ---
  const analytics = useMemo(() => {
    // Lifetime totals: Use workLogs for time accuracy, tasks for counts
    const completedTasks = tasks.filter(t => t.isCompleted);
    // Calculated from logs to persist time even if task deleted
    const totalTimeMs = workLogs.reduce((acc, log) => acc + log.duration, 0); 
    
    // Distraction calc remains task-based as logs don't store it yet
    const totalDistractionMs = tasks.reduce((acc, t) => acc + (t.distractionTime || 0), 0);
    const totalSessionDuration = totalTimeMs + totalDistractionMs;
    const totalEarnedMinutes = workLogs.reduce((acc, log) => acc + (log.earnedMinutes || 0), 0);
    
    // Streak Calculation using WorkLogs for accuracy
    const datesWithActivity = Array.from(new Set(
        workLogs.map(l => l.date)
    )).sort();
    
    let currentStreak = 0;
    if (datesWithActivity.length > 0) {
        // Use consistent Local date check for streak
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        const dYesterday = new Date();
        dYesterday.setDate(dYesterday.getDate() - 1);
        const yesterday = `${dYesterday.getFullYear()}-${String(dYesterday.getMonth() + 1).padStart(2, '0')}-${String(dYesterday.getDate()).padStart(2, '0')}`;

        const lastActive = datesWithActivity[datesWithActivity.length - 1];

        // Check if streak is active (today or yesterday)
        if (lastActive === today || lastActive === yesterday) {
            currentStreak = 1;
            for (let i = datesWithActivity.length - 2; i >= 0; i--) {
                const cur = new Date(datesWithActivity[i + 1] as string);
                const prev = new Date(datesWithActivity[i] as string);
                const diffTime = Math.abs(cur.getTime() - prev.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }
    }

    return {
        totalTasks: tasks.length,
        completedCount: completedTasks.length,
        completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
        totalHours: Math.max(0, totalTimeMs / 1000 / 60 / 60), 
        distractionRate: totalSessionDuration > 0 ? Math.round((totalDistractionMs / totalSessionDuration) * 100) : 0,
        streak: currentStreak,
        totalEarned: totalEarnedMinutes
    };
  }, [tasks, workLogs]);

  // Helper to get consistent Local YYYY-MM-DD string
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Helper for duration display
  const formatDuration = (minutes: number) => {
    const mins = Math.max(0, Math.round(minutes));
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handlePrevDay = () => {
    const d = new Date(historyDate);
    d.setDate(d.getDate() - 1);
    setHistoryDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(historyDate);
    d.setDate(d.getDate() + 1);
    setHistoryDate(d);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // --- Chart Data Calculation (Dynamic from WorkLogs) ---
  const chartData = useMemo(() => {
    const today = new Date(); // Local time
    const data = [];

    if (timeRange === 'day') {
        // Day View: Breakdown of SELECTED DATE'S work by Task Title (aggregated from logs)
        const dateStr = getLocalDateString(historyDate);
        
        // Filter logs for selected history date
        const todaysLogs = workLogs.filter(l => l.date === dateStr);
        
        // Group by Task ID
        const taskDurations: Record<string, number> = {};
        todaysLogs.forEach(log => {
             // Handle undo scenarios (negative duration) correctly by summation
             taskDurations[log.taskId] = (taskDurations[log.taskId] || 0) + log.duration;
        });

        // Map back to Task Titles
        const chartItems = Object.entries(taskDurations)
            .map(([taskId, duration]) => {
                const task = tasks.find(t => t.id === taskId);
                const title = task ? task.title : 'Deleted Task';
                return {
                    label: title.length > 10 ? title.substring(0, 8) + '..' : title,
                    fullLabel: title,
                    value: parseFloat((Math.max(0, duration) / 1000 / 60).toFixed(2)), // Ensure non-negative
                    type: 'task',
                    tags: task ? task.tags : [],
                };
            })
            .filter(item => item.value > 0.01) // Filter extremely small or zero values
            .sort((a, b) => b.value - a.value);

        return chartItems;
    } 
    
    if (timeRange === 'week') {
        // Week View: Last 7 Days
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); // Local
            d.setDate(today.getDate() - i); // Shift local day
            const dateStr = getLocalDateString(d); // Convert to YYYY-MM-DD
            
            const totalMs = workLogs
                .filter(l => l.date === dateStr)
                .reduce((acc, l) => acc + l.duration, 0);

            data.push({
                label: d.toLocaleDateString('en-US', { weekday: 'short' }), // Mon
                fullLabel: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
                value: parseFloat((Math.max(0, totalMs) / 1000 / 60).toFixed(1)),
                type: 'date'
            });
        }
        return data;
    }

    if (timeRange === 'month') {
        // Month View: Last 30 Days
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = getLocalDateString(d);
            
            const totalMs = workLogs
                .filter(l => l.date === dateStr)
                .reduce((acc, l) => acc + l.duration, 0);

            data.push({
                label: d.getDate().toString(), // 15
                fullLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: parseFloat((Math.max(0, totalMs) / 1000 / 60).toFixed(1)),
                type: 'date'
            });
        }
        return data;
    }

    return [];
  }, [timeRange, tasks, workLogs, historyDate]);

  const chartTextColor = darkMode ? '#71717a' : '#71717a'; 
  const chartTooltipBg = darkMode ? '#18181b' : '#ffffff'; 
  const chartTooltipBorder = darkMode ? '#27272a' : '#e4e4e7';
  const chartTooltipText = darkMode ? '#fff' : '#09090b';
  // Fix: Use correct CSS variable for Recharts fill
  const getBarColor = () => `rgb(var(--p-500))`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 flex flex-col max-w-2xl mx-auto pb-32 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {onBack && (
            <button 
                onClick={onBack} 
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-900 rounded-full transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
            <ArrowLeft />
            </button>
        )}
        <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-purple-600 dark:from-primary-400 dark:to-purple-500">
                Profile & Insights
            </h1>
            <p className="text-zinc-500 text-sm">Productivity Metrics</p>
        </div>
      </div>

      {/* Hero Stats Grid - Matched to list width constraints */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl relative overflow-hidden group shadow-sm col-span-2 sm:col-span-1">
            <div className="absolute right-2 top-2 text-zinc-200 dark:text-zinc-800 group-hover:text-primary-200 dark:group-hover:text-primary-900/40 transition-colors">
                <Clock size={48} />
            </div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Total Focus</div>
            <div className="text-3xl font-black text-primary-600 dark:text-primary-400">
                {analytics.totalHours < 1 ? Math.round(analytics.totalHours * 60) : analytics.totalHours.toFixed(1)}
                <span className="text-base text-zinc-500 dark:text-zinc-600 font-normal ml-1">
                    {analytics.totalHours < 1 ? 'min' : 'hrs'}
                </span>
            </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl relative overflow-hidden group shadow-sm col-span-1 sm:col-span-1">
             <div className="absolute right-2 top-2 text-zinc-200 dark:text-zinc-800 group-hover:text-green-200 dark:group-hover:text-green-900/40 transition-colors">
                <Target size={48} />
            </div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Tasks Done</div>
            <div className="text-3xl font-black text-green-500 dark:text-green-400">{analytics.completedCount}</div>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl relative overflow-hidden group shadow-sm col-span-1 sm:col-span-1">
             <div className="absolute right-2 top-2 text-zinc-200 dark:text-zinc-800 group-hover:text-orange-200 dark:group-hover:text-orange-900/40 transition-colors">
                <Flame size={48} />
            </div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Day Streak</div>
            <div className="text-3xl font-black text-orange-500 dark:text-orange-400">{analytics.streak}</div>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl relative overflow-hidden group shadow-sm col-span-1">
             <div className="absolute right-2 top-2 text-zinc-200 dark:text-zinc-800 group-hover:text-purple-200 dark:group-hover:text-purple-900/40 transition-colors">
                <Activity size={48} />
            </div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Comp. Rate</div>
            <div className="text-2xl font-black text-purple-500 dark:text-purple-400">{analytics.completionRate}<span className="text-sm text-zinc-500 dark:text-zinc-600 font-normal ml-1">%</span></div>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl relative overflow-hidden group shadow-sm col-span-1">
             <div className="absolute right-2 top-2 text-zinc-200 dark:text-zinc-800 group-hover:text-red-200 dark:group-hover:text-red-900/40 transition-colors">
                <EyeOff size={48} />
            </div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Distraction</div>
            <div className="text-2xl font-black text-red-500 dark:text-red-400">{analytics.distractionRate}<span className="text-sm text-zinc-500 dark:text-zinc-600 font-normal ml-1">%</span></div>
        </div>
        
        {/* NEW TIME EARNED STAT */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl relative overflow-hidden group shadow-sm col-span-1">
             <div className="absolute right-2 top-2 text-zinc-200 dark:text-zinc-800 group-hover:text-pink-200 dark:group-hover:text-pink-900/40 transition-colors">
                <PiggyBank size={48} />
            </div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Time Earned</div>
            <div className="text-2xl font-black text-pink-500 dark:text-pink-400">
                {Math.round(analytics.totalEarned)}<span className="text-sm text-zinc-500 dark:text-zinc-600 font-normal ml-1">min</span>
            </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="flex flex-col gap-8 mb-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 h-[500px] shadow-sm flex flex-col">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                        {timeRange === 'day' ? <List size={18} className="text-zinc-500" /> : <CalendarDays size={18} className="text-zinc-500" />}
                        {timeRange === 'day' ? 'Daily Breakdown' : 'Focus History'}
                    </h3>
                    
                    {/* Date Navigation for Daily View */}
                    {timeRange === 'day' && (
                        <div className="flex items-center gap-1 ml-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700">
                             <button onClick={handlePrevDay} className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                                <ChevronLeft size={14} />
                             </button>
                             <span className="px-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 tabular-nums min-w-[90px] text-center">
                                {isToday(historyDate) ? 'Today' : historyDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', weekday: 'short'})}
                             </span>
                             <button onClick={handleNextDay} className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                                <ChevronRight size={14} />
                             </button>
                        </div>
                    )}
                </div>
                
                {/* Time Range Selector */}
                <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    {(['day', 'week', 'month'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => {
                                setTimeRange(range);
                                // Reset history date to today when switching back to day mode
                                if(range === 'day') setHistoryDate(new Date());
                            }}
                            className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                                timeRange === range 
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' 
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
             </div>
             
             <div className="flex-1 min-h-0 relative">
                {chartData.length > 0 ? (
                    timeRange === 'day' ? (
                        // Daily View: List of Tasks with Tags
                        <div className="h-full overflow-y-auto pr-2 space-y-2 pt-2 custom-scrollbar">
                            {chartData.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs shrink-0 self-start mt-0.5">
                                            {i + 1}
                                        </div>
                                        <div className="min-w-0 flex flex-col">
                                            <div className="truncate font-medium text-zinc-700 dark:text-zinc-200" title={item.fullLabel}>
                                                {item.fullLabel}
                                            </div>
                                            {/* Tags Row */}
                                            {item.tags && item.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {item.tags.map(tag => (
                                                        <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 border font-bold ${getTagColor(tag)}`}>
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="font-mono font-bold text-zinc-900 dark:text-white shrink-0 bg-white dark:bg-zinc-900 px-2 py-1 rounded border border-zinc-100 dark:border-zinc-800 self-start">
                                        {formatDuration(item.value)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Week/Month View: Chart with LabelList (No Tooltip)
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <XAxis 
                                    dataKey="label" 
                                    stroke="#71717a" 
                                    tick={{fill: chartTextColor, fontSize: 10}} 
                                    axisLine={false}
                                    tickLine={false}
                                    interval={timeRange === 'month' ? 4 : 0}
                                />
                                <YAxis hide /> 
                                <Tooltip 
                                  cursor={{fill: darkMode ? '#27272a' : '#f4f4f5'}}
                                  contentStyle={{backgroundColor: chartTooltipBg, borderColor: chartTooltipBorder, color: chartTooltipText}}
                                  itemStyle={{color: getBarColor()}}
                                  formatter={(value: number) => [`${value.toFixed(1)} min`, 'Duration']}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={true}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.value > 60 ? `rgb(var(--p-500))` : (darkMode ? '#3f3f46' : '#e4e4e7')} />
                                    ))}
                                    <LabelList 
                                        dataKey="value" 
                                        position="top" 
                                        formatter={(val: number) => val < 1 ? '' : `${Math.round(val)}m`}
                                        style={{ fill: chartTextColor, fontSize: '10px', fontWeight: 'bold' }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
                        <Activity size={32} className="mb-2 opacity-50" />
                        <span className="text-sm">No activity recorded for {isToday(historyDate) && timeRange === 'day' ? 'today' : 'this period'}</span>
                    </div>
                )}
             </div>
        </div>

        {/* Secondary Stats */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
             <h3 className="font-bold text-zinc-800 dark:text-zinc-200 mb-6 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-500" /> 
                Achievements
             </h3>
             
             <div className="space-y-4">
                 <div className={`flex items-center gap-3 p-3 rounded-xl border ${analytics.completedCount >= 10 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 opacity-50'}`}>
                    <div className={`p-2 rounded-full ${analytics.completedCount >= 10 ? 'bg-blue-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'}`}>
                        <Target size={16} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Task Rookie</div>
                        <div className="text-xs text-zinc-500">Complete 10 tasks</div>
                    </div>
                 </div>

                 <div className={`flex items-center gap-3 p-3 rounded-xl border ${analytics.totalHours >= 10.0 ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 opacity-50'}`}>
                    <div className={`p-2 rounded-full ${analytics.completedCount >= 10 ? 'bg-purple-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'}`}>
                        <Clock size={16} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Double Digits</div>
                        <div className="text-xs text-zinc-500">Record 10+ hours of focus</div>
                    </div>
                 </div>

                 <div className={`flex items-center gap-3 p-3 rounded-xl border ${analytics.streak >= 3 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 opacity-50'}`}>
                    <div className={`p-2 rounded-full ${analytics.streak >= 3 ? 'bg-orange-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'}`}>
                        <Flame size={16} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">On Fire</div>
                        <div className="text-xs text-zinc-500">3-day streak</div>
                    </div>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
