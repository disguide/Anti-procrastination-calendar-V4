
export interface Session {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
}

export type PriorityLevel = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  totalTime: number; // in milliseconds
  date: string; // ISO date string (YYYY-MM-DD)
  sessionId: string; // Links task to a specific session
  distractionTime?: number;
  isRollover?: boolean; // If this task IS a rollover from the past
  wasRolledOver?: boolean; // If this task WAS rolled over to the future
  tags?: string[];
  description?: string;
  estimatedTime?: number; // minutes
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  urgency?: PriorityLevel;
  importance?: PriorityLevel;
  progress?: number; // 0-100 percentage for tasks without estimates
}

export interface WorkLog {
  id: string;
  taskId: string;
  date: string; // YYYY-MM-DD when the work happened
  duration: number; // ms
  timestamp: number;
  earnedMinutes?: number; // Track how much bank time was earned in this chunk
}

export interface ArchiveStats {
  totalFocusMs: number;
  totalTasksCompleted: number;
  lastPrunedDate: string;
}

export type ViewMode = 'planning' | 'active' | 'summary' | 'profile' | 'calendar' | 'settings';

export interface DailyStats {
  date: string;
  totalTime: number;
  completedTasks: number;
}

export type Theme = 
  | 'yin' | 'yang' 
  | 'zen' | 'forest'
  | 'seafoam' | 'midnight'
  | 'sunrise' | 'volcano'
  | 'lavender' | 'galactic'
  | 'dune' | 'espresso'
  | 'hologram' | 'cyberpunk';

export interface SprintSettings {
  enableBreaks: boolean;
  customBreakMinutes: number; // Configurable custom/long break
  allowedApps: string[];
  enforceFocusGuard: boolean;
  theme: Theme;
  darkMode: boolean;
  timeBankMinutes: number; // Time Bank feature
  earningRatio: number; // 1:X ratio for earning time
}

// Unified state structure for persistence
export interface DatabaseState {
  tasks: Task[];
  sessions: Session[];
  workLogs: WorkLog[];
  settings: SprintSettings;
  archive?: ArchiveStats; // Compressed old data
  version: number;
}
