
import React, { useState, useEffect, CSSProperties, useMemo, useRef } from 'react';
import { Task, ViewMode, SprintSettings, Theme, Session, WorkLog, PriorityLevel } from './types';
import Calendar from './components/Calendar';
import SprintMode from './components/SprintMode';
import SummaryView from './components/SummaryView';
import ProfileView from './components/ProfileView';
import FullCalendarView from './components/FullCalendarView';
import ParametersView from './components/ParametersView';
import BottomNav from './components/BottomNav';
import { useFocusSplitDB } from './hooks/useFocusSplitDB';
import { Plus, Trash2, Play, Clock, Settings2, RotateCcw, Layers, Edit2, Check, ChevronUp, FileText, Timer, ArrowRight, CornerDownRight, Calendar as CalendarIcon, AlertCircle, Star, Flame, Zap, ArrowDown, Target, X, ArrowUp, ShieldCheck, ShieldAlert, Tag, Minus, CheckCircle2, Layout, CalendarCheck, PiggyBank, Coffee, Flag, TrendingUp, Lock, Database, Bell } from 'lucide-react';

const DEFAULT_SESSION_NAME = "Main Focus";

// --- THEME CONFIGURATION ---
const THEME_PALETTES: Record<Theme, { isDark: boolean; colors: Record<string, string> }> = {
  yin: { 
    isDark: false,
    colors: {
      '--c-50': '255 255 255', '--c-100': '248 248 248', '--c-200': '240 240 240', '--c-300': '224 224 224',
      '--c-400': '113 113 122', '--c-500': '82 82 91', '--c-600': '51 51 51', '--c-700': '30 30 30',
      '--c-800': '15 15 15', '--c-900': '0 0 0', '--c-950': '0 0 0',
      '--p-50': '245 245 245', '--p-400': '113 113 113', '--p-500': '51 51 51', '--p-600': '30 30 30', '--p-900': '0 0 0',
    }
  },
  yang: { 
    isDark: true,
    colors: {
      '--c-50': '250 250 250', '--c-100': '228 228 231', '--c-200': '161 161 170', '--c-300': '113 113 122',
      '--c-400': '161 161 170', '--c-500': '212 212 216', '--c-600': '228 228 231', '--c-700': '244 244 245',
      '--c-800': '39 39 42', '--c-900': '24 24 27', '--c-950': '9 9 11',
      '--p-50': '39 39 42', '--p-400': '212 212 216', '--p-500': '255 255 255', '--p-600': '228 228 231', '--p-900': '255 255 255',
    }
  },
  zen: { 
    isDark: false,
    colors: {
      '--c-50': '241 248 233', '--c-100': '220 237 200', '--c-200': '197 225 165', '--c-300': '174 213 129',
      '--c-400': '139 195 74', '--c-500': '104 159 56', '--c-600': '85 139 47', '--c-700': '51 105 30',
      '--c-800': '46 59 40', '--c-900': '30 45 20', '--c-950': '15 25 5',
      '--p-50': '241 248 233', '--p-400': '156 204 101', '--p-500': '124 179 66', '--p-600': '85 139 47', '--p-900': '51 105 30',
    }
  },
  forest: { 
    isDark: true,
    colors: {
      '--c-50': '232 245 233', '--c-100': '200 230 201', '--c-200': '165 214 167', '--c-300': '129 199 132',
      '--c-400': '102 187 106', '--c-500': '129 199 132', '--c-600': '165 214 167', '--c-700': '200 230 201',
      '--c-800': '30 60 35', '--c-900': '20 45 25', '--c-950': '12 35 15',
      '--p-50': '30 60 35', '--p-400': '102 187 106', '--p-500': '76 175 80', '--p-600': '56 142 60', '--p-900': '27 94 32',
    }
  },
  seafoam: { 
    isDark: false,
    colors: {
      '--c-50': '224 247 250', '--c-100': '178 235 242', '--c-200': '128 222 234', '--c-300': '77 208 225',
      '--c-400': '38 198 218', '--c-500': '0 188 212', '--c-600': '0 151 167', '--c-700': '0 131 143',
      '--c-800': '0 96 100', '--c-900': '0 60 64', '--c-950': '0 30 32',
      '--p-50': '224 247 250', '--p-400': '38 198 218', '--p-500': '0 172 193', '--p-600': '0 151 167', '--p-900': '0 96 100',
    }
  },
  midnight: { 
    isDark: true,
    colors: {
      '--c-50': '219 234 254', '--c-100': '191 219 254', '--c-200': '147 197 253', '--c-300': '96 165 250',
      '--c-400': '147 197 253', '--c-500': '191 219 254', '--c-600': '219 234 254', '--c-700': '239 246 255',
      '--c-800': '30 41 59', '--c-900': '15 23 42', '--c-950': '2 6 23', 
      '--p-50': '15 23 42', '--p-400': '56 189 248', '--p-500': '14 165 233', '--p-600': '2 132 199', '--p-900': '8 47 73',
    }
  },
  sunrise: { 
    isDark: false,
    colors: {
      '--c-50': '255 243 224', '--c-100': '255 224 178', '--c-200': '255 204 188', '--c-300': '255 171 145',
      '--c-400': '255 138 101', '--c-500': '255 87 34', '--c-600': '244 81 30', '--c-700': '216 67 21',
      '--c-800': '191 54 12', '--c-900': '100 30 5', '--c-950': '60 20 5',
      '--p-50': '255 243 224', '--p-400': '255 138 101', '--p-500': '255 112 67', '--p-600': '244 81 30', '--p-900': '191 54 12',
    }
  },
  volcano: { 
    isDark: true,
    colors: {
      '--c-50': '255 204 188', '--c-100': '255 171 145', '--c-200': '255 138 101', '--c-300': '255 112 67',
      '--c-400': '255 138 101', '--c-500': '255 171 145', '--c-600': '255 204 188', '--c-700': '251 233 231',
      '--c-800': '65 40 40', '--c-900': '45 20 20', '--c-950': '30 10 10',
      '--p-50': '65 40 40', '--p-400': '255 87 34', '--p-500': '216 67 21', '--p-600': '191 54 12', '--p-900': '191 54 12',
    }
  },
  lavender: { 
    isDark: false,
    colors: {
      '--c-50': '243 229 245', '--c-100': '225 190 231', '--c-200': '206 147 216', '--c-300': '186 104 200',
      '--c-400': '171 71 188', '--c-500': '156 39 176', '--c-600': '142 36 170', '--c-700': '123 31 162',
      '--c-800': '74 20 140', '--c-900': '50 10 100', '--c-950': '30 5 60',
      '--p-50': '243 229 245', '--p-400': '186 104 200', '--p-500': '171 71 188', '--p-600': '142 36 170', '--p-900': '74 20 140',
    }
  },
  galactic: { 
    isDark: true,
    colors: {
      '--c-50': '224 176 255', '--c-100': '209 196 233', '--c-200': '179 157 219', '--c-300': '149 117 205',
      '--c-400': '179 157 219', '--c-500': '209 196 233', '--c-600': '224 176 255', '--c-700': '243 229 245',
      '--c-800': '45 35 100', '--c-900': '30 20 50', '--c-950': '10 5 20',
      '--p-50': '45 35 100', '--p-400': '171 71 188', '--p-500': '123 31 162', '--p-600': '106 27 154', '--p-900': '74 20 140',
    }
  },
  dune: { 
    isDark: false,
    colors: {
      '--c-50': '253 245 230', '--c-100': '239 235 233', '--c-200': '215 204 200', '--c-300': '188 170 164',
      '--c-400': '161 136 127', '--c-500': '141 110 99', '--c-600': '109 76 65', '--c-700': '93 64 55',
      '--c-800': '78 52 46', '--c-900': '62 39 35', '--c-950': '40 20 20',
      '--p-50': '253 245 230', '--p-400': '161 136 127', '--p-500': '141 110 99', '--p-600': '109 76 65', '--p-900': '78 52 46',
    }
  },
  espresso: { 
    isDark: true,
    colors: {
      '--c-50': '215 204 200', '--c-100': '188 170 164', '--c-200': '161 136 127', '--c-300': '141 110 99',
      '--c-400': '188 170 164', '--c-500': '215 204 200', '--c-600': '239 235 233', '--c-700': '253 245 230',
      '--c-800': '60 50 45', '--c-900': '45 35 30', '--c-950': '30 25 22',
      '--p-50': '60 50 45', '--p-400': '141 110 99', '--p-500': '109 76 65', '--p-600': '93 64 55', '--p-900': '78 52 46',
    }
  },
  hologram: { 
    isDark: false,
    colors: {
      '--c-50': '250 250 250', '--c-100': '245 245 245', '--c-200': '236 239 241', '--c-300': '207 216 220',
      '--c-400': '176 190 197', '--c-500': '144 164 174', '--c-600': '96 125 139', '--c-700': '84 110 122',
      '--c-800': '55 71 79', '--c-900': '38 50 56', '--c-950': '20 30 35',
      '--p-50': '224 247 250', '--p-400': '77 208 225', '--p-500': '0 229 255', '--p-600': '0 188 212', '--p-900': '0 96 100',
    }
  },
  cyberpunk: { 
    isDark: true,
    colors: {
      '--c-50': '255 0 128', '--c-100': '236 239 241', '--c-200': '158 158 158', '--c-300': '117 117 117',
      '--c-400': '158 158 158', '--c-500': '189 189 189', '--c-600': '224 224 224', '--c-700': '245 245 245',
      '--c-800': '24 24 27', '--c-900': '9 9 11', '--c-950': '5 5 5',
      '--p-50': '24 24 27', '--p-400': '118 255 3', '--p-500': '0 255 0', '--p-600': '50 205 50', '--p-900': '0 100 0',
    }
  }
};

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Sub-component: Auto-expanding Textarea ---
const AutoExpandingTextarea = ({ value, onChange, placeholder, className }: { value: string, onChange: (val: string) => void, placeholder?: string, className?: string }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = '0px';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onInput={adjustHeight}
      placeholder={placeholder}
      className={`${className} overflow-hidden`}
      style={{ minHeight: '32px' }}
    />
  );
};

