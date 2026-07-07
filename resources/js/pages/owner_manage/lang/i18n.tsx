import React, { createContext, useContext, useState } from 'react';
import en from './en.json';
import km from './km.json';
import zh from './zh.json';

type Language = 'en' | 'km' | 'zh';

const translations: Record<Language, any> = {
  en,
  km,
  zh
};

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('owner_manage_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('owner_manage_lang', lang);
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key; // Fallback to key if not found
      }
    }
    
    if (typeof value === 'string') {
      if (params) {
        let interpolated = value;
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          interpolated = interpolated.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramVal));
        });
        return interpolated;
      }
      return value;
    }
    return key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
