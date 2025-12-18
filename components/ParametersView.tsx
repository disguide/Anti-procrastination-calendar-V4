import React, { useRef, useEffect, useState } from 'react';
import { User, Globe, Palette, ChevronRight, LogOut, Shield, Moon, Sun, Settings, Sparkles, Database, History, Zap, Timer, Award, TrendingUp, Flame, Rocket, Crown, ShieldAlert, ShieldCheck, X, Coffee, PiggyBank, Languages, Settings2 } from 'lucide-react';
import { Theme, ArchiveStats, SprintSettings, Language } from '../types';
import { ProductivityEngine } from '../utils';
import { useTranslation } from '../hooks/useTranslation';

interface ParametersViewProps {
    currentTheme: Theme;
    onThemeChange: (t: Theme) => void;
    darkMode: boolean;
    onToggleDarkMode: () => void;
    archive?: ArchiveStats;
    onReset: () => void;
    earningRatio: number;
    onEarningRatioChange: (ratio: number) => void;
    sprintSettings: SprintSettings;
    onUpdateSettings: (settings: SprintSettings) => void;
    onPruneData: () => void;
}

const THEME_PAIRS: { name: string; light: Theme; dark: Theme; lightColor: string; darkColor: string; description: string }[] = [
    { name: 'Yin & Yang', light: 'yin', dark: 'yang', lightColor: 'bg-zinc-100', darkColor: 'bg-zinc-900', description: 'Classic Monochrome' },
    { name: 'Zen Garden', light: 'zen', dark: 'forest', lightColor: 'bg-green-100', darkColor: 'bg-green-900', description: 'Nature Inspired' },
    { name: 'Oceanic', light: 'seafoam', dark: 'midnight', lightColor: 'bg-cyan-100', darkColor: 'bg-slate-900', description: 'Calm Waters' },
    { name: 'Solar', light: 'sunrise', dark: 'volcano', lightColor: 'bg-orange-100', darkColor: 'bg-red-900', description: 'Warm Energy' },
    { name: 'Neon', light: 'lavender', dark: 'galactic', lightColor: 'bg-purple-100', darkColor: 'bg-indigo-900', description: 'Vibrant & Deep' },
    { name: 'Dune', light: 'dune', dark: 'espresso', lightColor: 'bg-amber-100', darkColor: 'bg-stone-900', description: 'Earthy Tones' },
    { name: 'Cyberpunk', light: 'hologram', dark: 'cyberpunk', lightColor: 'bg-blue-100', darkColor: 'bg-yellow-900', description: 'High Tech' },
];

const RATIO_OPTIONS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

