
import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, CornerDownRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface FullCalendarViewProps {
    tasks: Task[];
    selectedDate: string;
    onSelectDate: (date: string) => void;
    onBack: () => void;
}

type CalendarViewType = 'day' | '3day' | 'week' | 'month';

const FullCalendarView: React.FC<FullCalendarViewProps> = ({ tasks, selectedDate, onSelectDate, onBack }) => {
    const { t, language } = useTranslation();

    // Helper to parse YYYY-MM-DD as local midnight for display
    const parseLocalYMD = (dateStr: string) => {
        if (!dateStr) return new Date();
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const [currentDate, setCurrentDate] = useState(parseLocalYMD(selectedDate));
    const [viewType, setViewType] = useState<CalendarViewType>('week');

    // --- Helpers ---

    const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isSameDate = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const getDaysInView = () => {
        const days: Date[] = [];
        const d = new Date(currentDate);

        if (viewType === 'day') {
            days.push(new Date(d));
        } else if (viewType === '3day') {
            // Start from current date
            for (let i = 0; i < 3; i++) {
                days.push(new Date(d));
                d.setDate(d.getDate() + 1);
            }
        } else if (viewType === 'week') {
            // Start from Monday (or Sunday depending on preference, using Mon here)
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
            d.setDate(diff);
            for (let i = 0; i < 7; i++) {
                days.push(new Date(d));
                d.setDate(d.getDate() + 1);
            }
        } else if (viewType === 'month') {
            // Get first day of month
            d.setDate(1);
            // Get start of week for that first day
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            d.setDate(diff);

            // 6 weeks covers all month possibilities
            for (let i = 0; i < 42; i++) {
                days.push(new Date(d));
                d.setDate(d.getDate() + 1);
            }
        }
        return days;
    };

    const handlePrev = () => {
        const d = new Date(currentDate);
        if (viewType === 'day') d.setDate(d.getDate() - 1);
        else if (viewType === '3day') d.setDate(d.getDate() - 3);
        else if (viewType === 'week') d.setDate(d.getDate() - 7);
        else if (viewType === 'month') d.setMonth(d.getMonth() - 1);
        setCurrentDate(d);
    };

    const handleNext = () => {
        const d = new Date(currentDate);
        if (viewType === 'day') d.setDate(d.getDate() + 1);
        else if (viewType === '3day') d.setDate(d.getDate() + 3);
        else if (viewType === 'week') d.setDate(d.getDate() + 7);
        else if (viewType === 'month') d.setMonth(d.getMonth() + 1);
        setCurrentDate(d);
    };

    const handleJumpToToday = () => {
        const now = new Date();
        // Normalize to midnight local time
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        setCurrentDate(today);
        onSelectDate(getLocalDateString(today));
    };

    // --- Dynamic Week Headers for Month View ---
    const weekDayHeaders = useMemo(() => {
        const days = [];
        const d = new Date(2024, 0, 1); // Jan 1 2024 is a Monday
        for (let i = 0; i < 7; i++) {
            days.push(d.toLocaleDateString(language, { weekday: 'narrow' })); // M, T, W...
            d.setDate(d.getDate() + 1);
        }
        return days;
    }, [language]);


    // --- Renderers ---

    const renderTaskCard = (task: Task, minimal: boolean = false) => {
        const isRolledOver = task.wasRolledOver;
        const isOverdue = !isRolledOver && task.dueDate && task.dueDate < getLocalDateString(new Date()) && !task.isCompleted;
        const progress = task.isCompleted ? 100 : (task.progress || 0);

        if (minimal) {
            return (
                <div
                    key={task.id}
                    className={`relative text-[9px] px-1 py-0.5 rounded truncate mb-0.5 border-l-2 overflow-hidden ${task.isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-500'
                        : isRolledOver
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-500'
                            : isOverdue
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-500'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-primary-500'
                        }`}
                >
                    {/* Progress Background for Minimal View */}
                    {!task.isCompleted && progress > 0 && (
                        <div
                            className="absolute top-0 bottom-0 left-0 bg-primary-500/10 dark:bg-primary-400/20 pointer-events-none"
                            style={{ width: `${progress}%` }}
                        />
                    )}
                    <span className="relative z-10">{task.title}</span>
                </div>
            );
        }

        return (
            <div
                key={task.id}
                className={`relative p-2 rounded-lg border mb-2 shadow-sm flex flex-col gap-1 transition-all hover:scale-[1.02] cursor-pointer group overflow-hidden ${task.isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 opacity-70'
                    : isRolledOver
                        ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/50 opacity-70'
                        : isOverdue
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50'
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                    }`}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectDate(task.date);
                }}
            >
                {/* Progress Background */}
                {!task.isCompleted && progress > 0 && (
                    <div
                        className="absolute top-0 bottom-0 left-0 bg-primary-500/10 dark:bg-primary-400/20 pointer-events-none transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                )}

                <div className={`relative z-10 font-semibold text-xs leading-tight line-clamp-2 ${task.isCompleted ? 'line-through text-zinc-400' : isRolledOver ? 'line-through text-zinc-500 decoration-purple-500/50' : 'text-zinc-800 dark:text-zinc-200'}`}>
                    {task.title}
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-1.5 mt-0.5">
                    {task.isCompleted && <CheckCircle2 size={10} className="text-emerald-500" />}
                    {isRolledOver && <CornerDownRight size={10} className="text-purple-500" />}
                    {isOverdue && <AlertCircle size={10} className="text-red-500" />}
                    {(task.estimatedTime || 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                            <Clock size={8} /> {task.estimatedTime}m
                        </span>
                    )}
                    {!task.isCompleted && progress > 0 && (
                        <span className="text-[9px] font-bold text-primary-600 dark:text-primary-400">{progress}%</span>
                    )}
                </div>
            </div>
        );
    };

    const daysToRender = getDaysInView();
    const todayDateStr = getLocalDateString(new Date());

    // Group tasks by date
    const tasksByDate = useMemo(() => {
        const map: Record<string, Task[]> = {};
        tasks.forEach(t => {
            if (!map[t.date]) map[t.date] = [];
            map[t.date].push(t);
        });
        return map;
    }, [tasks]);

    return (
        <div className="h-full flex flex-col bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white pb-20">
            {/* Header */}
            <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shrink-0 sticky top-0 z-20">
                <div className="max-w-2xl mx-auto w-full px-4 py-3 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <CalendarIcon className="text-primary-600 dark:text-primary-400" />
                            {t('schedule')}
                        </h1>
                        <button
                            onClick={handleJumpToToday}
                            className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-full transition-colors"
                        >
                            {t('today')}
                        </button>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                            <button onClick={handlePrev} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="font-medium text-lg w-40 text-center truncate capitalize">
                                {(() => {
                                    const opts: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
                                    if (viewType === 'month') return currentDate.toLocaleString(language, opts);
                                    if (viewType === 'day') return currentDate.toLocaleDateString(language, { month: 'short', day: 'numeric', year: 'numeric' });

                                    // For Week/3Day, show range
                                    const days = getDaysInView();
                                    const first = days[0];
                                    const last = days[days.length - 1];

                                    if (first.getMonth() === last.getMonth()) {
                                        return `${first.toLocaleString(language, { month: 'short' })} ${first.getDate()} - ${last.getDate()}`;
                                    } else {
                                        return `${first.toLocaleString(language, { month: 'short' })} ${first.getDate()} - ${last.toLocaleString(language, { month: 'short' })} ${last.getDate()}`;
                                    }
                                })()}
                            </span>
                            <button onClick={handleNext} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg">
                            {(['day', '3day', 'week', 'month'] as CalendarViewType[]).map(vt => (
                                <button
                                    key={vt}
                                    onClick={() => setViewType(vt)}
                                    className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-all ${viewType === vt
                                        ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                        }`}
                                >
                                    {vt === 'day' ? t('viewDay') : vt === '3day' ? t('view3Day') : vt === 'week' ? t('viewWeek') : t('viewMonth')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative w-full">
                <div className="max-w-2xl mx-auto h-full min-h-[500px]">
                    {viewType === 'month' ? (
                        // MONTH GRID
                        <div className="grid grid-cols-7 auto-rows-fr h-full">
                            {weekDayHeaders.map((d, i) => (
                                <div key={i} className="p-2 text-center text-xs font-bold text-zinc-400 bg-zinc-50 dark:bg-black border-b border-r border-zinc-200 dark:border-zinc-800 last:border-r-0">
                                    {d}
                                </div>
                            ))}
                            {daysToRender.map((d, i) => {
                                const dateStr = getLocalDateString(d);
                                const dayTasks = tasksByDate[dateStr] || [];
                                const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                                const isToday = dateStr === todayDateStr;
                                const isSelected = dateStr === selectedDate;

                                return (
                                    <div
                                        key={i}
                                        onClick={() => onSelectDate(dateStr)}
                                        className={`
                                    min-h-[80px] border-b border-r border-zinc-200 dark:border-zinc-800 p-1 flex flex-col last:border-r-0 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors relative
                                    ${!isCurrentMonth ? 'bg-zinc-50/50 dark:bg-zinc-900/20' : ''}
                                    ${isSelected ? 'bg-primary-50/50 dark:bg-primary-900/20 ring-inset ring-2 ring-primary-500' : ''}
                                `}
                                    >
                                        <span className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary-600 text-white' : isCurrentMonth ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                            {d.getDate()}
                                        </span>
                                        <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                                            {dayTasks.slice(0, 3).map(t => renderTaskCard(t, true))}
                                            {dayTasks.length > 3 && (
                                                <span className="text-[9px] text-zinc-400 pl-1">{t('moreTasks', { count: dayTasks.length - 3 })}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // COLUMN VIEWS (Day, 3Day, Week)
                        <div className={`grid h-full divide-x divide-zinc-200 dark:divide-zinc-800 ${viewType === 'day' ? 'grid-cols-1' : viewType === '3day' ? 'grid-cols-3' : 'grid-cols-7'
                            }`}>
                            {daysToRender.map((d, i) => {
                                const dateStr = getLocalDateString(d);
                                const dayTasks = tasksByDate[dateStr] || [];
                                const isToday = dateStr === todayDateStr;
                                const isSelected = dateStr === selectedDate;

                                return (
                                    <div
                                        key={i}
                                        onClick={() => onSelectDate(dateStr)}
                                        className={`
                                    flex flex-col h-full bg-zinc-50/30 dark:bg-black min-w-0 transition-colors cursor-pointer border-t-4
                                    ${isToday ? 'bg-primary-50/30 dark:bg-primary-900/5' : ''}
                                    ${isSelected ? 'border-t-primary-500 bg-primary-50/20 dark:bg-primary-900/10' : 'border-t-transparent'}
                                `}
                                    >
                                        {/* Column Header */}
                                        <div className="sticky top-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 p-2 text-center z-10 truncate">
                                            <div className="text-[10px] font-bold uppercase text-zinc-500">{d.toLocaleDateString(language, { weekday: 'short' })}</div>
                                            <div className={`text-lg font-black inline-block w-8 h-8 leading-8 rounded-full ${isToday ? 'bg-primary-600 text-white' : isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                                {d.getDate()}
                                            </div>
                                        </div>

                                        {/* Column Tasks */}
                                        <div className="p-1.5 flex-1 overflow-y-auto pb-24">
                                            {dayTasks.length === 0 ? (
                                                <div className="h-24 flex items-center justify-center text-zinc-300 dark:text-zinc-700 text-xs italic">
                                                    -
                                                </div>
                                            ) : (
                                                dayTasks.map(t => renderTaskCard(t))
                                            )}
                                            <button
                                                className="w-full py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-400 text-xs hover:border-primary-500 hover:text-primary-500 transition-colors mt-2"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FullCalendarView;