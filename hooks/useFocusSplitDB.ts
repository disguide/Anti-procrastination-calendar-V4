
import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, Session, WorkLog, SprintSettings, DatabaseState, ArchiveStats } from '../types';

const STORAGE_KEY = 'focusSplit_db_v5';
const DEFAULT_SESSION_NAME = "Main Focus";
const PRUNE_THRESHOLD_DAYS = 180; // Keep 6 months of detailed logs

const INITIAL_SETTINGS: SprintSettings = {
  enableBreaks: true,
  customBreakMinutes: 20,
  allowedApps: [],
  enforceFocusGuard: false,
  theme: 'yin',
  darkMode: false,
  timeBankMinutes: 0,
  earningRatio: 2,
};

export function useFocusSplitDB() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [settings, setSettings] = useState<SprintSettings>(INITIAL_SETTINGS);
  const [archive, setArchive] = useState<ArchiveStats | undefined>();

  // --- Persistence ---

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: DatabaseState = JSON.parse(saved);
        setTasks(data.tasks || []);
        setSessions(data.sessions || []);
        setWorkLogs(data.workLogs || []);
        setSettings(data.settings || INITIAL_SETTINGS);
        setArchive(data.archive);
      } catch (e) {
        console.error("Failed to load DB:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const sync = useCallback(() => {
    if (!isLoaded) return;
    const state: DatabaseState = {
      tasks,
      sessions,
      workLogs,
      settings,
      archive,
      version: 5
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isLoaded, tasks, sessions, workLogs, settings, archive]);

  useEffect(() => {
    sync();
  }, [sync]);

  // --- Garbage Collection ---

  const pruneOldData = useCallback(() => {
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() - PRUNE_THRESHOLD_DAYS);
    const thresholdStr = thresholdDate.toISOString().split('T')[0];

    setWorkLogs(prevLogs => {
      const logsToPrune = prevLogs.filter(l => l.date < thresholdStr);
      if (logsToPrune.length === 0) return prevLogs;

      const prunedFocusMs = logsToPrune.reduce((acc, l) => acc + l.duration, 0);

      setArchive(prev => ({
        totalFocusMs: (prev?.totalFocusMs || 0) + prunedFocusMs,
        totalTasksCompleted: (prev?.totalTasksCompleted || 0),
        lastPrunedDate: new Date().toISOString()
      }));

      return prevLogs.filter(l => l.date >= thresholdStr);
    });

    setTasks(prevTasks => {
      return prevTasks.filter(t => !t.isCompleted || t.date >= thresholdStr);
    });
  }, []);

  // --- Maintenance ---

  const performMaintenance = useCallback((todayStr: string) => {
    // 1. Ensure a session exists for today
    setSessions(prev => {
      const existing = prev.find(s => s.date === todayStr);
      if (existing) return prev;

      const newSession: Session = {
        id: crypto.randomUUID(),
        name: DEFAULT_SESSION_NAME,
        date: todayStr
      };
      return [...prev, newSession];
    });

    // 2. Rollover Tasks
    setTasks(prevTasks => {
      const existingSessions = sessions; // Caution: this might be stale in a callback, but we check within setSessions above
      let changed = false;
      const nextTasks = prevTasks.map(t => {
        if (t.date < todayStr && !t.isCompleted && !t.wasRolledOver) {
          changed = true;
          // We assume today's session is handled by the setSessions call above or exists
          // For safety, we match the logic: find today's session ID
          return {
            ...t,
            date: todayStr,
            isRollover: true,
          };
        }
        return t;
      });
      return changed ? nextTasks : prevTasks;
    });

    pruneOldData();
  }, [sessions, pruneOldData]);

  // --- Actions ---

  const addTask = (task: Task) => setTasks(prev => [...prev, task]);

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setWorkLogs(prev => prev.filter(l => l.taskId !== id));
  };

  const batchUpdateTasks = (updates: { id: string, changes: Partial<Task> }[]) => {
    setTasks(prev => prev.map(t => {
      const u = updates.find(update => update.id === t.id);
      return u ? { ...t, ...u.changes } : t;
    }));
  };

  const addSession = (session: Session) => {
    setSessions(prev => {
      // Prevent duplicate sessions on the same date with the same name
      const duplicate = prev.find(s => s.date === session.date && s.name === session.name);
      if (duplicate) return prev;
      return [...prev, session];
    });
  };

  const updateSession = (id: string, updates: Partial<Session>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    setTasks(prev => prev.filter(t => t.sessionId !== id));
  };

  const addWorkLog = (log: WorkLog) => setWorkLogs(prev => [...prev, log]);

  const undoWorkLog = (taskId: string, duration: number, earnedMinutes: number) => {
    updateTask(taskId, {
      totalTime: Math.max(0, (tasks.find(t => t.id === taskId)?.totalTime || 0) - duration),
      isCompleted: false
    });
    if (earnedMinutes > 0) {
      setSettings(prev => ({
        ...prev,
        timeBankMinutes: Math.max(0, prev.timeBankMinutes - earnedMinutes)
      }));
    }
  };

  return {
    isLoaded,
    tasks,
    sessions,
    workLogs,
    settings,
    archive,
    setSettings,
    addTask,
    updateTask,
    deleteTask,
    batchUpdateTasks,
    addSession,
    updateSession,
    deleteSession,
    addWorkLog,
    undoWorkLog,
    performMaintenance
  };
}
