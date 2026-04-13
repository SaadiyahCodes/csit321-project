//src/components/TranslatedText.jsx
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Static translations for demo — Arabic and Hindi only
// These are guaranteed to work with no API calls
import {STATIC_TRANSLATIONS} from "../utils/staticTranslations";

export default function TranslatedText({ children }) {
  const { t, tSync, language, isPreloading } = useLanguage();
  const [translated, setTranslated] = useState(() => {
    // Initialize with static or cached value immediately
    if (typeof children !== 'string') return children;
    if (language === 'en') return children;
    return STATIC_TRANSLATIONS[language]?.[children] || tSync(children);
  });

  useEffect(() => {
    let mounted = true;

    async function translate() {
      // Guard: don't translate JSX
      if (typeof children !== 'string') {
        setTranslated(children);
        return;
      }

      if (language === 'en') {
        setTranslated(children);
        return;
      }

      // 1. Check static translations first (instant, no API)
      if (STATIC_TRANSLATIONS[language]?.[children]) {
        setTranslated(STATIC_TRANSLATIONS[language][children]);
        return;
      }

      // 2. Check cache (already translated before)
      const cached = tSync(children);
      if (cached !== children) {
        setTranslated(cached);
        return;
      }

      if (isPreloading) return;

      // 3. Fall back to API
      const result = await t(children);
      if (mounted) setTranslated(result);
    }

    translate();
    return () => { mounted = false; };
  }, [children, language, isPreloading]);

  return <>{translated}</>;
}