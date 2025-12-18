import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelectDate }) => {
  // Helper to parse YYYY-MM-DD as local midnight for display
  const parseLocalYMD = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const [currentDate, setCurrentDate] = useState(parseLocalYMD(selectedDate));
  const [isMonthView, setIsMonthView] = useState(false);

  // Sync internal state if selectedDate changes externally
  useEffect(() => {
    setCurrentDate(parseLocalYMD(selectedDate));
  }, [selectedDate]);

  // Helpers
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    // Monday as start (1). Sunday is 0.
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    return new Date(d.setDate(diff));
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (isMonthView) {
        newDate.setMonth(newDate.getMonth() - 1);
    } else {
        newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (isMonthView) {
        newDate.setMonth(newDate.getMonth() + 1);
    } else {
        newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const renderContent = () => {
    if (isMonthView) {
        // --- Month Grid View ---
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 Sun, 1 Mon...
        
        const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        
        const days = [];
        for(let i=0; i<startOffset; i++) days.push(null);
        for(let i=1; i<=daysInMonth; i++) days.push(new Date(year, month, i));

        return (
            <div className="grid grid-cols-7 gap-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                {['M','T','W','T','F','S','S'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-zinc-500 dark:text-zinc-600 py-1">{d}</div>
                ))}
                {days.map((d, i) => {
                    if (!d) return <div key={`empty-${i}`} />;
                    
                    const dateStr = formatDate(d);
                    const isSel = dateStr === selectedDate;
                    const isToday = formatDate(new Date()) === dateStr;

                    return (
                        <button
                            key={dateStr}
                            onClick={() => {
                                onSelectDate(dateStr);
                                // setIsMonthView(false); // Optional
                            }}
                            className={`
                                h-9 w-9 mx-auto rounded-full flex items-center justify-center text-sm font-medium transition-all
                                ${isSel 
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 dark:shadow-primary-900/40' 
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
                                ${!isSel && isToday ? 'text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/30' : ''}
                            `}
                        >
                            {d.getDate()}
                        </button>
                    );
                })}
            </div>
        );
    } else {
        // --- Week Row View ---
        const start = getWeekStart(currentDate);
        const days = [];
        for(let i=0; i<7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }

        return (
             <div className="grid grid-cols-7 gap-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
                {days.map(d => {
                    const dateStr = formatDate(d);
                    const isSel = dateStr === selectedDate;
                    const isToday = formatDate(new Date()) === dateStr;
                    
                    return (
                         <button
                            key={dateStr}
                            onClick={() => onSelectDate(dateStr)}
                            className={`
                                flex flex-col items-center justify-center h-11 w-11 mx-auto rounded-full border transition-all relative overflow-hidden
                                ${isSel 
                                    ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-500/30 dark:shadow-primary-900/40 scale-105 z-10' 
                                    : 'bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}
                                ${!isSel && isToday ? 'border-primary-500/50 text-primary-600 dark:text-primary-400' : ''}
                            `}
                        >
                             <span className="text-[8px] font-bold uppercase opacity-60 leading-none mb-0.5">
                                {d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                            </span>
                            <span className={`text-sm font-bold leading-none ${isSel ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                {d.getDate()}
                            </span>
                        </button>
                    );
                })}
             </div>
        );
    }
  };

  const selectedDateObj = parseLocalYMD(selectedDate);
  const selectedDateString = selectedDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="w-full bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-900 pb-2 transition-colors">
       <div className="max-w-2xl mx-auto">
         {/* Header */}
         <div className="flex justify-between items-center px-4 py-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <button 
                    onClick={() => setIsMonthView(!isMonthView)}
                    className="group flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 px-2 py-1 rounded-lg transition-all active:scale-95 shrink-0"
                >
                    <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                        {currentDate.toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-zinc-500 text-xs font-medium pt-0.5">
                        {currentDate.getFullYear()}
                    </span>
                    <div className="text-zinc-400 dark:text-zinc-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {isMonthView ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                </button>

                {/* COMPACT DATE DISPLAY */}
                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400 truncate">
                    {selectedDateString}
                </span>
              </div>

              <div className="flex gap-1 shrink-0 ml-2">
                  <button 
                      onClick={handlePrev} 
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors active:bg-zinc-200 dark:active:bg-zinc-700"
                  >
                      <ChevronLeft size={16} />
                  </button>
                  <button 
                      onClick={handleNext} 
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors active:bg-zinc-200 dark:active:bg-zinc-700"
                  >
                      <ChevronRight size={16} />
                  </button>
              </div>
         </div>

         {/* Body */}
         <div className="px-3 min-h-[50px]">
              {renderContent()}
         </div>
       </div>
    </div>
  );
};

export default Calendar;