//src/routes/customer/LandingPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UtensilsCrossed, ChevronDown, Shield, Zap, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import RestaurantCard from "../../components/RestaurantCard";
import LanguageSelector from "../../components/LanguageSelector";
import TranslatedText from "../../components/TranslatedText";
import FoodCursor from "../../components/FoodCursor";
import ParticleBackground from "../../components/ParticleBackground";
import Reveal from "../../components/Reveal";
import { useLanguage } from "../../context/LanguageContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import api from "../../api";
import logo2 from "../../assets/gusto-logo2.png";
import logo3 from "../../assets/gusto-logo3.png";
import logo4 from "../../assets/gusto-logo4.png";
import heroImg1 from "../../assets/heroimg1.jpg";
import heroImg2 from "../../assets/heroimg2.jpg";
import heroImg3 from "../../assets/heroimg3.jpg";
import heroImg4 from "../../assets/heroimg4.jpg";

// ── Top Navbar ────────────────────────────────────────────────────────────────
function TopNav({ customer }) {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav dir="ltr" style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 500,
      background: scrolled ? "rgba(255,255,255,0.88)" : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(249,115,22,0.15)" : "none",
      transition: "background 0.35s ease, backdrop-filter 0.35s ease, border-bottom 0.35s ease",
      padding: "0 24px",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        height: 64,
      }}>
        {/* Logo — swaps white→orange on scroll */}
        <img
          src={scrolled ? logo4 : logo3}
          alt="Gusto"
          onClick={() => navigate("/")}
          style={{
            height: 60, objectFit: "contain", cursor: "pointer",
            transition: "opacity 0.3s ease",
          }}
        />

        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
          <NavLink label="Restaurants" scrolled={scrolled} onClick={() => scrollTo("restaurants")} />
          <NavLink label="About"       scrolled={scrolled} onClick={() => scrollTo("about")} />

          <div style={{
            width: 1, height: 20,
            background: scrolled ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.3)",
            margin: "0 4px", flexShrink: 0,
          }} />

          {/* Language selector mirrors the Login button style */}
          <LanguageSelector variant="landing-nav" scrolled={scrolled} />

          <button
            onClick={() => window.location.href = customer ? "/customer/profile" : "/customer/login"}
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {customer ? customer.name.split(" ")[0] : "Login"}
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ label, scrolled, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none", border: "none", cursor: "pointer",
        padding: "6px 12px", borderRadius: 8,
        fontSize: 13, fontWeight: 600,
        color: scrolled ? (hovered ? "#f97316" : "#374151") : "white",
        opacity: hovered ? 1 : 0.85,
        transition: "color 0.2s, opacity 0.2s",
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ── Floating Food Cards ───────────────────────────────────────────────────────
const FOOD_CARDS = [
  { img: heroImg1, left: "2%",  top: "20%", rotate: -11, floatDir:  1 },
  { img: heroImg2, left: "10%", top: "52%", rotate:   6, floatDir: -1 },
  { img: heroImg3, left: "70%", top: "20%", rotate:  -5, floatDir:  1 },
  { img: heroImg4, left: "80%", top: "52%", rotate:   9, floatDir: -1 },
];

