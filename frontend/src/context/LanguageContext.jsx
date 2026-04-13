//src/context/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";
import {STATIC_TRANSLATIONS} from "../utils/staticTranslations";

const LanguageContext = createContext();

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', flag: '🇦🇪', rtl: true },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰', rtl: true },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
];

const LANDING_PAGE_STRINGS = [
  "Every order is a conversation. We understand it.",
  "Restaurants",
  "About",
  "Login",
  "Loading…",
  "restaurant available",
  "restaurants available",
  "Search restaurants…",
  "No restaurants found",
  "Try a different search term",
  "About Gusto",
  "Features that make every meal safer, easier, and more delicious.",
  "Smart Voice Support",
  "Accessibility is at the table",
  "Speak with Gusto using voice and haptic feedback. Everyone deserves to navigate ordering on their own.",
  "Smart AI Chatbot",
  "Your personal food guide",
  "An AI assistant that knows every menu AND your allergen profile. Set your profile once and dine safe every time.",
  "AR Food Preview",
  "See before you eat",
  "See a life-sized photorealistic preview of your dish before ordering. Know exactly what you're getting.",
  "© 2026 Gusto · AI-powered dining",
  "Contact",
  "Fast Food", "Indian", "Chinese", "Grill", "Italian", "Japanese", "Mexican", "Seafood",
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

  const [isPreloading, setIsPreloading] = useState(false);

  const setLanguage = (code) => {
    setLanguageState(code);
    localStorage.setItem('gusto_language', code);
    
    const lang = LANGUAGES.find(l => l.code === code);
    document.documentElement.dir = lang?.rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
    preloadTranslations(code);
  };

  const currentLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    if (language !== 'en') {
      preloadTranslations(language);
    }
  }, []); // only on mount

  useEffect(() => {
    const lang = LANGUAGES.find(l => l.code === language);
    document.documentElement.dir = lang?.rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

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

  const preloadTranslations = async (targetLang) => {
    if (targetLang === 'en') return;

    // Filter out already cached strings
    const uncached = LANDING_PAGE_STRINGS.filter(text => {
      const cacheKey = `${targetLang}:${text}`;
      const hasStatic = STATIC_TRANSLATIONS[targetLang]?.[text];
      const hasCached = translationCache[cacheKey];
      return !hasStatic && !hasCached; //only send if neither static nor cached
    });

    if (uncached.length === 0) return; //nothign to translate

    setIsPreloading(true);
    try {
      const response = await api.post('/api/translate/batch-ui', {
        texts: uncached,
        target_lang: targetLang,
      });

      if (response.data.translations) {
        const newEntries = {};
        Object.entries(response.data.translations).forEach(([original, translated]) => {
          newEntries[`${targetLang}:${original}`] = translated;
        });

        const newCache = { ...translationCache, ...newEntries };
        setTranslationCache(newCache);
        localStorage.setItem('gusto_translation_cache', JSON.stringify(newCache));
      }
    } catch (err) {
      console.error('Batch preload failed:', err);
    } finally {
      setIsPreloading(false);
    }
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
        tSync,
        preloadTranslations,
        isPreloading
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