
import React, { useRef, useEffect } from 'react';
import { User, Globe, Palette, ChevronRight, LogOut, Shield, Moon, Sun, Settings, Sparkles, Database, History, Zap, Timer, Award, TrendingUp, Flame, Rocket, Crown } from 'lucide-react';
import { Theme, ArchiveStats } from '../types';
import { ProductivityEngine } from '../utils';

interface ParametersViewProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  archive?: ArchiveStats;
  earningRatio: number;
  onEarningRatioChange: (ratio: number) => void;
}

const THEME_PAIRS: { name: string; light: Theme; dark: Theme; lightColor: string; darkColor: string; description: string }[] = [
  { name: 'Balance', light: 'yin', dark: 'yang', lightColor: 'bg-[#FFFFFF] border-[#333333]', darkColor: 'bg-[#000000] border-[#333333]', description: 'Pure White vs. Pure Black' },
  { name: 'Nature', light: 'zen', dark: 'forest', lightColor: 'bg-[#F1F8E9] border-[#7CB342]', darkColor: 'bg-[#0F2212] border-[#2E7D32]', description: 'Pale Lime vs. Deep Pine' },
  { name: 'Ocean', light: 'seafoam', dark: 'midnight', lightColor: 'bg-[#E0F7FA] border-[#00ACC1]', darkColor: 'bg-[#020617] border-[#38BDF8]', description: 'Pale Aqua vs. Midnight Blue' },
  { name: 'Energy', light: 'sunrise', dark: 'volcano', lightColor: 'bg-[#FFF3E0] border-[#FF7043]', darkColor: 'bg-[#1A0F0F] border-[#D84315]', description: 'Soft Peach vs. Molten Ash' },
  { name: 'Royal', light: 'lavender', dark: 'galactic', lightColor: 'bg-[#F3E5F5] border-[#AB47BC]', darkColor: 'bg-[#0F0B1E] border-[#7B1FA2]', description: 'Pale Purple vs. Deep Space' },
  { name: 'Earth', light: 'dune', dark: 'espresso', lightColor: 'bg-[#FDF5E6] border-[#8D6E63]', darkColor: 'bg-[#1F1B18] border-[#6D4C41]', description: 'Old Lace vs. Dark Roast' },
  { name: 'Tech', light: 'hologram', dark: 'cyberpunk', lightColor: 'bg-[#FAFAFA] border-[#00E5FF]', darkColor: 'bg-[#050505] border-[#00FF00]', description: 'Snow White vs. Neon Terminal' },
];

const RATIO_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 50, 100];

const ParametersView: React.FC<ParametersViewProps> = ({ 
  currentTheme, 
  onThemeChange, 
  language, 
  onLanguageChange,
  darkMode,
  onToggleDarkMode,
  archive,
  earningRatio,
  onEarningRatioChange
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white pb-32 transition-colors">
        <div className="max-w-2xl mx-auto w-full">
            <div className="px-6 py-8">
                <h1 className="text-3xl font-black">Settings</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Account & Preferences</p>
            </div>

            {archive && archive.totalFocusMs > 0 && (
                <div className="px-4 mb-8">
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-900 dark:to-zinc-950 rounded-2xl p-5 border border-zinc-800 shadow-xl relative overflow-hidden group">
                        <div className="absolute right-[-20px] bottom-[-20px] text-white opacity-[0.03] group-hover:opacity-[0.07] transition-opacity"><History size={160} /></div>
                        <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Database size={14} /> Database Archive</h3>
                        <div className="flex gap-8 relative z-10">
                            <div><div className="text-2xl font-black text-white">{Math.round(archive.totalFocusMs / 3600000)}h</div><div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Legacy Focus</div></div>
                            <div className="w-px bg-zinc-700 h-10 self-center" />
                            <div><div className="text-2xl font-black text-primary-400">Active</div><div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Status</div></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="px-4 space-y-6">
                
                {/* Refined Productivity Section */}
                <section>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                        <TrendingUp size={14} className="text-primary-500" /> Focus Economy
                    </h3>
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-zinc-400">Current Level</div>
                                    <div className={`text-3xl font-black flex items-center gap-2 ${tier.color}`}>
                                        {tier.icon} {tier.label}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 mt-1">Earning power is currently 1:{earningRatio}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-primary-600 dark:text-primary-400 font-black text-4xl tabular-nums">1:{earningRatio}</div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Multiplier</div>
                                </div>
                            </div>

                            {/* Difficulty Jump Shortcuts */}
                            <div className="flex gap-2 mb-8">
                                <button 
                                    onClick={() => onEarningRatioChange(1)}
                                    className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${earningRatio === 1 ? 'bg-green-500 border-green-500 text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700'}`}
                                >
                                    <Flame size={14} /> <span className="text-[10px] font-black uppercase">Chill</span>
                                </button>
                                <button 
                                    onClick={() => onEarningRatioChange(10)}
                                    className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${earningRatio === 10 ? 'bg-orange-500 border-orange-500 text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700'}`}
                                >
                                    <Rocket size={14} /> <span className="text-[10px] font-black uppercase">Grind</span>
                                </button>
                                <button 
                                    onClick={() => onEarningRatioChange(100)}
                                    className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${earningRatio === 100 ? 'bg-pink-600 border-pink-600 text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700'}`}
                                >
                                    <Crown size={14} /> <span className="text-[10px] font-black uppercase">Legend</span>
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
                                    <span className="text-[8px] font-black text-zinc-400 uppercase">Casual</span>
                                    <span className="text-[8px] font-black text-zinc-400 uppercase">Extreme</span>
                                </div>
                            </div>

                            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent pointer-events-none opacity-50" />
                            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent pointer-events-none opacity-50" />
                        </div>
                    </div>
                </section>
                
                {/* Visual Experience */}
                <section>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2"><Sparkles size={14} /> Theme Collections</h3>
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
                                     <button onClick={() => onThemeChange(pair.light)} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all relative ${currentTheme === pair.light ? 'border-primary-500 ring-1 ring-primary-500 bg-zinc-50 dark:bg-zinc-800' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 bg-zinc-50/50 dark:bg-zinc-800/30'}`}><div className={`w-6 h-6 rounded-full border shadow-sm ${pair.lightColor}`}></div><span className={`text-xs font-bold ${currentTheme === pair.light ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-500'}`}>Light</span></button>
                                     <button onClick={() => onThemeChange(pair.dark)} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all relative ${currentTheme === pair.dark ? 'border-primary-500 ring-1 ring-primary-500 bg-zinc-50 dark:bg-zinc-800' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 bg-zinc-50/50 dark:bg-zinc-800/30'}`}><div className={`w-6 h-6 rounded-full border shadow-sm ${pair.darkColor}`}></div><span className={`text-xs font-bold ${currentTheme === pair.dark ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-500'}`}>Dark</span></button>
                                 </div>
                             </div>
                         ))}
                    </div>
                </section>

                <button className="w-full py-4 text-red-500 font-bold text-sm bg-white dark:bg-zinc-900 rounded-2xl border border-red-100 dark:border-red-900/30 hover:bg-red-50 flex items-center justify-center gap-2 transition-colors">
                    <LogOut size={16} /> Reset Database
                </button>

                <div className="text-center text-xs text-zinc-400 py-4">FocusSplit v1.3.1 • Productivity Engine v2</div>
            </div>
        </div>
    </div>
  );
};

export default ParametersView;
