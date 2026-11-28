import 'i18next';
import type { TranslationResources } from './resources/id';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    returnNull: false;
    resources: {
      translation: TranslationResources;
    };
  }
}
