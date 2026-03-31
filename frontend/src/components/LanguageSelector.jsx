// src/components/LanguageSelector.jsx
import { Globe, Check, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSelector({ variant = "button", iconColor = "white", scrolled = false }) {
  const { language, setLanguage, currentLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Landing nav variant: white pill on orange bg → orange outline pill on white bg ──
  // Usage: <LanguageSelector variant="landing-nav" scrolled={scrolled} />
  if (variant === "landing-nav") {
    return (
      <div style={{ position: "relative" }} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 999,
            border: scrolled ? "1.5px solid #f97316" : "1.5px solid rgba(255,255,255,0.5)",
            background: scrolled ? "transparent" : "rgba(255,255,255,0.15)",
            color: scrolled ? "#f97316" : "white",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "border-color 0.35s ease, background 0.35s ease, color 0.35s ease",
          }}
        >
          <Globe size={15} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>
            {language.slice(0, 2).toUpperCase()}
          </span>
          <ChevronDown size={13} style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }} />
        </button>

        {isOpen && (
          <div style={{
            position: "absolute", right: 0, top: 48, zIndex: 500,
            background: "white", borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            overflow: "hidden", minWidth: 160,
          }}>
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px", border: "none", cursor: "pointer",
                  background: language === lang.code ? "#fff7ed" : "white",
                  fontSize: 14, fontWeight: language === lang.code ? 700 : 400,
                  color: "#111",
                }}
              >
                {lang.name}
                {language === lang.code && <Check size={14} color="#f97316" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Navbar variant: orange outline pill (white bg, orange border + text) ──
  // Usage: <LanguageSelector variant="navbar" />
  if (variant === "navbar") {
    return (
      <div style={{ position: "relative" }} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 13px", borderRadius: 999, cursor: "pointer",
            border: "1.5px solid #f97316",
            background: "transparent",
            color: "#f97316",
            height: 40,
            transition: "background 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#fff7ed"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <Globe size={15} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>
            {language.slice(0, 2).toUpperCase()}
          </span>
          <ChevronDown size={13} style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }} />
        </button>

        {isOpen && (
          <div style={{
            position: "absolute", right: 0, top: 48, zIndex: 500,
            background: "white", borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            overflow: "hidden", minWidth: 160,
          }}>
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px", border: "none", cursor: "pointer",
                  background: language === lang.code ? "#fff7ed" : "white",
                  fontSize: 14, fontWeight: language === lang.code ? 700 : 400,
                  color: "#111",
                }}
              >
                {lang.name}
                {language === lang.code && <Check size={14} color="#f97316" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Compact variant: just globe icon ──
  if (variant === "compact") {
    const isOrange = iconColor === "orange";
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 10px", borderRadius: 999, border: "none", cursor: "pointer",
            background: isOrange ? "#fff7ed" : "rgba(255,255,255,0.15)",
            color: isOrange ? "#f97316" : "white",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = isOrange ? "#ffedd5" : "rgba(255,255,255,0.25)"}
          onMouseLeave={e => e.currentTarget.style.background = isOrange ? "#fff7ed" : "rgba(255,255,255,0.15)"}
        >
          <Globe size={18} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg overflow-hidden z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition ${
                  language === lang.code ? "bg-orange-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">{lang.name}</span>
                </div>
                {language === lang.code && <Check size={16} className="text-orange-600" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Full variant: for landing page ──
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
              onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
              className={`w-full flex items-center justify-between px-5 py-3 hover:bg-orange-50 transition ${
                language === lang.code ? "bg-orange-50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-medium text-gray-900">{lang.name}</span>
              </div>
              {language === lang.code && <Check size={18} className="text-orange-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}