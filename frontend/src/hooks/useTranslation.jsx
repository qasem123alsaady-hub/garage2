import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState('ar');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('app_language');
    if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return key; // Return the key if translation not found
      }
    }
    
    return value;
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLanguage);
    localStorage.setItem('app_language', newLanguage);
  };

  const setLanguageWithSave = (lang) => {
    if (lang === 'ar' || lang === 'en') {
      setLanguage(lang);
      localStorage.setItem('app_language', lang);
    }
  };

  const isRTL = language === 'ar';

  const value = {
    language,
    t,
    toggleLanguage,
    setLanguage: setLanguageWithSave,
    isRTL
  };

  return (
    <TranslationContext.Provider value={value}>
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
