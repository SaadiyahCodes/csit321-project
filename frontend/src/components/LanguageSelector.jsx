//src/components/LanguageSelector.jsx
import { Globe, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSelector({ variant = "button" }) {
  const { language, setLanguage, currentLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  //Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (variant === "compact") {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
        >
          <Globe size={18} />
          {/* <span className="text-sm font-semibold">{currentLanguage.flag}</span> */}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg overflow-hidden z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition ${
                  language === lang.code ? "bg-orange-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* <span className="text-xl">{lang.flag}</span> */}
                  <span className="text-sm font-medium text-gray-900">{lang.name}</span>
                </div>
                {language === lang.code && (
                  <Check size={16} className="text-orange-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full version for landing page
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 rounded-full bg-white shadow-sm hover:shadow-md transition"
      >
        <Globe size={20} className="text-orange-600" />
        <span className="font-semibold text-gray-900">
          {currentLanguage.flag} {currentLanguage.name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl overflow-hidden z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-5 py-3 hover:bg-orange-50 transition ${
                language === lang.code ? "bg-orange-50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-medium text-gray-900">{lang.name}</span>
              </div>
              {language === lang.code && (
                <Check size={18} className="text-orange-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}