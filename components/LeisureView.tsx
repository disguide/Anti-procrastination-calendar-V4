import React, { CSSProperties, useState } from 'react';
import { Coffee, Plus, Trash2, Bell, Wallet, ArrowDown } from 'lucide-react';
import { SprintSettings, Alarm } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface LeisureViewProps {
    themeVars: CSSProperties;
    sprintSettings: SprintSettings;
    onUpdateSettings: (settings: SprintSettings) => void;
    onWithdraw: (amount: number) => boolean;
}

const LeisureView: React.FC<LeisureViewProps> = ({ themeVars, sprintSettings, onUpdateSettings, onWithdraw }) => {
    const { t } = useTranslation();
    const [withdrawAmount, setWithdrawAmount] = useState(15);
    const [isAddingAlarm, setIsAddingAlarm] = useState(false);
    const [newAlarmName, setNewAlarmName] = useState('');
    const [newAlarmTime, setNewAlarmTime] = useState('12:00');
    const [newAlarmDays, setNewAlarmDays] = useState<number[]>([]); // 0-6 (0=Sun)
    // Order: Mon(1), Tue(2) ... Sat(6), Sun(0)
    const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

    // --- Actions ---

    const handleWithdraw = () => {
        if (withdrawAmount <= 0) return;
        const success = onWithdraw(withdrawAmount);
        if (!success) {
            alert(t('insufficientFunds'));
        }
    };

    const addAlarm = () => {
        if (!newAlarmName.trim()) return;
        const newAlarm: Alarm = {
            id: crypto.randomUUID(),
            name: newAlarmName.trim(),
            time: newAlarmTime,
            enabled: true,
            days: newAlarmDays.length > 0 ? newAlarmDays : undefined // undefined = daily
        };
        const updated = [...(sprintSettings.alarms || []), newAlarm];
        onUpdateSettings({ ...sprintSettings, alarms: updated });
        setNewAlarmName('');
        setNewAlarmDays([]);
        setIsAddingAlarm(false);
    };

    const removeAlarm = (id: string) => {
        const updated = (sprintSettings.alarms || []).filter(a => a.id !== id);
        onUpdateSettings({ ...sprintSettings, alarms: updated });
    };

    const toggleAlarm = (id: string) => {
        const updated = (sprintSettings.alarms || []).map(a =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
        );
        onUpdateSettings({ ...sprintSettings, alarms: updated });
    };

    const toggleDay = (dayIndex: number) => {
        setNewAlarmDays(prev => {
            if (prev.includes(dayIndex)) return prev.filter(d => d !== dayIndex);
            return [...prev, dayIndex].sort();
        });
    };

    return (
        <div style={themeVars} className="h-full flex flex-col bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans overflow-hidden">

            {/* Header: Balance */}
            <div className="shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md z-10">
                <div className="flex items-center gap-2 max-w-xl mx-auto w-full">
                    <div className="p-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-xl">
                        <Coffee size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">{t('leisureMode')}</h2>
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('enjoyYourFreeTime')}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 p-6 overscroll-contain">
                <div className="max-w-xl mx-auto w-full space-y-8 pb-12">

                    {/* SECTION 1: WITHDRAW (Spending) */}
                    <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-xl text-pink-600 dark:text-pink-400">
                                    <Wallet size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t('bankBalance')}</h3>
                                    <div className="text-xs text-zinc-500 font-medium">{t('libertyMinutes')}</div>
                                </div>
                            </div>
                            <div className="text-3xl font-black text-pink-600 dark:text-pink-400 tabular-nums">
                                {(sprintSettings.libertyMinutes || 0).toFixed(0)}<span className="text-base text-zinc-400 ml-1">m</span>
                            </div>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">{t('withdraw')} / {t('spendMinutes')}</label>

                            {/* Main Input Area */}
                            <div className="flex flex-col items-center mb-2">
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1" max="360"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(Math.min(360, Math.max(1, parseInt(e.target.value) || 0)))}
                                        className="w-32 text-center text-4xl font-black text-zinc-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 tabular-nums tracking-tighter placeholder-zinc-200"
                                        placeholder="0"
                                    />
                                    <span className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-full text-lg text-zinc-400 font-bold ml-1">m</span>
                                </div>
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 border-t border-zinc-100 dark:border-zinc-800 pt-1 px-4">
                                    {withdrawAmount >= 60 ? `${Math.floor(withdrawAmount / 60)}h ${withdrawAmount % 60}m` : t('minutes')}
                                </div>
                            </div>

                            <button
                                onClick={handleWithdraw}
                                className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl shadow-lg shadow-pink-500/20 font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <ArrowDown size={20} /> {t('withdraw')}
                            </button>
                        </div>
                    </section>

                    {/* SECTION 2: ALARMS */}
                    <section>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Bell size={18} className="text-zinc-400" /> {t('alarms')}
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {(sprintSettings.alarms || []).map(alarm => (
                                <div key={alarm.id} className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all hover:border-pink-500/30">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => toggleAlarm(alarm.id)}
                                            className={`w-12 h-7 rounded-full transition-colors relative flex items-center ${alarm.enabled ? 'bg-pink-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute transition-transform ${alarm.enabled ? 'translate-x-[26px]' : 'translate-x-[2px]'}`} />
                                        </button>
                                        <div>
                                            <div className={`text-2xl font-black tabular-nums leading-none mb-1 ${alarm.enabled ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>{alarm.time}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{alarm.name}</span>
                                                <div className="flex gap-0.5">
                                                    {DAY_INDICES.map((d) => (
                                                        <span key={d} className={`text-[8px] font-bold ${(!alarm.days || alarm.days.includes(d)) ? (alarm.enabled ? 'text-pink-600 dark:text-pink-400' : 'text-zinc-400') : 'text-zinc-200 dark:text-zinc-800'}`}>
                                                            {t(`dayShort_${d}`)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeAlarm(alarm.id)}
                                        className="p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}

                            {isAddingAlarm ? (
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-4 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex gap-2">
                                        <input
                                            autoFocus placeholder={t('alarmLabelPlaceholder')}
                                            value={newAlarmName} onChange={e => setNewAlarmName(e.target.value)}
                                            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        />
                                        <input
                                            type="time" value={newAlarmTime} onChange={e => setNewAlarmTime(e.target.value)}
                                            className="w-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-2 font-bold text-sm text-center"
                                        />
                                    </div>
                                    <div className="flex justify-between gap-1">
                                        {DAY_INDICES.map((d) => {
                                            const isSelected = newAlarmDays.includes(d);
                                            return (
                                                <button key={d} onClick={() => toggleDay(d)} className={`flex-1 aspect-square rounded-lg text-xs font-bold transition-all ${isSelected ? 'bg-pink-500 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>{t(`dayShort_${d}`)}</button>
                                            )
                                        })}
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={addAlarm} className="flex-1 bg-pink-600 text-white py-2 rounded-xl font-bold text-sm">{t('save')}</button>
                                        <button onClick={() => setIsAddingAlarm(false)} className="px-4 bg-zinc-200 dark:bg-zinc-700 text-zinc-500 rounded-xl font-bold text-sm">{t('cancel')}</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setIsAddingAlarm(true)} className="w-full py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-pink-500 dark:hover:border-pink-500 text-zinc-400 hover:text-pink-500 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
                                    <Plus size={20} /> {t('addAlarm')}
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
export default LeisureView;
