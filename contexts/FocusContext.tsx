import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Task, Session, WorkLog, SprintSettings, ArchiveStats } from '../types';

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

const DEFAULT_SESSION_NAME = "Main Focus";
const PRUNE_THRESHOLD_DAYS = 180;

interface FocusContextType {
    isLoaded: boolean;
    tasks: Task[];
    sessions: Session[];
    workLogs: WorkLog[];
    settings: SprintSettings;
    archive?: ArchiveStats;
    setSettings: (s: SprintSettings) => void;
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    batchUpdateTasks: (updates: { id: string, changes: Partial<Task> }[]) => void;
    addSession: (session: Session) => void;
    updateSession: (id: string, updates: Partial<Session>) => void;
    deleteSession: (id: string) => void;
    addWorkLog: (log: WorkLog) => void;
    undoWorkLog: (taskId: string, duration: number, earnedMinutes: number) => void;
    resetDatabase: () => Promise<void>;
    performMaintenance: (todayStr: string) => Promise<void>;
    pruneData: (daysToKeep?: number) => Promise<void>;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export function FocusProvider({ children }: { children: React.ReactNode }) {
    // --- Live Queries ---
    const tasks = useLiveQuery(() => db.tasks.toArray(), [], []) || [];
    const sessions = useLiveQuery(() => db.sessions.toArray(), [], []) || [];
    const workLogs = useLiveQuery(() => db.workLogs.toArray(), [], []) || [];
    const settingsArr = useLiveQuery(() => db.settings.toArray(), [], []) || [];
    const archiveArr = useLiveQuery(() => db.archive.toArray(), [], []) || [];

    const settings = settingsArr.length > 0 ? settingsArr[0] : INITIAL_SETTINGS;
    const archive = archiveArr.length > 0 ? archiveArr[0] : undefined;
    const isLoaded = useLiveQuery(() => Promise.resolve(true), [], false);

    // --- Migration Effect ---
    useEffect(() => {
        const migrate = async () => {
            const count = await db.settings.count();
            if (count === 0) {
                const legacy = localStorage.getItem('focusSplit_db_v5');
                if (legacy) {
                    try {
                        const data = JSON.parse(legacy);
                        await db.transaction('rw', [db.tasks, db.sessions, db.workLogs, db.settings, db.archive], async () => {
                            if (data.tasks?.length) await db.tasks.bulkAdd(data.tasks);
                            if (data.sessions?.length) await db.sessions.bulkAdd(data.sessions);
                            if (data.workLogs?.length) await db.workLogs.bulkAdd(data.workLogs);
                            if (data.settings) await db.settings.put({ ...data.settings, id: 'settings' });
                            if (data.archive) await db.archive.put({ ...data.archive, id: 'archive' });
                        });
                        console.log("Migration from LocalStorage successful");
                    } catch (e) {
                        console.error("Migration failed", e);
                    }
                }
            }

            // CHANGE: Cleanup "Zombie" tasks from previous bug (tasks with no session)
            const zombies = await db.tasks.filter(t => !t.sessionId || t.sessionId === '').count();
            if (zombies > 0) {
                await db.tasks.filter(t => !t.sessionId || t.sessionId === '').delete();
                console.log(`Cleaned up ${zombies} zombie tasks.`);
            }
        };
        migrate();
    }, []);

    // --- Actions ---
    const setSettings = (newSettings: SprintSettings) => {
        db.settings.put({ ...newSettings, id: 'settings' });
    };

    const addTask = (task: Task) => db.tasks.add(task);

    const updateTask = (id: string, updates: Partial<Task>) => {
        db.tasks.update(id, updates);
    };

    const deleteTask = (id: string) => {
        db.transaction('rw', db.tasks, db.workLogs, () => {
            db.tasks.delete(id);
            db.workLogs.where('taskId').equals(id).delete();
        });
    };

    const batchUpdateTasks = (updates: { id: string, changes: Partial<Task> }[]) => {
        db.transaction('rw', db.tasks, async () => {
            for (const u of updates) {
                await db.tasks.update(u.id, u.changes);
            }
        });
    };

    const addSession = (session: Session) => db.sessions.add(session);

    const updateSession = (id: string, updates: Partial<Session>) => {
        db.sessions.update(id, updates);
    };

    const deleteSession = (id: string) => {
        db.transaction('rw', db.sessions, db.tasks, () => {
            db.sessions.delete(id);
            db.tasks.where('sessionId').equals(id).delete();
        });
    };

    const addWorkLog = (log: WorkLog) => db.workLogs.add(log);

    const undoWorkLog = (taskId: string, duration: number, earnedMinutes: number) => {
        db.transaction('rw', db.tasks, db.settings, async () => {
            const task = await db.tasks.get(taskId);
            if (task) {
                await db.tasks.update(taskId, {
                    totalTime: Math.max(0, task.totalTime - duration),
                    isCompleted: false
                });
            }
            if (earnedMinutes > 0) {
                const currentSettings = await db.settings.get('settings');
                if (currentSettings) {
                    await db.settings.update('settings', {
                        timeBankMinutes: Math.max(0, currentSettings.timeBankMinutes - earnedMinutes)
                    });
                }
            }
        });
    };

    const resetDatabase = async () => {
        await db.transaction('rw', [db.tasks, db.sessions, db.workLogs, db.settings, db.archive], async () => {
            await db.tasks.clear();
            await db.sessions.clear();
            await db.workLogs.clear();
            await db.settings.clear();
            await db.archive.clear();
        });
    };

    // --- Maintenance ---
    const performMaintenance = useCallback(async (todayStr: string) => {
        // ... (existing rollover logic)
    }, []);

    const pruneData = async (daysToKeep = 180) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysToKeep);
        const cutoffStr = cutoff.toISOString().split('T')[0];

