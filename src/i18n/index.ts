import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import './types';
import en from './resources/en';
import id from './resources/id';

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      id: { translation: id },
      en: { translation: en },
    },
    lng: 'id',
    fallbackLng: 'id',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export default i18n;
