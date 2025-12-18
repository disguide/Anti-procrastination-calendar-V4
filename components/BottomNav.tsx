import React from 'react';
import { LayoutList, Trophy, CalendarDays, Settings } from 'lucide-react';
import { ViewMode } from '../types';

interface BottomNavProps {
  currentMode: ViewMode;
  onChangeMode: (mode: ViewMode) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentMode, onChangeMode }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)] transition-colors">
      <div className="max-w-2xl mx-auto flex justify-between items-center px-6 py-2">
        <button
          onClick={() => onChangeMode('planning')}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all active:scale-95 min-w-[60px] ${
            currentMode === 'planning' 
              ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10' 
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <LayoutList size={22} />
          <span className="text-[9px] font-bold uppercase tracking-wide">Tasks</span>
        </button>

        <button
          onClick={() => onChangeMode('calendar')}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all active:scale-95 min-w-[60px] ${
            currentMode === 'calendar' 
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' 
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <CalendarDays size={22} />
          <span className="text-[9px] font-bold uppercase tracking-wide">Schedule</span>
        </button>

        <button
          onClick={() => onChangeMode('profile')}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all active:scale-95 min-w-[60px] ${
            currentMode === 'profile' 
              ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10' 
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <Trophy size={22} />
          <span className="text-[9px] font-bold uppercase tracking-wide">Insights</span>
        </button>

        <button
          onClick={() => onChangeMode('settings')}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all active:scale-95 min-w-[60px] ${
            currentMode === 'settings' 
              ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800' 
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <Settings size={22} />
          <span className="text-[9px] font-bold uppercase tracking-wide">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;