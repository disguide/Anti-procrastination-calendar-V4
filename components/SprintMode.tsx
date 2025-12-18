
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Task, SprintSettings } from '../types';
import { SkipForward, CheckCircle2, RotateCcw, Coffee, EyeOff, X, Shield, ShieldAlert, PlayCircle, PiggyBank, Plus, Minus, Timer, Zap } from 'lucide-react';
import { ProductivityEngine } from '../utils';

interface SprintModeProps {
  tasks: Task[];
  settings: SprintSettings;
  onUpdateTask: (taskId: string, accumulatedTime: number, isCompleted: boolean, distractionTime: number, earnedMinutes: number) => void;
  onSprintComplete: () => void;
  onExit: () => void;
  onUpdateSettings: (settings: SprintSettings) => void;
}

interface HistorySnapshot {
  taskId: string;
  timeSpent: number;
  wasCompleted: boolean;
  timestamp: number;
  earnedMinutes?: number;
}

const formatTime = (ms: number) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor(ms / 1000 / 60 / 60);
  return `${hours > 0 ? `${hours}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const SprintMode: React.FC<SprintModeProps> = ({ tasks, settings, onUpdateTask, onSprintComplete, onExit, onUpdateSettings }) => {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    const firstIncomplete = tasks.find(t => !t.isCompleted);
    return firstIncomplete ? firstIncomplete.id : null;
  });

  const [segmentStartTime, setSegmentStartTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [distractionTotal, setDistractionTotal] = useState(0);

  const isFocusGuardActive = settings.enforceFocusGuard;
  const lastTickRef = useRef<number>(Date.now());

  // --- Break State ---
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakEndTime, setBreakEndTime] = useState<number | null>(null);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);
  const [showBreakMenu, setShowBreakMenu] = useState(false);
  const [breakAlarmEnabled] = useState(true);
  const [activeBreakIsBanked, setActiveBreakIsBanked] = useState(false);
  const [standardBreakDuration, setStandardBreakDuration] = useState(5);
  const [withdrawalAmount, setWithdrawalAmount] = useState(Math.min(5, Math.min(15, settings.timeBankMinutes || 0)) || 1);

  // --- History/Undo ---
  const [history, setHistory] = useState<HistorySnapshot[]>([]);

  const animationFrameRef = useRef<number>(0);
  const breakIntervalRef = useRef<number>(0);
  const alarmLoopRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const incomplete = tasks.filter(t => !t.isCompleted);
    if (incomplete.length === 0) {
      const timer = setTimeout(() => onSprintComplete(), 100);
      return () => clearTimeout(timer);
    }
    if (!activeTaskId || !tasks.find(t => t.id === activeTaskId && !t.isCompleted)) {
      if (incomplete.length > 0) setActiveTaskId(incomplete[0].id);
    }
  }, [tasks, activeTaskId, onSprintComplete]);

  useEffect(() => {
    if (!isFocusGuardActive || settings.allowedApps.length > 0) {
      if (isPaused) {
        setIsPaused(false);
        const now = Date.now();
        setSegmentStartTime(now - elapsed);
        lastTickRef.current = now;
      }
      return;
    }
    const handleVisibilityChange = () => {
      if (document.hidden) setIsPaused(true);
      else {
        setIsPaused(false);
        const now = Date.now();
        const gap = now - lastTickRef.current;
        if (gap > 1000) {
          setDistractionTotal(prev => prev + gap);
          setSegmentStartTime(prev => prev + gap);
        }
        lastTickRef.current = now;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isFocusGuardActive, settings.allowedApps, isPaused, elapsed]);

  const updateTimer = useCallback(() => {
    if (isPaused || isOnBreak) return;
    const now = Date.now();
    lastTickRef.current = now;
    setElapsed(now - segmentStartTime);
    animationFrameRef.current = requestAnimationFrame(updateTimer);
  }, [isPaused, isOnBreak, segmentStartTime]);

  useEffect(() => {
    if (!isPaused && !isOnBreak) animationFrameRef.current = requestAnimationFrame(updateTimer);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPaused, isOnBreak, updateTimer]);

  useEffect(() => {
    if (isOnBreak && breakEndTime) {
      if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
      const remaining = Math.max(0, breakEndTime - Date.now());
      setBreakTimeRemaining(remaining);
      breakIntervalRef.current = window.setInterval(() => {
        const timeLeft = Math.max(0, breakEndTime - Date.now());
        setBreakTimeRemaining(timeLeft);
        if (timeLeft <= 0 && breakAlarmEnabled) startPersistentAlarm();
      }, 200);
    }
    return () => clearInterval(breakIntervalRef.current);
  }, [isOnBreak, breakEndTime, breakAlarmEnabled]);

  const initAudio = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  const playBeep = () => {
    const ctx = initAudio();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.3);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  };

  const startPersistentAlarm = () => {
    if (alarmLoopRef.current) return;
    playBeep();
    alarmLoopRef.current = window.setInterval(playBeep, 1500);
  };

  const stopPersistentAlarm = () => {
    if (alarmLoopRef.current) {
      clearInterval(alarmLoopRef.current);
      alarmLoopRef.current = null;
    }
  };

  const commitTask = (taskId: string, time: number, completed: boolean) => {
    const earned = ProductivityEngine.calculateEarnings(time, settings.earningRatio || 5);
    if (earned > 0) {
      const newBank = Math.round((settings.timeBankMinutes + earned) * 100) / 100;
      onUpdateSettings({ ...settings, timeBankMinutes: newBank });
    }
    const snapshot: HistorySnapshot = {
      taskId, timeSpent: time, wasCompleted: completed, timestamp: Date.now(), earnedMinutes: earned
    };
    setHistory(prev => [...prev, snapshot]);
    onUpdateTask(taskId, time, completed, distractionTotal, earned);
    setDistractionTotal(0);
  };

  const startBreak = (durationMinutes: number, useBank: boolean = false) => {
    if (durationMinutes <= 0) return;
    if (useBank) {
      if (durationMinutes > settings.timeBankMinutes) return;
      onUpdateSettings({ ...settings, timeBankMinutes: Math.round((settings.timeBankMinutes - durationMinutes) * 100) / 100 });
      setActiveBreakIsBanked(true);
    } else setActiveBreakIsBanked(false);
    initAudio();
    setIsOnBreak(true);
    const durationMs = durationMinutes * 60 * 1000;
    setBreakEndTime(Date.now() + durationMs);
    setBreakTimeRemaining(durationMs);
    setShowBreakMenu(false);
  };

  const endBreak = () => {
    if (isOnBreak && activeBreakIsBanked && breakEndTime) {
      const unusedMinutes = Math.max(0, breakTimeRemaining / 60000);
      if (unusedMinutes > 0) {
        onUpdateSettings({ ...settings, timeBankMinutes: Math.round((settings.timeBankMinutes + unusedMinutes) * 100) / 100 });
      }
      setActiveBreakIsBanked(false);
    }
    stopPersistentAlarm();
    setIsOnBreak(false);
    setBreakEndTime(null);
    setSegmentStartTime(Date.now());
    lastTickRef.current = Date.now();
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    const earnedToReverse = lastAction.earnedMinutes || 0;
    onUpdateTask(lastAction.taskId, -lastAction.timeSpent, false, 0, -earnedToReverse);
    if (earnedToReverse > 0) {
      onUpdateSettings({ ...settings, timeBankMinutes: Math.round((settings.timeBankMinutes - earnedToReverse) * 100) / 100 });
    }
    setActiveTaskId(lastAction.taskId);
    setElapsed(0);
    setSegmentStartTime(Date.now());
    lastTickRef.current = Date.now();
    setHistory(prev => prev.slice(0, -1));
    stopPersistentAlarm();
    setIsOnBreak(false);
    setBreakEndTime(null);
  };

  const handleSplit = () => {
    if (!activeTaskId) return;
    commitTask(activeTaskId, elapsed, false);
    setElapsed(0);
    setSegmentStartTime(Date.now());
    lastTickRef.current = Date.now();
    rotateTask();
  };

  const handleComplete = () => {
    if (!activeTaskId) return;
    commitTask(activeTaskId, elapsed, true);
    setElapsed(0);
    setSegmentStartTime(Date.now());
    lastTickRef.current = Date.now();
    const remaining = tasks.filter(t => !t.isCompleted && t.id !== activeTaskId);
    if (remaining.length === 0) onSprintComplete();
    else rotateTask();
  };

  const rotateTask = () => {
    const allIncomplete = tasks.filter(t => !t.isCompleted);
    if (allIncomplete.length === 0) return;
    const currentIndex = allIncomplete.findIndex(t => t.id === activeTaskId);
    const nextTask = allIncomplete[(currentIndex + 1) % allIncomplete.length];
    if (nextTask) setActiveTaskId(nextTask.id);
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white relative overflow-hidden transition-colors">
      <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r transition-colors duration-500 ${isOnBreak ? 'from-green-500 to-emerald-500' : 'from-primary-500 to-primary-800'}`} />

      {/* Exit Button Removed per "Anti-procrastination" spec: Users must complete tasks or close tab. */}

      <div className="max-w-2xl mx-auto w-full h-full flex flex-col p-6 relative z-10 pt-16">
        {isOnBreak && (
          <div className="absolute inset-0 z-50 bg-white/95 dark:bg-black/95 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300 rounded-2xl">
            <Coffee size={64} className="text-green-500 mb-6" />
            <h2 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">Take a Breather</h2>
            {activeBreakIsBanked && <div className="mb-6 flex items-center gap-2 text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide animate-pulse"><PiggyBank size={14} /> Time Bank Active</div>}
            <div className={`text-8xl font-mono font-black mb-12 tabular-nums transition-colors ${breakTimeRemaining <= 0 ? 'text-red-500 animate-pulse' : 'text-zinc-900 dark:text-white'}`}>{formatTime(Math.max(0, breakTimeRemaining))}</div>
            <button onClick={endBreak} className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-8 py-4 rounded-xl font-bold text-lg transition-all active:scale-95">{activeBreakIsBanked ? "Stop & Refund Remaining" : "Skip Break"}</button>
          </div>
        )}

        {showBreakMenu && (
          <div className="absolute inset-0 z-40 bg-zinc-200/50 dark:bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm rounded-2xl">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2"><Coffee className="text-green-500" size={20} /> Break Dashboard</h3>
                <button onClick={() => setShowBreakMenu(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1"><X size={20} /></button>
              </div>
              <div className="overflow-y-auto p-4 space-y-6">
                {/* CUSTOM PRESET BREAK (FROM SETTINGS) */}
                {settings.customBreakMinutes > 0 && (
                  <div>
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Preset Break</div>
                    <button
                      onClick={() => startBreak(settings.customBreakMinutes, true)}
                      disabled={settings.customBreakMinutes > settings.timeBankMinutes}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all active:scale-95 ${settings.customBreakMinutes > settings.timeBankMinutes ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 opacity-50 cursor-not-allowed' : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${settings.customBreakMinutes > settings.timeBankMinutes ? 'bg-zinc-200 text-zinc-400' : 'bg-primary-500 text-white'}`}><Timer size={20} /></div>
                        <div className="text-left">
                          <div className="font-black text-zinc-900 dark:text-white">{settings.customBreakMinutes}m Custom</div>
                          <div className="text-[10px] uppercase font-bold text-zinc-400">Fixed duration</div>
                        </div>
                      </div>
                      {settings.customBreakMinutes > settings.timeBankMinutes && <ShieldAlert size={16} className="text-red-500" />}
                    </button>
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Quick Adjust Break</div>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
                    <div className="text-center mb-4"><div className="text-3xl font-black text-zinc-900 dark:text-white">{standardBreakDuration}<span className="text-sm font-medium text-zinc-500 ml-1">min</span></div></div>
                    <input type="range" min="1" max="15" value={standardBreakDuration} onChange={(e) => setStandardBreakDuration(parseInt(e.target.value))} className="w-full accent-primary-500 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer mb-4" />
                    <button onClick={() => startBreak(standardBreakDuration, true)} disabled={standardBreakDuration > settings.timeBankMinutes} className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">{standardBreakDuration > settings.timeBankMinutes ? <><ShieldAlert size={18} /> Insufficient Bank</> : `Start ${standardBreakDuration}m Break`}</button>
                  </div>
                </div>

                <div className={`rounded-xl border-2 p-4 transition-all ${settings.timeBankMinutes > 0 ? 'border-pink-200 dark:border-pink-900 bg-pink-50/50 dark:bg-pink-900/10' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 opacity-80'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 mb-1 flex items-center gap-1"><PiggyBank size={14} /> Time Bank</div>
                      <div className="text-3xl font-black text-zinc-900 dark:text-white">{ProductivityEngine.formatBank(settings.timeBankMinutes)}<span className="text-sm font-medium text-zinc-500 ml-1">min</span></div>
                    </div>
                  </div>
                  {settings.timeBankMinutes > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setWithdrawalAmount(prev => Math.max(1, prev - 1))} className="p-2 bg-white dark:bg-black rounded-lg border border-pink-200 dark:border-pink-800 hover:border-pink-400 text-pink-700 dark:text-pink-300"><Minus size={16} /></button>
                        <div className="flex-1 text-center"><div className="text-xl font-bold text-pink-700 dark:text-pink-300">{withdrawalAmount}m</div></div>
                        <button onClick={() => setWithdrawalAmount(prev => Math.min(Math.min(15, settings.timeBankMinutes), prev + 1))} className="p-2 bg-white dark:bg-black rounded-lg border border-pink-200 dark:border-pink-800 hover:border-pink-400 text-pink-700 dark:text-pink-300"><Plus size={16} /></button>
                      </div>
                      <button onClick={() => startBreak(withdrawalAmount, true)} className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl shadow-md shadow-pink-500/20 transition-all">Withdraw & Start Break</button>
                    </div>
                  ) : <div className="text-center py-2 text-sm text-zinc-400 italic">Bank is empty.</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8 shrink-0">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${isFocusGuardActive ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200' : 'bg-zinc-100 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300 border-zinc-200'}`}>{isFocusGuardActive ? <><Shield size={14} /> Guard On</> : <><PlayCircle size={14} /> Background</>}</div>
          <div className="flex items-center gap-4">
            {history.length > 0 && <button onClick={handleUndo} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 text-sm"><RotateCcw size={14} /> Undo</button>}
            {settings.enableBreaks && !isOnBreak && <button onClick={() => setShowBreakMenu(true)} className="text-zinc-500 hover:text-green-600 dark:hover:text-green-400 flex items-center gap-1 text-sm transition-colors"><Coffee size={14} /> Break</button>}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center z-10 min-h-0">
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 max-w-full truncate px-4">{activeTask?.title || "Focus Split"}</h1>

          {isPaused && (
            <div className="mt-8 bg-yellow-100 dark:bg-yellow-900/90 text-yellow-800 dark:text-yellow-200 px-6 py-3 rounded-full flex items-center gap-2 border border-yellow-300 animate-pulse">
              <EyeOff size={20} /> Timer Paused
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-12 mb-8 shrink-0">
          <button onClick={handleSplit} className="group relative flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-900 dark:text-white p-6 md:p-8 rounded-2xl transition-all shadow-sm">
            <SkipForward size={24} className="text-primary-600 md:w-8 md:h-8" />
            <div className="text-left"><div className="font-bold text-lg md:text-xl">Split Task</div><div className="text-xs text-zinc-500">Rotate & Accumulate</div></div>
          </button>
          <button onClick={handleComplete} className="group relative flex items-center justify-center gap-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-950/50 border border-green-200 dark:border-green-900/50 hover:border-green-400 text-green-900 dark:text-white p-6 md:p-8 rounded-2xl transition-all">
            <CheckCircle2 size={24} className="text-green-600 md:w-8 md:h-8" />
            <div className="text-left"><div className="font-bold text-lg md:text-xl">Complete</div><div className="text-xs text-green-700/60">Mark Done & Next</div></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SprintMode;
