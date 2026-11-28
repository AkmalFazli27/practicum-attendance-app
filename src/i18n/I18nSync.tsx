import { useEffect } from 'react';

import { usePreferences } from '@/context/PreferencesContext';
import i18n from './index';

/**
 * Menyinkronkan bahasa dari PreferencesContext (milik PM) ke i18next
 * tanpa perlu mengedit PreferencesContext.tsx.
 */
export function I18nSync(): null {
  const { language } = usePreferences();

  useEffect(() => {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  return null;
}
