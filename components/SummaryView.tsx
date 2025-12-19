
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Theme } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarCheck, RotateCcw, ArrowRight, CheckCircle2, Circle, ListTodo, CornerDownRight, PiggyBank } from 'lucide-react';
import { ProductivityEngine } from '../utils';

interface SummaryViewProps {
  tasks: Task[];
  onBack: () => void;
  onRollOver: (updates: { id: string, progress: number }[]) => void;
  onBatchUpdate?: (updates: { id: string, changes: Partial<Task> }[]) => void;
  theme: Theme;
  darkMode: boolean;
}

// Local state interface to track edits before confirming
interface TaskSummaryState {
  progress: number;
  isCompleted: boolean;
  isRolledOver: boolean;
}

const SummaryView: React.FC<SummaryViewProps> = ({ tasks, onBack, onRollOver, onBatchUpdate, theme, darkMode }) => {

  // Initialize local state for all tasks
  const [taskStates, setTaskStates] = useState<Record<string, TaskSummaryState>>({});

  useEffect(() => {
    const initialStates: Record<string, TaskSummaryState> = {};
    tasks.forEach(t => {
      initialStates[t.id] = {
        progress: t.isCompleted ? 100 : (t.progress || 0),
        isCompleted: t.isCompleted,
        // Default incomplete tasks to rollover, completed tasks to stay
        isRolledOver: !t.isCompleted || !!t.wasRolledOver
      };
    });
    setTaskStates(initialStates);
  }, [tasks]);

  const getTaskState = (id: string): TaskSummaryState => {
    return taskStates[id] || { progress: 0, isCompleted: false, isRolledOver: false };
  };

  const updateTaskState = (id: string, updates: Partial<TaskSummaryState>) => {
    setTaskStates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  };

  // --- Derived Data for UI (Reactivity Fix) ---
  const derivedTasks = useMemo(() => {
    return tasks.map(t => {
      const state = taskStates[t.id];
      // If state isn't ready yet, fall back to prop
      if (!state) return t;

      return {
        ...t,
        isCompleted: state.isCompleted,
        progress: state.progress,
        // We don't override totalTime here as that's historical, 
        // but we do care about completion status for the counts.
      };
    });
  }, [tasks, taskStates]);

  const completedTasksCount = derivedTasks.filter(t => t.isCompleted).length;
  const totalTime = tasks.reduce((acc, curr) => acc + curr.totalTime, 0);

  // Note: earningRatio isn't passed here directly, but we can't easily fetch it from summary props without adding to interface.
  // Assuming a default or that it's ideally passed. For now, let's just use the time.
  // Actually, ProductivityEngine could be used if we had the ratio. Let's stick to time and completed for now.

  // --- Handlers ---

  const handleSliderChange = (id: string, newProgress: number) => {
    const currentState = getTaskState(id);
    const isNowCompleted = newProgress === 100;

    updateTaskState(id, {
      progress: newProgress,
      isCompleted: isNowCompleted
      // Don't auto-set isRolledOver. User manually controls that.
    });
  };

  const toggleCompletion = (id: string) => {
    const current = getTaskState(id);
    const newCompleted = !current.isCompleted;

    updateTaskState(id, {
      isCompleted: newCompleted,
      progress: newCompleted ? 100 : (current.progress === 100 ? 0 : current.progress),
      isRolledOver: !newCompleted
    });
  };

  const toggleRollover = (id: string) => {
    const current = getTaskState(id);
    const newState = !current.isRolledOver;
    updateTaskState(id, {
      isRolledOver: newState,
      progress: newState ? 0 : current.progress,
      isCompleted: newState ? false : current.isCompleted
    });
  };

  const handleExit = () => {
    const rolloverUpdates: { id: string, progress: number }[] = [];
    const localUpdates: { id: string, changes: Partial<Task> }[] = [];

    tasks.forEach(task => {
      const state = taskStates[task.id];
      if (!state) return;

      if (state.isRolledOver) {
        rolloverUpdates.push({
          id: task.id,
          progress: state.progress
        });
      } else {
        const hasChanged =
          state.isCompleted !== task.isCompleted ||
          state.progress !== (task.progress || 0);

        if (hasChanged) {
          localUpdates.push({
            id: task.id,
            changes: {
              isCompleted: state.isCompleted,
              progress: state.progress
            }
          });
        }
      }
    });

    if (onBatchUpdate && localUpdates.length > 0) {
      onBatchUpdate(localUpdates);
    }

    if (rolloverUpdates.length > 0) {
      onRollOver(rolloverUpdates);
    }

    onBack();
  };

  const formatTimeLong = (ms: number) => {
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const getCompletionMessage = (ms: number) => {
    const mins = ms / 1000 / 60;
    if (mins === 0) return "Ready to Start?";
    if (mins < 15) return "Short & Sweet!";
    if (mins < 45) return "Efficient Focus!";
    if (mins < 90) return "Solid Work Session!";
    if (mins < 180) return "Deep Work Achieved!";
    return "Legendary Stamina!";
  };

  // Chart data derived from ALL tasks with time logged, regardless of completion status
  const chartData = derivedTasks
    .filter(t => t.totalTime > 0)
    .map(t => ({
      name: t.title.length > 15 ? t.title.substring(0, 15) + '...' : t.title,
      time: t.totalTime / 1000 / 60,
    }));

  const chartTextColor = darkMode ? '#71717a' : '#71717a';
  const chartTooltipBg = darkMode ? '#18181b' : '#ffffff';
  const chartTooltipBorder = darkMode ? '#27272a' : '#e4e4e7';
  const chartTooltipText = darkMode ? '#fff' : '#09090b';
  const getBarColor = () => `rgb(var(--p-500))`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 md:p-8 flex flex-col max-w-2xl mx-auto transition-colors pb-12">
      <div className="flex flex-col items-center justify-center mb-10 mt-4">
        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-purple-600 dark:from-primary-400 dark:to-purple-500">
          Sprint Summary
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">Review & Plan Tomorrow</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center col-span-2 md:col-span-1">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Total Focus Time</div>
          <div className="text-3xl font-black text-primary-600 dark:text-primary-400">{formatTimeLong(totalTime)}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Tasks Crushed</div>
          <div className="text-4xl font-black text-green-500 dark:text-green-400">{completedTasksCount}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><PiggyBank size={12} /> Session Reward</div>
          <div className="text-4xl font-black text-pink-500 dark:text-pink-400">+{(totalTime / 60000 / 5).toFixed(1)}<span className="text-sm font-normal">m</span></div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-8 h-80 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-zinc-700 dark:text-zinc-300">Time Distribution (Minutes)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                stroke="#a1a1aa"
                tick={{ fill: chartTextColor, fontSize: 12 }}
                interval={0}
              />
              <YAxis stroke="#a1a1aa" tick={{ fill: chartTextColor }} />
              <Tooltip
                cursor={{ fill: darkMode ? '#27272a' : '#f4f4f5' }}
                contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartTooltipBorder, color: chartTooltipText }}
                itemStyle={{ color: getBarColor() }}
                formatter={(value: number) => [`${value.toFixed(1)} min`, 'Duration']}
              />
              <Bar dataKey="time" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor()} fillOpacity={index % 2 === 0 ? 1 : 0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Unified List Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-12 shadow-sm">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo size={18} className="text-zinc-500" />
            <div className="font-semibold text-zinc-700 dark:text-zinc-300">Session Review</div>
          </div>
          <span className="bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs px-2 py-0.5 rounded-full font-bold">{tasks.length} Total</span>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {tasks.length === 0 && (
            <div className="p-8 text-center text-zinc-400 italic text-sm">No tasks in this session.</div>
          )}

          {tasks.map(task => {
            const state = getTaskState(task.id);

            return (
              <div
                key={task.id}
                className={`relative p-4 flex items-center gap-4 transition-all overflow-hidden group ${state.isCompleted
                  ? 'bg-emerald-50/40 dark:bg-emerald-900/10'
                  : state.isRolledOver
                    ? 'bg-purple-50/40 dark:bg-purple-900/10'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                  }`}
              >
                {/* Progress Background */}
                <div
                  className={`absolute top-0 left-0 bottom-0 transition-all duration-300 pointer-events-none opacity-10 dark:opacity-10 z-0
                        ${state.isCompleted ? 'bg-emerald-500' : 'bg-purple-500'}
                    `}
                  style={{ width: `${state.progress}%` }}
                />

                {/* LEFT: Rollover Toggle */}
                <button
                  onClick={() => toggleRollover(task.id)}
                  className={`relative z-20 w-8 h-8 rounded-lg border flex items-center justify-center transition-colors shrink-0 
                    ${state.isRolledOver
                      ? 'bg-purple-100 border-purple-300 text-purple-600 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-400'
                      : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-300 hover:border-purple-400 hover:text-purple-400'
                    }`}
                  title="Toggle Rollover (Move to Tomorrow)"
                >
                  {state.isRolledOver ? <CornerDownRight size={16} /> : <CornerDownRight size={16} />}
                </button>

                {/* CENTER: Slider & Info */}
                <div className="flex-1 min-w-0 relative h-full flex flex-col justify-center">
                  {/* Invisible Slider Overlay */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={state.progress}
                    onChange={(e) => handleSliderChange(task.id, parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-col-resize"
                    title="Drag to adjust progress"
                  />

                  <div className="relative z-0 pointer-events-none">
                    <div className={`font-medium truncate flex items-center gap-2 ${state.isCompleted
                      ? 'text-zinc-500 line-through decoration-emerald-500/30'
                      : state.isRolledOver
                        ? 'text-purple-700 dark:text-purple-300 italic'
                        : 'text-zinc-800 dark:text-zinc-200'
                      }`}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="text-xs font-mono font-bold text-zinc-400 dark:text-zinc-500">
                        {state.progress}%
                      </div>
                      {state.isRolledOver && (
                        <span className="text-purple-500 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider">
                          <ArrowRight size={10} /> To Tomorrow
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Completion Toggle */}
                <button
                  onClick={() => toggleCompletion(task.id)}
                  className={`relative z-20 w-8 h-8 rounded-full border flex items-center justify-center transition-colors shrink-0 
                    ${state.isCompleted
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400'
                      : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-200 hover:border-emerald-400 hover:text-emerald-400'
                    }`}
                  title="Mark Completed"
                >
                  <CheckCircle2 size={16} />
                </button>

              </div>
            );
          })}
        </div>
      </div>

      {/* Elegant Exit Button */}
      <button
        onClick={handleExit}
        className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-primary-600 dark:hover:bg-primary-500 text-white dark:text-zinc-900 dark:hover:text-white rounded-2xl font-bold text-lg shadow-xl shadow-zinc-500/20 dark:shadow-black/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 group mt-auto"
      >
        <div className="p-1 rounded-full bg-white/20 dark:bg-black/10 group-hover:bg-white/20 dark:group-hover:bg-white/20 transition-colors">
          <CheckCircle2 size={20} className="text-current" />
        </div>
        <span className="mr-1">{getCompletionMessage(totalTime)}</span>
        <span className="opacity-60 text-sm font-normal border-l border-white/20 dark:border-black/20 pl-3 group-hover:border-white/20">Confirm & End</span>
      </button>
    </div>
  );
};

export default SummaryView;
