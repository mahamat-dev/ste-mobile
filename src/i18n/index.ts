import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';

import en from './locales/en';
import fr from './locales/fr';
import ar from './locales/ar';

const RESOURCES = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
};

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const storedLanguage = await AsyncStorage.getItem('user-language');
      if (storedLanguage) {
        return callback(storedLanguage);
      }
      // Use device locale
      const deviceLocales = Localization.getLocales();
      const bestLanguage = deviceLocales[0]?.languageCode || 'en';
      return callback(bestLanguage);
    } catch (error) {
      console.log('Error reading language', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem('user-language', language);
      
      // Handle RTL
      const isRTL = language === 'ar';
      if (isRTL !== I18nManager.isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
        // Note: In a real app, you might need to reload the app here using Updates.reloadAsync()
        // or alert the user to restart for layout changes to take full effect.
      }
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  //.use(LANGUAGE_DETECTOR as any) // Typescript issue with custom detector sometimes
  .use({
    type: 'languageDetector',
    async: true,
    detect: (cb: any) => LANGUAGE_DETECTOR.detect(cb),
    init: () => {},
    cacheUserLanguage: (lang: string) => LANGUAGE_DETECTOR.cacheUserLanguage(lang)
  })
  .use(initReactI18next)
  .init({
    resources: RESOURCES,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
