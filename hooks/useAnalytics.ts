
import { useMemo, useState } from 'react';
import { Task, WorkLog } from '../types';

export type TimeRange = 'week' | 'month' | 'year' | 'all';

export const useAnalytics = (tasks: Task[], workLogs: WorkLog[]) => {
    const [range, setRange] = useState<TimeRange>('week');

    const filteredData = useMemo(() => {
        const now = new Date();
        const startOfRange = new Date();
        startOfRange.setHours(0, 0, 0, 0);

        if (range === 'week') startOfRange.setDate(now.getDate() - 7);
        if (range === 'month') startOfRange.setMonth(now.getMonth() - 1);
        if (range === 'year') startOfRange.setFullYear(now.getFullYear() - 1);
        if (range === 'all') startOfRange.setFullYear(2000); // effectively all time

        const rangeLogs = workLogs.filter(log => new Date(log.date) >= startOfRange);
        const rangeTasks = tasks.filter(task => {
            if (task.completionDate) return new Date(task.completionDate) >= startOfRange;
            return false; // Only completed tasks count for "Tasks Completed" in filtering usually? 
            // Or maybe created date? Usually "Performance" implies what happened in that window.
            // Let's use completionDate for tasks.
        });

        // Calculate Totals
        const totalFocusTime = rangeLogs.reduce((acc, log) => acc + log.duration, 0);
        const tasksCompleted = rangeTasks.length;

        // Activity over time (e.g., daily totals for bar chart)
        const activityMap = new Map<string, number>();
        rangeLogs.forEach(log => {
            // log.date is YYYY-MM-DD
            const current = activityMap.get(log.date) || 0;
            activityMap.set(log.date, current + log.duration);
        });

        // Fill in missing days for cleaner charts if range is small
        const activityData = [];
        const daysToFill = range === 'week' ? 7 : range === 'month' ? 30 : 0;

        if (daysToFill > 0) {
            for (let i = daysToFill - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                activityData.push({
                    date: dateStr,
                    minutes: Math.round((activityMap.get(dateStr) || 0) / 60000)
                });
            }
        } else {
            // For year/all, maybe group by month? For now, list all active days or just last 30?
            // Let's stick to raw map converted to array for larger ranges or assume the chart handles it.
            // Actually for "all", sorting by date is good.
            Array.from(activityMap.keys()).sort().forEach(date => {
                activityData.push({
                    date,
                    minutes: Math.round((activityMap.get(date) || 0) / 60000)
                });
            });
        }

        // Tag Distribution
        const tagMap = new Map<string, number>();
        rangeLogs.forEach(log => {
            const task = tasks.find(t => t.id === log.taskId); // This might be slow if tasks array is huge but ok for prototype
            // If task is deleted, we might miss tags. 
            // In a real app we'd snapshot tags in workLog.
            // For now, look up task.
            if (task && task.tags) {
                task.tags.forEach(tag => {
                    tagMap.set(tag, (tagMap.get(tag) || 0) + log.duration);
                });
            } else {
                tagMap.set('uncategorized', (tagMap.get('uncategorized') || 0) + log.duration);
            }
        });

        const categoryData = Array.from(tagMap.entries()).map(([name, value]) => ({
            name,
            value: Math.round(value / 60000)
        })).sort((a, b) => b.value - a.value);

        return {
            totalFocusTime,
            tasksCompleted,
            activityData,
            categoryData
        };
    }, [tasks, workLogs, range]);

    // Streak Calculation (All Time)
    const streak = useMemo(() => {
        // Simple daily streak
        const sortedDates = Array.from(new Set(workLogs.map(l => l.date))).sort();
        if (sortedDates.length === 0) return { current: 0, best: 0 };

        let current = 0;
        let best = 0;
        let tempCurrent = 0;

        // Iterate and find consecutive days
        // This relies on YYYY-MM-DD string comparison which words for "consecutive"? 
        // No, need date objects.

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Convert to timestamps for easier diff
        const stamps = sortedDates.map(d => new Date(d).getTime());

        if (stamps.length > 0) {
            tempCurrent = 1;
            best = 1;
            for (let i = 1; i < stamps.length; i++) {
                const diff = (stamps[i] - stamps[i - 1]) / (1000 * 60 * 60 * 24);
                if (Math.abs(diff - 1) < 0.1) { // approx 1 day
                    tempCurrent++;
                } else {
                    best = Math.max(best, tempCurrent);
                    tempCurrent = 1;
                }
            }
            best = Math.max(best, tempCurrent);
        }

        // Check if streak is active (logged today or yesterday)
        const lastLog = sortedDates[sortedDates.length - 1];
        const isLive = lastLog === today || lastLog === yesterday;
        current = isLive ? tempCurrent : 0;
        // Wait, tempCurrent is the streak of the LAST run. 
        // If !isLive, we might have reset.

        return { current, best };
    }, [workLogs]);

    return {
        range,
        setRange,
        ...filteredData,
        streak
    };
};
