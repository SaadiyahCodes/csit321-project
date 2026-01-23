//src/context/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const LanguageContext = createContext();

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', flag: '🇦🇪', rtl: true },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰', rtl: true },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
];

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('gusto_language') || 'en';
  });

  // Translation cache
  const [translationCache, setTranslationCache] = useState(() => {
    const stored = localStorage.getItem('gusto_translation_cache');
    return stored ? JSON.parse(stored) : {};
  });

  const setLanguage = (code) => {
    setLanguageState(code);
    localStorage.setItem('gusto_language', code);
    
    const lang = LANGUAGES.find(l => l.code === code);
    document.documentElement.dir = lang?.rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
  };

  const currentLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const lang = LANGUAGES.find(l => l.code === language);
    document.documentElement.dir = lang?.rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, []);

  // Translation function
  const t = async (text) => {
    if (!text || language === 'en') return text;

    const cacheKey = `${language}:${text}`;
    
    // Check cache
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    // Translate
    try {
      const response = await api.post('/api/translate/text', {
        text: text,
        target_lang: language,
        source_lang: 'en'
      });

      if (response.data.success) {
        const translated = response.data.translated_text;
        
        // Update cache
        const newCache = { ...translationCache, [cacheKey]: translated };
        setTranslationCache(newCache);
        localStorage.setItem('gusto_translation_cache', JSON.stringify(newCache));
        
        return translated;
      }
    } catch (error) {
      console.error('Translation error:', error);
    }

    return text; // Fallback
  };

  // Synchronous lookup (only returns cached values)
  const tSync = (text) => {
    if (!text || language === 'en') return text;
    const cacheKey = `${language}:${text}`;
    return translationCache[cacheKey] || text;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguage,
        languages: LANGUAGES,
        isRTL: currentLanguage.rtl || false,
        t,
        tSync
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}