        await db.transaction('rw', db.tasks, db.workLogs, db.sessions, db.archive, async () => {
            // 1. Find old data
            const oldLogs = await db.workLogs.where('date').below(cutoffStr).toArray();
            const oldTasks = await db.tasks.where('date').below(cutoffStr).toArray();
            const oldSessions = await db.sessions.where('date').below(cutoffStr).toArray();

            if (oldLogs.length === 0 && oldTasks.length === 0 && oldSessions.length === 0) return; // Nothing to do

            // 2. Aggregate stats
            const durationSum = oldLogs.reduce((acc, log) => acc + log.duration, 0);
            const completedCount = oldTasks.filter(t => t.isCompleted).length;

            // 3. Update Archive
            const currentArchive = (await db.archive.toArray())[0] || {
                id: 'archive',
                totalFocusMs: 0,
                totalTasksCompleted: 0,
                lastPrunedDate: new Date().toISOString()
            };

            await db.archive.put({
                ...currentArchive,
                totalFocusMs: currentArchive.totalFocusMs + durationSum,
                totalTasksCompleted: currentArchive.totalTasksCompleted + completedCount,
                lastPrunedDate: new Date().toISOString()
            });

            // 4. Delete old data
            const logIds = oldLogs.map(l => l.id);
            const taskIds = oldTasks.map(t => t.id);
            const sessionIds = oldSessions.map(s => s.id);

            await db.workLogs.bulkDelete(logIds);
            await db.tasks.bulkDelete(taskIds);
            await db.sessions.bulkDelete(sessionIds);

            console.log(`Pruned ${logIds.length} logs, ${taskIds.length} tasks, and ${sessionIds.length} sessions older than ${cutoffStr}`);
        });
    };

    const value = {
        isLoaded: !!isLoaded,
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
        resetDatabase,
        performMaintenance,
        pruneData
    };

    return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocusContext() {
    const context = useContext(FocusContext);
    if (!context) {
        throw new Error("useFocusContext must be used within a FocusProvider");
    }
    return context;
}