const App: React.FC = () => {
  // --- Unified Data Engine ---
  const db = useFocusSplitDB();
  const { tasks, sessions, workLogs, settings: sprintSettings, archive, setSettings: setSprintSettings } = db;

  // --- UI State ---
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [viewMode, setViewMode] = useState<ViewMode>('planning');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragProgress, setDragProgress] = useState(0);
  const [draggingBaseEstimate, setDraggingBaseEstimate] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isEditingSessionName, setIsEditingSessionName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [newAllowedApp, setNewAllowedApp] = useState('');
  const [language, setLanguage] = useState('en');

  // Maintenance Flag to prevent race conditions during boot
  const initialMaintenanceDone = useRef(false);

  // --- Maintenance & Passive Midnight Watcher ---
  useEffect(() => {
    if (!db.isLoaded || initialMaintenanceDone.current) return;
    
    const triggerMaintenance = () => {
        const today = getTodayString();
        db.performMaintenance(today);
    };

    triggerMaintenance();
    initialMaintenanceDone.current = true;

    // Midnight Watcher
    const interval = setInterval(() => {
        triggerMaintenance();
    }, 1000 * 60 * 5);

    return () => clearInterval(interval);
  }, [db.isLoaded]);

  // Apply Theme
  useEffect(() => {
    const config = THEME_PALETTES[sprintSettings.theme || 'yin'];
    if (config.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [sprintSettings.theme]);

  // Session Management Effect
  useEffect(() => {
    if (!db.isLoaded) return;
    const dateSessions = sessions.filter(s => s.date === selectedDate);
    
    // Logic: Only auto-create if we explicitly switched to a new date that is empty
    // Maintenance handles "Today" creation, so we just sync the ID.
    if (dateSessions.length === 0) {
        const defaultSession: Session = {
          id: crypto.randomUUID(),
          name: DEFAULT_SESSION_NAME,
          date: selectedDate
        };
        db.addSession(defaultSession);
    } else if (!activeSessionId || !dateSessions.find(s => s.id === activeSessionId)) {
      setActiveSessionId(dateSessions[0].id);
    }
  }, [selectedDate, sessions.length, db.isLoaded, activeSessionId]);

  const sessionsForDate = useMemo(() => sessions.filter(s => s.date === selectedDate), [sessions, selectedDate]);
  const currentSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);
  
  const tasksForSession = useMemo(() => {
    return tasks
      .filter(t => t.date === selectedDate && t.sessionId === activeSessionId)
      .sort((a, b) => {
          if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
          if (a.wasRolledOver !== b.wasRolledOver) return a.wasRolledOver ? 1 : -1;
          const getScore = (t: Task) => {
              const map = { high: 3, medium: 2, low: 1 };
              const u = map[t.urgency || 'medium'];
              const i = map[t.importance || 'medium'];
              return (u * 2) + i;
          };
          const scoreA = getScore(a);
          const scoreB = getScore(b);
          if (scoreA !== scoreB) return scoreB - scoreA;
          return 0;
      });
  }, [tasks, selectedDate, activeSessionId]);

  const completedCount = useMemo(() => tasksForSession.filter(t => t.isCompleted).length, [tasksForSession]);
  const todayStr = getTodayString();

  const addTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim() || !activeSessionId) return;

    const extractedTags: string[] = [];
    const cleanTitle = newTaskTitle.replace(/#(\w+)/g, (match, tag) => {
        extractedTags.push(tag.toLowerCase());
        return '';
    }).trim();

    const finalTitle = cleanTitle || newTaskTitle;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: finalTitle,
      isCompleted: false,
      totalTime: 0,
      date: selectedDate,
      sessionId: activeSessionId,
      distractionTime: 0,
      tags: extractedTags,
      progress: 0
    };

    db.addTask(newTask);
    setNewTaskTitle('');
  };

  const removeTask = (id: string) => {
    db.deleteTask(id);
  };

  const handleUpdateTask = (taskId: string, accumulatedTime: number, isCompleted: boolean, distractionTime: number, earnedMinutes: number = 0) => {
    if (accumulatedTime !== 0) {
      const todayStr = getTodayString();
      const newLog: WorkLog = {
          id: crypto.randomUUID(),
          taskId,
          date: todayStr,
          duration: accumulatedTime,
          timestamp: Date.now(),
          earnedMinutes: earnedMinutes 
      };
      db.addWorkLog(newLog);
    }

    const task = tasks.find(t => t.id === taskId);
    if (task) {
      db.updateTask(taskId, {
        totalTime: Math.max(0, task.totalTime + accumulatedTime),
        distractionTime: Math.max(0, (task.distractionTime || 0) + distractionTime),
        isCompleted: isCompleted,
        progress: isCompleted ? 100 : (task.progress === 100 ? 0 : (task.progress || 0))
      });
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, task: Task) => {
    const newVal = parseInt(e.target.value);
    if (draggingTaskId !== task.id) {
        setDraggingTaskId(task.id);
        const currentProgress = task.progress || 0;
        if (task.estimatedTime) {
            const remainingRatio = 1 - (currentProgress / 100);
            setDraggingBaseEstimate(remainingRatio > 0.01 ? task.estimatedTime / remainingRatio : task.estimatedTime);
        } else {
            setDraggingBaseEstimate(null);
        }
    }
    setDragProgress(newVal);
  };

  const handleCommitProgress = (taskId: string) => {
    if (draggingTaskId !== taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (dragProgress >= 100) {
        db.updateTask(taskId, { estimatedTime: 0, isCompleted: true, progress: 100 });
    } else {
        const updates: Partial<Task> = { progress: dragProgress, isCompleted: false };
        if (draggingBaseEstimate !== null && draggingBaseEstimate > 0) {
            const remainingRatio = 1 - (dragProgress / 100);
            updates.estimatedTime = Math.max(0, Math.round(draggingBaseEstimate * remainingRatio));
        }
        db.updateTask(taskId, updates);
    }
    setDraggingTaskId(null);
    setDraggingBaseEstimate(null);
  };

  const toggleTaskCompletion = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) handleUpdateTask(taskId, 0, !task.isCompleted, 0, 0);
  };

  const createNewSession = () => {
    const newSession: Session = {
        id: crypto.randomUUID(),
        name: `Session ${sessionsForDate.length + 1}`,
        date: selectedDate
    };
    db.addSession(newSession);
    setActiveSessionId(newSession.id);
  };

  const startEditingSession = () => {
    if (currentSession) {
        setEditingNameValue(currentSession.name);
        setIsEditingSessionName(true);
    }
  };

  const saveSessionName = () => {
    if (currentSession && editingNameValue.trim()) {
        db.updateSession(currentSession.id, { name: editingNameValue.trim() });
    }
    setIsEditingSessionName(false);
  };

  const addAllowedApp = () => {
    if (newAllowedApp.trim()) {
      setSprintSettings({...sprintSettings, allowedApps: [...sprintSettings.allowedApps, newAllowedApp.trim()]});
      setNewAllowedApp('');
    }
  };

  const adjustEstimate = (taskId: string, delta: number) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const current = task.estimatedTime || 0;
      db.updateTask(taskId, { estimatedTime: Math.max(0, current + delta) });
  };

  const themeVars = THEME_PALETTES[sprintSettings.theme || 'yin'].colors as CSSProperties;

  if (viewMode === 'active') {
    return (
      <div style={themeVars} className="h-full">
        <SprintMode 
            tasks={tasksForSession}
            settings={sprintSettings}
            onUpdateTask={handleUpdateTask}
            onSprintComplete={() => setViewMode('summary')}
            onExit={() => setViewMode('planning')}
            onUpdateSettings={setSprintSettings} 
        />
      </div>
    );
  }

  if (viewMode === 'summary') {
    return (
      <div style={themeVars} className="h-full">
        <SummaryView 
            tasks={tasksForSession}
            onBack={() => setViewMode('planning')}
            onRollOver={handleRollOver}
            onBatchUpdate={db.batchUpdateTasks}
            theme={sprintSettings.theme || 'yin'}
            darkMode={sprintSettings.darkMode}
        />
      </div>
    );
  }

  function handleRollOver(updates: { id: string, progress: number }[]) {
      const tomorrow = new Date(selectedDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextDateStr = tomorrow.toISOString().split('T')[0];
      
      let targetSessionId = sessions.find(s => s.date === nextDateStr)?.id;
      if (!targetSessionId) {
          const newSession: Session = { id: crypto.randomUUID(), name: DEFAULT_SESSION_NAME, date: nextDateStr };
          db.addSession(newSession);
          targetSessionId = newSession.id;
      }
      
      db.batchUpdateTasks(updates.map(u => ({
          id: u.id,
          changes: { date: nextDateStr, sessionId: targetSessionId!, isCompleted: false, isRollover: true, progress: u.progress }
      })));
  }

  if (viewMode === 'calendar') {
     return (
        <div style={themeVars} className="h-[100dvh] flex flex-col font-sans overflow-hidden">
            <FullCalendarView 
                tasks={tasks}
                selectedDate={selectedDate}
                onSelectDate={(date) => { setSelectedDate(date); setViewMode('planning'); }}
                onBack={() => setViewMode('planning')}
            />
            <BottomNav currentMode={viewMode} onChangeMode={setViewMode} />
        </div>
     );
  }

  if (viewMode === 'settings') {
    return (
      <div style={themeVars} className="h-[100dvh] flex flex-col font-sans overflow-hidden">
         <div className="flex-1 overflow-y-auto">
            <ParametersView 
                currentTheme={sprintSettings.theme}
                onThemeChange={(t) => setSprintSettings({...sprintSettings, theme: t})}
                language={language}
                onLanguageChange={setLanguage}
                darkMode={sprintSettings.darkMode}
                onToggleDarkMode={() => {}}
                archive={archive}
                earningRatio={sprintSettings.earningRatio || 5}
                onEarningRatioChange={(ratio) => setSprintSettings({...sprintSettings, earningRatio: ratio})}
            />
         </div>
         <BottomNav currentMode={viewMode} onChangeMode={setViewMode} />
      </div>
    );
  }

  const PrioritySelect = ({ label, icon, value, onChange }: { label: string, icon: React.ReactNode, value: PriorityLevel | undefined, onChange: (val: PriorityLevel | undefined) => void }) => (
    <div className="flex flex-col gap-0.5">
        <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            {icon} {label}
        </label>
        <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 h-[28px] items-stretch">
            {(['low', 'medium', 'high'] as PriorityLevel[]).map((level) => (
                <button
                    key={level}
                    onClick={() => onChange(value === level ? undefined : level)}
                    className={`flex-1 py-1 px-1 text-[9px] font-bold uppercase rounded-lg transition-all ${value === level ? (level === 'high' ? 'bg-red-500 text-white shadow-sm' : level === 'medium' ? 'bg-zinc-600 text-white dark:bg-zinc-200 dark:text-black shadow-sm' : 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 shadow-sm') : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                >
                    {level}
                </button>
            ))}
        </div>
    </div>
  );

  return (
    <div style={themeVars} className="h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans selection:bg-primary-500/30 overflow-hidden transition-colors duration-500 ease-in-out">
      {viewMode === 'planning' ? (
        <div className="flex flex-col h-full">
           <header className="px-3 py-2 bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 shrink-0 backdrop-blur-md transition-colors">
              <div className="max-w-2xl mx-auto flex justify-between items-center w-full px-1">
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-primary-500 to-zinc-500 dark:from-primary-400 dark:to-zinc-400 bg-clip-text text-transparent">Focus Split</h1>
                <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedDate(getTodayString())} className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 border ${selectedDate === todayStr ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-default' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm'}`}>
                        <CalendarCheck size={14} /> {selectedDate === todayStr ? 'Today' : 'Go to Today'}
                    </button>
                    <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 ml-1 rounded-full transition-colors ${showSettings ? 'bg-zinc-100 dark:bg-zinc-800 text-primary-600 dark:text-primary-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500'}`}><Settings2 size={18} /></button>
                </div>
              </div>
           </header>

           {showSettings && (
              <div className="bg-white/90 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 shrink-0 overflow-y-auto max-h-[50vh] z-20 shadow-xl backdrop-blur-md">
                 <div className="max-w-2xl mx-auto p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold flex items-center gap-2 text-zinc-400"><Database size={16} />Storage Health</label>
                      <span className="text-xs font-bold text-green-500 uppercase">Optimized</span>
                    </div>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold flex items-center gap-2 text-zinc-700 dark:text-zinc-300"><ShieldAlert size={16} className="text-red-500" />Enforce Focus Guard</label>
                      <input type="checkbox" checked={sprintSettings.enforceFocusGuard} onChange={e => setSprintSettings({...sprintSettings, enforceFocusGuard: e.target.checked})} className="accent-red-500 h-5 w-5" />
                    </div>
                    {sprintSettings.enforceFocusGuard && (
                        <div className="mt-4 pl-4 border-l-2 border-red-200 dark:border-red-900/50 animate-in slide-in-from-top-2 fade-in">
                            <input type="text" value={newAllowedApp} onChange={(e) => setNewAllowedApp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addAllowedApp()} placeholder="Add exception..." className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 mb-2" />
                            <div className="flex flex-wrap gap-2">{sprintSettings.allowedApps.map((app, idx) => (<span key={idx} className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">{app}<button onClick={() => setSprintSettings({...sprintSettings, allowedApps: sprintSettings.allowedApps.filter(a => a !== app)})}><X size={12}/></button></span>))}</div>
                        </div>
                    )}
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Enable Breaks</label>
                      <input type="checkbox" checked={sprintSettings.enableBreaks} onChange={e => setSprintSettings({...sprintSettings, enableBreaks: e.target.checked})} className="accent-primary-500 h-5 w-5" />
                    </div>
                    {sprintSettings.enableBreaks && (
                      <div className="pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center justify-between"><label className="text-sm flex items-center gap-2"><Coffee size={14} className="text-orange-500" />Custom Break (mins)</label><input type="number" min="1" max="120" value={sprintSettings.customBreakMinutes === 0 ? '' : sprintSettings.customBreakMinutes} onChange={e => setSprintSettings({...sprintSettings, customBreakMinutes: parseInt(e.target.value) || 0})} className="bg-zinc-100 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded p-1 w-16 text-center text-sm font-bold" /></div>
                        <div className="flex items-center justify-between"><label className="text-sm flex items-center gap-2"><PiggyBank size={14} className="text-pink-500" />Time Bank (mins)</label><div className="bg-pink-50 dark:bg-pink-950/20 px-3 py-1 rounded-lg text-sm font-bold text-pink-700 dark:text-pink-400">{sprintSettings.timeBankMinutes.toFixed(2)}</div></div>
                      </div>
                    )}
                 </div>
              </div>
           )}

           <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

           <div className="flex-1 overflow-y-auto p-2 pb-48 max-w-2xl mx-auto w-full no-scrollbar">
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 flex gap-2 overflow-x-auto p-1 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 no-scrollbar">
                        {sessionsForDate.map(session => (
                            <button key={session.id} onClick={() => setActiveSessionId(session.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all min-w-max flex-1 ${activeSessionId === session.id ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-md' : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>
                                {session.name}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1 p-1 bg-white/50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
                        {isEditingSessionName ? (<input autoFocus value={editingNameValue} onChange={e => setEditingNameValue(e.target.value)} onBlur={saveSessionName} onKeyDown={e => e.key === 'Enter' && saveSessionName()} className="w-20 bg-white dark:bg-black rounded-lg px-2 py-1 text-xs" />) : (<><button onClick={startEditingSession} className="p-1.5 rounded-lg text-zinc-400"><Edit2 size={14}/></button><button onClick={() => currentSession && db.deleteSession(currentSession.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500"><Trash2 size={14}/></button><button onClick={createNewSession} className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500"><Plus size={14}/></button></>)}
                    </div>
                </div>

                <div className="space-y-1.5">
                  {tasksForSession.map(task => {
                      const isExpanded = expandedTaskId === task.id;
                      const displayProgress = draggingTaskId === task.id ? dragProgress : (task.isCompleted ? 100 : (task.progress ?? 0));
                      const isOverdue = !task.isCompleted && task.dueDate && task.dueDate < todayStr;
                      
                      return (
                        <div key={task.id} className={`relative flex flex-col rounded-xl border-2 border-l-4 overflow-hidden transition-all duration-300 ${task.isCompleted ? 'bg-emerald-50/40 dark:bg-emerald-900/10 border-emerald-200 opacity-70' : 'bg-white dark:bg-zinc-800 border-zinc-200 shadow-sm'}`}>
                          {!task.isCompleted && !isExpanded && (<input type="range" min="0" max="100" value={displayProgress} onChange={e => handleSliderChange(e, task)} onMouseUp={() => handleCommitProgress(task.id)} className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" />)}
                          {!task.isCompleted && (<div className="absolute top-0 bottom-0 left-0 bg-primary-100/50 dark:bg-primary-900/30 transition-all z-0" style={{ width: `${displayProgress}%` }} />)}
                          <div className={`flex items-start p-1.5 gap-2.5 relative z-20 pointer-events-none`}>
                              <div className="flex-1 min-w-0">
                                 {isExpanded ? (
                                     <input type="text" value={task.title} onChange={e => db.updateTask(task.id, {title: e.target.value})} className="w-full bg-transparent border-b border-primary-500 font-bold pointer-events-auto text-zinc-900 dark:text-white py-0.5 text-sm" autoFocus />
                                 ) : (
                                     <div>
                                        <h3 className={`text-sm font-bold truncate leading-tight ${task.isCompleted ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'}`}>{task.title}</h3>
                                        <div className="flex items-center flex-wrap gap-1 mt-0.5">
                                            {task.dueDate && (
                                                <span className={`text-[8px] font-black uppercase flex items-center gap-1 px-1 py-0.5 rounded border ${isOverdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700'}`}>
                                                    <CalendarIcon size={8} /> 
                                                    due: {task.dueDate === todayStr ? 'Today' : task.dueDate}
                                                </span>
                                            )}
                                            {task.urgency && (
                                                <span className={`text-[8px] font-black uppercase flex items-center gap-1 px-1 py-0.5 rounded border ${task.urgency === 'high' ? 'bg-red-100 text-red-600 border-red-200' : task.urgency === 'medium' ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                                                    <Star size={8} /> urgency: {task.urgency}
                                                </span>
                                            )}
                                            {task.importance && (
                                                <span className={`text-[8px] font-black uppercase flex items-center gap-1 px-1 py-0.5 rounded border ${task.importance === 'high' ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                                                    <Flag size={8} /> importance: {task.importance}
                                                </span>
                                            )}
                                            {(task.estimatedTime || 0) > 0 && (
                                                <span className="text-[8px] font-black uppercase flex items-center gap-1 px-1 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                                                    <Clock size={8} /> {task.estimatedTime}m
                                                </span>
                                            )}
                                        </div>
                                     </div>
                                 )}
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0 pointer-events-auto">
                                   <button onClick={e => { e.stopPropagation(); toggleTaskCompletion(task.id); }} className={`p-1 rounded-md transition-colors ${task.isCompleted ? 'text-emerald-600 bg-emerald-100' : 'text-zinc-400 hover:text-emerald-500'}`}><CheckCircle2 size={14} /></button>
                                   <button onClick={e => { e.stopPropagation(); removeTask(task.id); }} className="p-1 text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                   <button onClick={() => setExpandedTaskId(isExpanded ? null : task.id)} className={`p-1 rounded transition-colors ${isExpanded ? 'text-primary-600' : 'text-zinc-400'}`}>{isExpanded ? <ChevronUp size={14} /> : <Edit2 size={14} />}</button>
                              </div>
                          </div>
                          {isExpanded && (
                              <div className="px-2.5 pb-3 space-y-2.5 relative z-30 bg-white dark:bg-zinc-900/95 animate-in slide-in-from-top-1">
                                <div className="grid grid-cols-2 gap-2">
                                    <PrioritySelect label="Urgency" icon={<Star size={10} />} value={task.urgency} onChange={val => db.updateTask(task.id, {urgency: val})} />
                                    <PrioritySelect label="Importance" icon={<Flag size={10} />} value={task.importance} onChange={val => db.updateTask(task.id, {importance: val})} />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    {/* DEADLINE SECTION */}
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                <CalendarIcon size={10} /> Deadline
                                            </label>
                                            {(task.dueDate || task.dueTime) && (
                                                <button onClick={() => db.updateTask(task.id, {dueDate: undefined, dueTime: undefined})} className="text-zinc-400 hover:text-red-500 transition-colors"><X size={10}/></button>
                                            )}
                                        </div>
                                        <div className="flex gap-1 h-[28px]">
                                            <input 
                                                type="date" 
                                                value={task.dueDate || ''} 
                                                onChange={e => db.updateTask(task.id, {dueDate: e.target.value})} 
                                                className="flex-1 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-1.5 text-[10px] font-bold shadow-inner focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-0 pointer-events-auto"
                                            />
                                            <input 
                                                type="time" 
                                                value={task.dueTime || ''} 
                                                onChange={e => db.updateTask(task.id, {dueTime: e.target.value})} 
                                                className="w-12 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-0.5 text-[9px] font-bold shadow-inner focus:outline-none focus:ring-1 focus:ring-primary-500 shrink-0 pointer-events-auto"
                                            />
                                        </div>
                                    </div>

                                    {/* ESTIMATED TIME SECTION - REFINED FOR TYPING */}
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                <Timer size={10} /> Est (min)
                                            </label>
                                            {(task.estimatedTime || 0) > 0 && (
                                                <button onClick={() => db.updateTask(task.id, {estimatedTime: undefined})} className="text-zinc-400 hover:text-red-500 transition-colors"><X size={10}/></button>
                                            )}
                                        </div>
                                        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 h-[28px] p-0.5 overflow-hidden">
                                            <button onClick={() => adjustEstimate(task.id, -5)} className="p-1 text-zinc-400 hover:text-red-500 transition-colors focus:outline-none pointer-events-auto"><Minus size={12}/></button>
                                            <input 
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={task.estimatedTime === undefined ? '' : task.estimatedTime}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '') {
                                                        db.updateTask(task.id, { estimatedTime: undefined });
                                                    } else {
                                                        // Keep only digits
                                                        const parsed = parseInt(val.replace(/\D/g, ''));
                                                        if (!isNaN(parsed)) {
                                                            db.updateTask(task.id, { estimatedTime: parsed });
                                                        }
                                                    }
                                                }}
                                                className="flex-1 bg-transparent text-center font-black text-sm tabular-nums text-primary-600 dark:text-primary-400 focus:outline-none w-full pointer-events-auto"
                                            />
                                            <button onClick={() => adjustEstimate(task.id, 5)} className="p-1 text-zinc-400 hover:text-green-500 transition-colors focus:outline-none pointer-events-auto"><Plus size={12}/></button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                        <FileText size={10} /> Notes
                                    </label>
                                    <AutoExpandingTextarea 
                                        value={task.description || ''} 
                                        onChange={val => db.updateTask(task.id, {description: val})} 
                                        placeholder="Add details..." 
                                        className="w-full text-xs bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-xl resize-none focus:border-primary-500 outline-none shadow-inner pointer-events-auto" 
                                    />
                                </div>
                              </div>
                          )}
                        </div>
                      );
                  })}
                </div>
           </div>

           <div className="shrink-0 p-2 pb-24 z-20">
              <div className="max-w-2xl mx-auto flex flex-col gap-2">
                {tasksForSession.filter(t => !t.isCompleted).length > 0 ? (
                  <button onClick={() => setViewMode('active')} className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold text-base p-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"><Play fill="currentColor" size={16} /> Start "{currentSession?.name}"</button>
                ) : (completedCount > 0 && <div className="p-3 bg-green-100 dark:bg-green-900/10 rounded-xl text-center text-green-700 text-xs font-medium animate-in zoom-in-95 duration-300">✨ Session completed!</div>)}

                <form onSubmit={addTask} className="bg-white/90 dark:bg-zinc-900/90 border-2 border-zinc-200 dark:border-zinc-800 p-1.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2">
                  <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="New Task... (use #tags)" className="flex-1 bg-transparent p-1.5 text-sm focus:outline-none" />
                  <button type="submit" disabled={!newTaskTitle.trim()} className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black p-2 rounded-xl transition-all active:scale-95 disabled:opacity-50">
                    <Plus size={18} />
                  </button>
                </form>
              </div>
           </div>
        </div>
      ) : (<div className="h-full overflow-y-auto pb-24 no-scrollbar"><ProfileView tasks={tasks} workLogs={workLogs} theme={sprintSettings.theme || 'yin'} darkMode={sprintSettings.darkMode} /></div>)}
      <BottomNav currentMode={viewMode} onChangeMode={setViewMode} />
    </div>
  );
};

export default App;
