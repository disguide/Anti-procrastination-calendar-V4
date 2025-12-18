
import { useMemo } from 'react';
import { Language, TRANSLATIONS } from '../utils/translations';
import { useFocusSplitDB } from '../hooks/useFocusSplitDB';

export const useTranslation = () => {
    const { settings } = useFocusSplitDB();
    const language = (settings?.language || 'en') as Language;

    const t = useMemo(() => {
        return (key: string, params?: Record<string, string | number>) => {
            const dict = TRANSLATIONS[language] || TRANSLATIONS['en'];
            let text = dict[key] || key;
            if (params) {
                Object.entries(params).forEach(([k, v]) => {
                    text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
                });
            }
            return text;
        };
    }, [language]);

    return { t, language };
};
