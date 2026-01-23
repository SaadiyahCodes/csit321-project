//src/components/TranslatedText.jsx
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function TranslatedText({ children, ...props }) {
  const { t, tSync, language } = useLanguage();
  const [translated, setTranslated] = useState(tSync(children));

  useEffect(() => {
    let mounted = true;

    async function translate() {
      if (language === 'en') {
        setTranslated(children);
        return;
      }

      const result = await t(children);
      if (mounted) {
        setTranslated(result);
      }
    }

    translate();

    return () => {
      mounted = false;
    };
  }, [children, language, t, tSync]);

  return <>{translated}</>;
}