const ParametersView: React.FC<ParametersViewProps> = ({
    currentTheme,
    onThemeChange,
    darkMode,
    onToggleDarkMode,
    archive,
    earningRatio,
    onEarningRatioChange,
    sprintSettings,
    onUpdateSettings,
    onPruneData,
    onReset
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [newAllowedApp, setNewAllowedApp] = useState('');
    const { t } = useTranslation();

    const addAllowedApp = () => {
        if (newAllowedApp.trim()) {
            onUpdateSettings({ ...sprintSettings, allowedApps: [...sprintSettings.allowedApps, newAllowedApp.trim()] });
            setNewAllowedApp('');
        }
    };

    const scrollToActive = () => {
        if (scrollRef.current) {
            const activeItem = scrollRef.current.querySelector('[data-active="true"]');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    };

    useEffect(() => {
        scrollToActive();
    }, [earningRatio]);

    const tier = ProductivityEngine.getTierInfo(earningRatio);

    return (
        <div className="h-full flex flex-col bg-zinc-50 dark:bg-black/50 backdrop-blur-3xl transition-colors overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl">
                        <Settings2 size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">{t('parameters')}</h2>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('systemConfiguration')}</p>
                    </div>
                </div>
                <button onClick={onToggleDarkMode} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="px-4 space-y-6 py-6">

                    {archive && archive.totalFocusMs > 0 && (
                        <div className="px-0 mb-8">
                            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-900 dark:to-zinc-950 rounded-2xl p-5 border border-zinc-800 shadow-xl relative overflow-hidden group">
                                <div className="absolute right-[-22px] bottom-[-22px] text-white opacity-[0.03] group-hover:opacity-[0.07] transition-opacity"><History size={160} /></div>
                                <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Database size={14} /> {t('databaseArchive')}</h3>
                                <div className="flex gap-8 relative z-10">
                                    <div><div className="text-2xl font-black text-white">{Math.round(archive.totalFocusMs / 3600000)}h</div><div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">{t('legacyFocus')}</div></div>
                                    <div className="w-px bg-zinc-700 h-10 self-center" />
                                    <div><div className="text-2xl font-black text-primary-400">{t('active')}</div><div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">{t('status')}</div></div>
                                </div>
                            </div>
                        </div>
                    )}



                    {/* System Health & Config */}
                    <section>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                            <Settings size={14} /> {t('systemConfiguration')}
                        </h3>
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm p-4 space-y-4">

                            {/* Focus Guard */}
                            <div>
                                <div className="flex items-center justify-between p-2">
                                    <label className="text-sm font-semibold flex items-center gap-2 text-zinc-700 dark:text-zinc-300"><ShieldAlert size={16} className="text-red-500" />{t('enforceFocusGuard')}</label>
                                    <input type="checkbox" checked={sprintSettings.enforceFocusGuard} onChange={e => onUpdateSettings({ ...sprintSettings, enforceFocusGuard: e.target.checked })} className="accent-red-500 h-5 w-5" />
                                </div>
                                {sprintSettings.enforceFocusGuard && (
                                    <div className="mt-2 text-xs text-zinc-500 px-2 pb-2">
                                        {t('focusGuardDescription')}
                                    </div>
                                )}
                                {sprintSettings.enforceFocusGuard && (
                                    <div className="mt-2 pl-4 border-l-2 border-red-200 dark:border-red-900/50 animate-in slide-in-from-top-2 fade-in">
                                        <input type="text" value={newAllowedApp} onChange={(e) => setNewAllowedApp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addAllowedApp()} placeholder="Add exception..." className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 mb-2" />
                                        <div className="flex flex-wrap gap-2">{sprintSettings.allowedApps.map((app, idx) => (<span key={idx} className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">{app}<button onClick={() => onUpdateSettings({ ...sprintSettings, allowedApps: sprintSettings.allowedApps.filter(a => a !== app) })}><X size={12} /></button></span>))}</div>
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                            {/* Break System */}
                            <div>
                                <div className="flex items-center justify-between p-2">
                                    <label className="text-sm font-bold flex items-center gap-2"><Coffee size={16} className="text-orange-500" /> {t('enableBreaks')}</label>
                                    <input type="checkbox" checked={sprintSettings.enableBreaks} onChange={e => onUpdateSettings({ ...sprintSettings, enableBreaks: e.target.checked })} className="accent-primary-500 h-5 w-5" />
                                </div>
                                {sprintSettings.enableBreaks && (
                                    <div className="pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-4 mt-2">
                                        <div className="flex items-center justify-between p-2">
                                            <label className="text-sm flex items-center gap-2 text-zinc-600 dark:text-zinc-400">{t('customBreak')}</label>
                                            <input type="number" min="1" max="120" value={sprintSettings.customBreakMinutes === 0 ? '' : sprintSettings.customBreakMinutes} onChange={e => onUpdateSettings({ ...sprintSettings, customBreakMinutes: parseInt(e.target.value) || 0 })} className="bg-zinc-100 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded p-1 w-16 text-center text-sm font-bold" />
                                        </div>
                                        <div className="flex items-center justify-between p-2">
                                            <label className="text-sm flex items-center gap-2 text-zinc-600 dark:text-zinc-400"><PiggyBank size={14} className="text-pink-500" />{t('timeBankBalance')}</label>
                                            <div className="bg-pink-50 dark:bg-pink-950/20 px-3 py-1 rounded-lg text-sm font-bold text-pink-700 dark:text-pink-400">{sprintSettings.timeBankMinutes.toFixed(2)} min</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Refined Productivity Section */}
                    <section>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                            <TrendingUp size={14} className="text-primary-500" /> {t('focusEconomy')}
                        </h3>
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-zinc-400">{t('currentLevel')}</div>
                                        <div className={`text-3xl font-black flex items-center gap-2 ${tier.color}`}>
                                            {tier.icon} {tier.label}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 mt-1">{t('earningPowerDescription', { ratio: earningRatio })}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-primary-600 dark:text-primary-400 font-black text-4xl tabular-nums">1:{earningRatio}</div>
                                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('multiplier')}</div>
                                    </div>
                                </div>

                                {/* Difficulty Jump Shortcuts */}
                                <div className="flex gap-2 mb-8">
                                    <button
                                        onClick={() => onEarningRatioChange(1)}
                                        className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${earningRatio === 1 ? 'bg-green-500 border-green-500 text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700'}`}
                                    >
                                        <Flame size={14} /> <span className="text-[10px] font-black uppercase">{t('chill')}</span>
                                    </button>
                                    <button
                                        onClick={() => onEarningRatioChange(10)}
                                        className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${earningRatio === 10 ? 'bg-orange-500 border-orange-500 text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700'}`}
                                    >
                                        <Rocket size={14} /> <span className="text-[10px] font-black uppercase">{t('grind')}</span>
                                    </button>
                                    <button
                                        onClick={() => onEarningRatioChange(100)}
                                        className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${earningRatio === 100 ? 'bg-pink-600 border-pink-600 text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700'}`}
                                    >
                                        <Crown size={14} /> <span className="text-[10px] font-black uppercase">{t('legend')}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Scroll Well Selector */}
                            <div className="relative bg-zinc-50/50 dark:bg-zinc-950/50 pt-2 pb-6 border-t border-zinc-100 dark:border-zinc-800">
                                <div
                                    ref={scrollRef}
                                    className="flex gap-3 overflow-x-auto px-6 py-4 no-scrollbar snap-x snap-mandatory scroll-smooth"
                                    style={{ WebkitOverflowScrolling: 'touch' }}
                                >
                                    {RATIO_OPTIONS.map((val) => {
                                        const isActive = earningRatio === val;
                                        const valTier = ProductivityEngine.getTierInfo(val);
                                        const isElite = val >= 25;

                                        return (
                                            <button
                                                key={val}
                                                data-active={isActive}
                                                onClick={() => onEarningRatioChange(val)}
                                                className={`
                                                snap-center shrink-0 w-20 h-24 rounded-2xl flex flex-col items-center justify-center transition-all border-2 relative
                                                ${isActive
                                                        ? 'bg-white dark:bg-zinc-800 border-primary-500 text-zinc-900 dark:text-white shadow-xl -translate-y-2 ring-4 ring-primary-500/10'
                                                        : 'bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}
                                            `}
                                            >
                                                <span className={`text-[10px] font-black leading-none mb-1 ${isActive ? 'text-primary-500' : 'text-zinc-400'}`}>1:</span>
                                                <span className={`text-2xl font-black leading-none ${isActive ? 'text-zinc-900 dark:text-white' : ''}`}>{val}</span>
                                                <span className={`text-[8px] mt-3 font-black uppercase tracking-tighter ${isActive ? valTier.color : 'text-zinc-500'}`}>{valTier.label}</span>

                                                {isElite && (
                                                    <div className={`absolute top-2 right-2 ${isActive ? 'text-primary-500' : 'text-zinc-600'}`}>
                                                        <Award size={12} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Spectrum Bar indicator */}
                                <div className="px-8 mt-2">
                                    <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full relative overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 via-orange-500 to-pink-600 transition-all duration-500 rounded-full"
                                            style={{ width: `${Math.min(100, (earningRatio / 100) * 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2 px-1">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase">{t('casual')}</span>
                                        <span className="text-[8px] font-black text-zinc-400 uppercase">{t('extreme')}</span>
                                    </div>
                                </div>

                                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent pointer-events-none opacity-50" />
                                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent pointer-events-none opacity-50" />
                            </div>
                        </div>
                    </section>

                    {/* Visual Experience */}
                    <section>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2"><Sparkles size={14} /> {t('themeCollections')}</h3>
                        <div className="space-y-4">
                            {THEME_PAIRS.map((pair) => (
                                <div key={pair.name} className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
                                    <div className="flex justify-between items-center mb-3 px-1">
                                        <div>
                                            <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{pair.name}</div>
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">{pair.description}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => onThemeChange(pair.light)} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all relative ${currentTheme === pair.light ? 'border-primary-500 ring-1 ring-primary-500 bg-zinc-50 dark:bg-zinc-800' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 bg-zinc-50/50 dark:bg-zinc-800/30'}`}><div className={`w-6 h-6 rounded-full border shadow-sm ${pair.lightColor}`}></div><span className={`text-xs font-bold ${currentTheme === pair.light ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-500'}`}>{t('light')}</span></button>
                                        <button onClick={() => onThemeChange(pair.dark)} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all relative ${currentTheme === pair.dark ? 'border-primary-500 ring-1 ring-primary-500 bg-zinc-50 dark:bg-zinc-800' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 bg-zinc-50/50 dark:bg-zinc-800/30'}`}><div className={`w-6 h-6 rounded-full border shadow-sm ${pair.darkColor}`}></div><span className={`text-xs font-bold ${currentTheme === pair.dark ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-500'}`}>{t('dark')}</span></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <button
                        onClick={onReset}
                        className="w-full py-4 text-red-500 font-bold text-sm bg-white dark:bg-zinc-900 rounded-2xl border border-red-100 dark:border-red-900/30 hover:bg-red-50 flex items-center justify-center gap-2 transition-colors">
                        <LogOut size={16} /> {t('resetDatabase')}
                    </button>

                    {/* Storage Management (Moved to Bottom) */}
                    <section>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                            <Database size={14} /> {t('storageHealth')}
                        </h3>
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm p-4 space-y-4">
                            <div className="flex items-center justify-between p-2">
                                <label className="text-sm font-semibold flex items-center gap-2 text-zinc-400">{t('databaseStatus')}</label>
                                <span className="text-xs font-bold text-green-500 uppercase flex items-center gap-1"><ShieldCheck size={12} /> {t('optimized')}</span>
                            </div>
                            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
                            <div className="p-2">
                                <div className="text-xs text-zinc-500 mb-3">
                                    {t('pruneDataDescription')}
                                </div>
                                <button
                                    onClick={onPruneData}
                                    className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Database size={12} /> {t('disposeTasks')}
                                </button>
                            </div>
                        </div>

                    </section>

                    {/* Language Selector (Moved to Bottom) */}
                    <section>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                            <Globe size={14} /> {t('language')}
                        </h3>
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm p-2 flex gap-2">
                            {(['en', 'fr', 'es'] as Language[]).map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => onUpdateSettings({ ...sprintSettings, language: lang })}
                                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-xl transition-all ${sprintSettings.language === lang || (!sprintSettings.language && lang === 'en') ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-md' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                                >
                                    {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'Español'}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
                <div className="text-center text-xs text-zinc-400 py-4">FocusSplit v1.3.1 • Productivity Engine v2</div>
            </div >
        </div >
    );
};

export default ParametersView;
