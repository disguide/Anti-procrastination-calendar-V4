

/**
 * Returns today's date in YYYY-MM-DD format based on local time.
 */
export const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converts a Date object to YYYY-MM-DD format.
 */
export const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  // Fix: replaced undefined variable 'd' with parameter 'date'
  const month = String(date.getMonth() + 1).padStart(2, '0');
  // Fix: replaced undefined variable 'd' with parameter 'date'
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Productivity Engine: Centralized math for the Split Earning mechanic.
 */
export const ProductivityEngine = {
  /**
   * Calculates earned break minutes based on ms worked and the selected ratio.
   * Standardizes precision to 2 decimal places to prevent float drift.
   */
  calculateEarnings: (msWorked: number, ratio: number): number => {
    if (msWorked <= 0 || ratio <= 0) return 0;
    const minutesWorked = msWorked / 60000;
    const earned = minutesWorked / ratio;
    return Math.round(earned * 100) / 100;
  },

  /**
   * Formats a bank balance for display (e.g., 4.25m)
   */
  formatBank: (minutes: number): string => {
    return minutes.toFixed(2);
  },

  /**
   * Get metadata for the ratio tiers
   */
  getTierInfo: (ratio: number) => {
    if (ratio === 1) return { label: "Casual", color: "text-green-500", icon: "🌱" };
    if (ratio <= 5) return { label: "Balanced", color: "text-blue-500", icon: "⚖️" };
    if (ratio <= 10) return { label: "Grind", color: "text-orange-500", icon: "🔥" };
    if (ratio <= 25) return { label: "Elite", color: "text-purple-500", icon: "🏆" };
    if (ratio <= 50) return { label: "Hardcore", color: "text-red-500", icon: "💀" };
    return { label: "God Mode", color: "text-pink-500", icon: "👑" };
  }
};

/**
 * Parses a YYYY-MM-DD string into a Date object at local midnight.
 */
export const parseLocalYMD = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Generates a consistent Tailwind color class for a given tag string.
 */
export const getTagColor = (tag: string): string => {
  const colors = [
    'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
    'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
