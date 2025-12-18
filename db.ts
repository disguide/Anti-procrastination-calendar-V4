import Dexie, { Table } from 'dexie';
import { Task, Session, WorkLog, SprintSettings, ArchiveStats } from './types';

export class FocusSplitDatabase extends Dexie {
    tasks!: Table<Task>;
    sessions!: Table<Session>;
    workLogs!: Table<WorkLog>;
    settings!: Table<SprintSettings & { id: string }>; // Singleton, id='settings'
    archive!: Table<ArchiveStats & { id: string }>; // Singleton, id='archive'

    constructor() {
        super('focusSplit_db_v6'); // Bump version to v6 for the new engine
        this.version(1).stores({
            tasks: 'id, date, sessionId, isCompleted, isRollover',
            sessions: 'id, date',
            workLogs: 'id, taskId, date',
            settings: 'id', // Singleton
            archive: 'id'  // Singleton
        });
    }
}

export const db = new FocusSplitDatabase();