function FoodCard({ card, index }) {
  const [pos, setPos]           = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [tilt, setTilt]         = useState({ x: 0, y: 0 });
  const originRef               = useRef({ x: 0, y: 0 });
  const startMouse              = useRef({ x: 0, y: 0 });
  const movedRef                = useRef(false);
  const rafId                   = useRef(null);
  const cardRef                 = useRef(null);

  const onMouseMove = useCallback(e => {
    if (dragging || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width  - 0.5;
    const cy = (e.clientY - rect.top)  / rect.height - 0.5;
    setTilt({ x: cy * -8, y: cx * 8 });
  }, [dragging]);
  const onMouseLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  const onDown = useCallback((clientX, clientY) => {
    originRef.current  = { x: pos.x, y: pos.y };
    startMouse.current = { x: clientX, y: clientY };
    movedRef.current   = false;
    setTilt({ x: 0, y: 0 });
    setDragging(true);
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const move = (clientX, clientY) => {
      const dx = clientX - startMouse.current.x;
      const dy = clientY - startMouse.current.y;
      if (Math.hypot(dx, dy) > 4) movedRef.current = true;
      // skip rAF batching — direct state set is fine for drag
      setPos({ x: originRef.current.x + dx, y: originRef.current.y + dy });
    };
    const onMM = e => move(e.clientX, e.clientY);
    const onTM = e => {
      if (!movedRef.current && Math.hypot(
        e.touches[0].clientX - startMouse.current.x,
        e.touches[0].clientY - startMouse.current.y
      ) < 8) return;
      e.preventDefault();
      move(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onUp = () => { setDragging(false); setPos({ x: 0, y: 0 }); };
    window.addEventListener("mousemove", onMM);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchmove", onTM, { passive: false });
    window.addEventListener("touchend",  onUp);
    return () => {
      window.removeEventListener("mousemove", onMM);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchmove", onTM);
      window.removeEventListener("touchend",  onUp);
    };
  }, [dragging]);

  const floatAnim = `heroFloat${index}`;

  return (
    <>
      <style>{`
        @keyframes ${floatAnim} {
          0%,100% { translate: 0px 0px; }
          50%      { translate: 0px ${card.floatDir * 10}px; }
        }
      `}</style>
      <div
        ref={cardRef}
        onMouseDown={e => { e.preventDefault(); onDown(e.clientX, e.clientY); }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onTouchStart={e => onDown(e.touches[0].clientX, e.touches[0].clientY)}
        style={{
          position: "absolute",
          left: card.left,
          top: card.top,
          transform: `
            translate(${pos.x}px, ${pos.y}px)
            rotate(${card.rotate}deg)
            perspective(700px)
            rotateX(${dragging ? 0 : tilt.x}deg)
            rotateY(${dragging ? 0 : tilt.y}deg)
            scale(${dragging ? 1.04 : 1})
          `,
          animation: dragging ? "none" : `${floatAnim} ${3.4 + index * 0.35}s ease-in-out infinite`,
          transition: dragging
            ? "none"
            : "transform 0.45s cubic-bezier(0.34,1.56,0.64,1)",
          zIndex: dragging ? 50 : 0,
          cursor: dragging ? "grabbing" : "grab",
          userSelect: "none", WebkitUserSelect: "none",
        }}
      >
        <div style={{
          border: "1px solid rgba(255,255,255,0.30)",
          padding: 4,
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(6px)",
          lineHeight: 0, // removes gap between div and img
        }}>
          <img
            src={card.img}
            alt=""
            draggable="false"
            style={{
              width: "clamp(220px, 22vw, 320px)",
              height: "auto",
              display: "block",
              pointerEvents: "none",
              filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.18))",
            }}
          />
        </div>
      </div>
    </>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ onScrollDown }) {
  return (
    <section style={{
      minHeight: "80vh",
      background: "linear-gradient(160deg, #ff6a00 0%, #f97316 40%, #ea580c 70%, #c2410c 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 24px 48px",
      position: "relative",
      overflow: "visible",
      boxSizing: "border-box",
    }}>
      {/* Blobs — clipped to section only */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", borderRadius: "inherit" }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: 420, height: 420, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: "8%", left: "-8%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
      </div>

      {/* Floating draggable food cards */}
      {FOOD_CARDS.map((card, i) => <FoodCard key={i} card={card} index={i} />)}

      {/* Centre content */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        width: "100%", maxWidth: 560, textAlign: "center",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ animation: "heroFadeIn 0.6s ease both", width: "100%" }}>
          <img
            src={logo2}
            alt="Gusto"
            style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto", objectFit: "contain", mixBlendMode: "lighten" }}
          />
        </div>

        <div style={{ animation: "heroFadeIn 0.6s 0.1s ease both", marginTop: 8 }}>
          <p style={{
            color: "white",
            fontSize: "clamp(15px,2.2vw,20px)",
            fontWeight: 500,
            margin: 0,
            lineHeight: 1.55,
            letterSpacing: "0.01em",
          }}>
            <TranslatedText>Every order is a conversation. We understand it.</TranslatedText>
          </p>
        </div>

        <button
          onClick={onScrollDown}
          style={{
            marginTop: 48,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.65)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            animation: "heroFadeIn 0.6s 0.6s ease both",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            padding: 8, zIndex: 1,
          }}
        >
          EXPLORE
          <ChevronDown size={16} style={{ animation: "bounce 1.6s ease-in-out infinite" }} />
        </button>
      </div>

      <style>{`
        @keyframes heroFadeIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }
      `}</style>
    </section>
  );
}

// ── Stacking Features / About Section ────────────────────────────────────────
const FEATURES = [
  {
    Icon: Shield,
    title: "Allergen Safety Filtering",
    subtitle: "Dine without worry",
    accent: "#4CAF50",
    description: "Smart filtering flags and hides dishes based on your dietary restrictions and allergens. Set your profile once and dine safe every time.",
    illustration: (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
        {[
          { label: "Gluten-Free", safe: true },
          { label: "Nut-Free",    safe: true },
          { label: "Dairy-Free",  safe: false },
          { label: "Vegan",       safe: true },
          { label: "Shellfish-Free", safe: false },
        ].map(tag => (
          <span key={tag.label} style={{
            padding: "5px 13px", borderRadius: 999, fontSize: 12, fontWeight: 600,
            background: tag.safe ? "rgba(76,175,80,0.1)" : "rgba(242,140,40,0.1)",
            color: tag.safe ? "#4CAF50" : "#F28C28",
            border: `1px solid ${tag.safe ? "rgba(76,175,80,0.3)" : "rgba(242,140,40,0.3)"}`,
          }}>
            {tag.safe ? "✓" : "✗"} {tag.label}
          </span>
        ))}
      </div>
    ),
  },
  {
    Icon: Zap,
    title: "Smart AI Chatbot",
    subtitle: "Your personal food guide",
    accent: "#F28C28",
    description: "An AI assistant that knows every menu. Ask for recommendations, ingredient details, or place your order completely hands-free — in any language.",
    illustration: (
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8, maxWidth: 300 }}>
        <div style={{ alignSelf: "flex-start", padding: "9px 14px", borderRadius: "16px 16px 16px 4px", background: "#F5E6D3", color: "#5C3D1A", fontSize: 13 }}>
          What's good with the salmon? 🐟
        </div>
        <div style={{ alignSelf: "flex-end", padding: "9px 14px", borderRadius: "16px 16px 4px 16px", background: "#F28C28", color: "white", fontSize: 13 }}>
          Try our citrus risotto or a Chardonnay!
        </div>
        <div style={{ alignSelf: "flex-start", padding: "9px 14px", borderRadius: "16px 16px 16px 4px", background: "#F5E6D3", color: "#5C3D1A", fontSize: 13 }}>
          Is it nut-free? 🥜
        </div>
      </div>
    ),
  },
  {
    Icon: Eye,
    title: "AR Food Preview",
    subtitle: "See before you eat",
    accent: "#5C8DCA",
    description: "Point your camera at the table and see a life-sized photorealistic preview of your dish before ordering. Know exactly what you're getting.",
    illustration: (
      <div style={{ marginTop: 20 }}>
        <div style={{
          width: "100%", height: 100, borderRadius: 16,
          border: "2px dashed rgba(92,141,202,0.35)",
          background: "rgba(92,141,202,0.05)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(92,141,202,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Eye size={20} color="#5C8DCA" />
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>AR Preview</p>
              <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Tap to see dish in 3D</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%", background: "rgba(92,141,202,0.45)",
                animation: `arPulse 1.2s ${i * 0.2}s ease-in-out infinite`,
              }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes arPulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:1;transform:scale(1.35)}}`}</style>
      </div>
    ),
  },
];

const navBtnStyle = {
  width: 38, height: 38, borderRadius: "50%",
  background: "white", border: "1px solid #e5e7eb",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", color: "#666",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  flexShrink: 0,
};

function AboutSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToNext = useCallback(() => setActiveIndex(p => (p + 1) % FEATURES.length), []);
  const goToPrev = useCallback(() => setActiveIndex(p => (p - 1 + FEATURES.length) % FEATURES.length), []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const t = setInterval(goToNext, 4000);
    return () => clearInterval(t);
  }, [isAutoPlaying, goToNext]);

  const getCardStyle = (index) => {
    const diff = (index - activeIndex + FEATURES.length) % FEATURES.length;
    if (diff === 0) return { transform: "translateY(0px)  scale(1)",    opacity: 1,    zIndex: 30 };
    if (diff === 1) return { transform: "translateY(26px) scale(0.95)", opacity: 0.55, zIndex: 20 };
    return             { transform: "translateY(48px) scale(0.90)", opacity: 0.22, zIndex: 10 };
  };

  return (
    <section id="about" style={{ background: "#fff8f0", padding: "80px 24px 100px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#f97316", marginBottom: 10 }}>
              About Gusto
            </span>
            <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, color: "#111", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              A smarter way to dine
            </h2>
            <p style={{ fontSize: 15, color: "#777", maxWidth: 400, margin: "0 auto", lineHeight: 1.65 }}>
              Three features that make every meal safer, easier, and more delicious.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            style={{ position: "relative", height: 400 }}
          >
            {FEATURES.map((f, i) => (
              <div
                key={i}
                style={{
                  position: "absolute", inset: 0,
                  transition: "transform 0.65s cubic-bezier(0.34,1.56,0.64,1), opacity 0.65s ease",
                  ...getCardStyle(i),
                }}
              >
                <div style={{
                  height: "100%", borderRadius: 24,
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.07)",
                  boxShadow: "0 8px 32px rgba(249,115,22,0.07)",
                  padding: "clamp(20px,4vw,32px)",
                  boxSizing: "border-box", overflow: "hidden",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                      background: `${f.accent}18`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <f.Icon size={24} color={f.accent} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: f.accent }}>{f.subtitle}</p>
                      <h3 style={{ margin: 0, fontSize: "clamp(16px,2.5vw,21px)", fontWeight: 800, color: "#111" }}>{f.title}</h3>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: "#666", lineHeight: 1.65, margin: 0 }}>{f.description}</p>
                  {f.illustration}
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 24 }}>
            <button onClick={goToPrev} style={navBtnStyle}><ChevronLeft size={18} /></button>
            <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
              {FEATURES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  style={{
                    borderRadius: 999, border: "none", cursor: "pointer", padding: 0,
                    transition: "all 0.4s ease",
                    width: i === activeIndex ? 26 : 8,
                    height: 8,
                    background: i === activeIndex ? "#f97316" : "#e5e7eb",
                  }}
                />
              ))}
            </div>
            <button onClick={goToNext} style={navBtnStyle}><ChevronRight size={18} /></button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Main LandingPage ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const { tSync } = useLanguage();
  const { customer } = useCustomerAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const restaurantsSectionRef = useRef(null);

  useEffect(() => {
    api.get("/api/restaurants/")
      .then(r => { setRestaurants(r.data); setLoading(false); })
      .catch(() => { setError("Failed to load restaurants"); setLoading(false); });
  }, []);

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", position: "relative" }}>
      <ParticleBackground />
      <TopNav customer={customer} />

      <Hero
        onScrollDown={() => restaurantsSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
      />

      {/* Restaurants */}
      <section
        id="restaurants"
        ref={restaurantsSectionRef}
        dir="ltr"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 20px 80px" }}
      >
        <Reveal>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
            {/* Left: icon + title + subtitle */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#f97316,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <UtensilsCrossed size={18} color="white" />
                </div>
                <h2 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, color: "#111", margin: 0 }}>
                  <TranslatedText>Restaurants</TranslatedText>
                </h2>
              </div>
              <p style={{ color: "#888", fontSize: 14, margin: 0, marginLeft: 48 }}>
                {loading
                  ? <TranslatedText>Loading…</TranslatedText>
                  : <><span>{filtered.length}</span> <TranslatedText>{filtered.length === 1 ? "restaurant available" : "restaurants available"}</TranslatedText></>
                }
              </p>
            </div>
            {/* Right: compact search bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "white", borderRadius: 999,
              padding: "9px 16px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              border: "1px solid #f0ece6",
              minWidth: 220, maxWidth: 320, flex: "0 1 320px",
            }}>
              <Search size={15} style={{ color: "#f97316", flexShrink: 0 }} />
              <input
                style={{ flex: 1, outline: "none", fontSize: 14, border: "none", background: "transparent", color: "#111" }}
                placeholder={tSync("Search restaurants…")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div style={{ marginBottom: 36 }} />
        </Reveal>

        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                height: 200, borderRadius: 16,
                background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)",
                backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
              }} />
            ))}
            <style>{`@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
          </div>
        )}

        {error && <div style={{ textAlign: "center", color: "#ef4444", padding: 40 }}>{error}</div>}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 }}>
            {filtered.map((r, i) => (
              <Reveal key={r.id} delay={i * 70}>
                <RestaurantCard restaurant={r} />
              </Reveal>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <Reveal>
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 16, fontWeight: 600 }}><TranslatedText>No restaurants found</TranslatedText></p>
              <p style={{ fontSize: 14 }}><TranslatedText>Try a different search term</TranslatedText></p>
            </div>
          </Reveal>
        )}
      </section>

      {/* About / Features */}
      <AboutSection />

      {/* Footer */}
      <Reveal>
        <footer style={{ borderTop: "1px solid #f0ece6", padding: "28px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#aaa", marginBottom: 4 }}><TranslatedText>© 2026 Gusto · AI-powered dining</TranslatedText></p>
          <p style={{ fontSize: 13, color: "#bbb" }}>
            <TranslatedText>Contact</TranslatedText>: <span style={{ color: "#f97316", fontWeight: 600 }}>support@gusto.com</span>
          </p>
        </footer>
      </Reveal>
    </div>
  );
}