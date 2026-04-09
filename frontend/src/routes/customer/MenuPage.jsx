// src/routes/customer/MenuPage.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShoppingCart, ArrowLeft, MessageCircle, ShieldCheck, ShieldOff } from "lucide-react";
import CategoryBar from "../../components/CategoryBar";
import MenuCard from "../../components/MenuCard";
import DishBottomSheet from "../../components/DishBottomSheet";
import LanguageSelector from "../../components/LanguageSelector";
import Chatbot from "../../components/Chatbot";
import TranslatedText from "../../components/TranslatedText";
import Reveal from "../../components/Reveal";
import { useLanguage } from "../../context/LanguageContext";
import { useSession } from "../../context/SessionContext";
import api from "../../api";
import logo4 from "../../assets/gusto-logo4.png";
import { useToast } from "../../components/Toast";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { useConfirm } from "../../components/ConfirmDialog";

export default function MenuPage() {
  const { restaurantId } = useParams();
  const { language, tSync } = useLanguage();
  const { sessionId, selectionId, cartCount, fetchCartCount } = useSession();
  const { customer, profile } = useCustomerAuth();
  const { confirm, ConfirmContainer } = useConfirm();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");
  const [menuItems, setMenuItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [profileFilterEnabled, setProfileFilterEnabled] = useState(true);

  // { [menu_item_id]: { qty, selectionItemId } }
  const [localCart, setLocalCart] = useState({});
  const debounceTimers = useRef({});

  useEffect(() => { fetchMenuItems(); }, [restaurantId, language]);
  useEffect(() => { if (selectionId && sessionId) fetchCurrentCart(); }, [selectionId, sessionId]);
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    return () => Object.values(debounceTimers.current).forEach(clearTimeout);
  }, []);

  const getProfileConflicts = (item) => {
    if (!profile || !profileFilterEnabled) return [];
    const conflicts = [];

    const itemAllergens = (item.allergens || []).map(a => a.toLowerCase());

    // Check allergens — direct match against item's allergens field
    for (const allergen of (profile.allergens || [])) {
      const a = allergen.toLowerCase();
      if (itemAllergens.some(ia => ia.includes(a) || a.includes(ia))) {
        conflicts.push(allergen);
      }
    }

    return conflicts;
  };

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const restaurantRes = await api.get(`/api/restaurants/${restaurantId}`);
      setRestaurant(restaurantRes.data);
      if (language !== "en") {
        const response = await api.get(`/api/translate/menu/${restaurantId}/${language}`);
        setMenuItems(response.data.items);
      } else {
        const response = await api.get(`/api/menu/?restaurant_id=${restaurantId}`);
        setMenuItems(response.data);
      }
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentCart = async () => {
    try {
      const res = await api.get(`/api/selections/${selectionId}?session_id=${sessionId}`);
      const map = {};
      for (const it of res.data.items || []) {
        map[it.menu_item_id] = { qty: it.quantity, selectionItemId: it.id };
      }
      setLocalCart(map);
    } catch (err) {
      if (err.response?.status === 404) {
        setLocalCart({}); // stale selection, just clear it silently
      }
    }
  };

  const handleAddToCart = async (item, qty = 1, notes = null) => {
    if (!selectionId || !sessionId) return;

    // Check profile conflicts
    const conflicts = getProfileConflicts(item);
    if (conflicts.length > 0) {
      const message = `⚠️ ${item.name} contains ${conflicts.join(", ")} which is listed in your allergen profile. Add anyway?`;
      const ok = await confirm(message, "Add", "#16a34a");
      if (!ok) return;
    }
    
    setLocalCart(prev => ({
      ...prev,
      [item.id]: { qty: (prev[item.id]?.qty || 0) + qty, selectionItemId: prev[item.id]?.selectionItemId || null },
    }));
    try {
      const res = await api.post(
        `/api/selections/${selectionId}/items?session_id=${sessionId}`,
        { menu_item_id: item.id, quantity: qty, notes }
      );
      const saved = res.data.items?.find(i => i.menu_item_id === item.id);
      if (saved) {
        setLocalCart(prev => ({
          ...prev,
          [item.id]: { qty: saved.quantity, selectionItemId: saved.id },
        }));
      }
      fetchCartCount();
    } catch (err) {
      console.error("Add failed:", err);
      setLocalCart(prev => {
        const next = { ...prev };
        const newQty = (next[item.id]?.qty || 0) - qty;
        if (newQty <= 0) delete next[item.id];
        else next[item.id] = { ...next[item.id], qty: newQty };
        return next;
      });
      showToast(tSync("Failed to add item to cart"), "error");
    }
  };

  const handleUpdateQty = (item, newQty) => {
    if (!selectionId || !sessionId) return;
    const entry = localCart[item.id];
    if (!entry?.selectionItemId) return;

    setLocalCart(prev => {
      const next = { ...prev };
      if (newQty <= 0) delete next[item.id];
      else next[item.id] = { ...entry, qty: newQty };
      return next;
    });

    clearTimeout(debounceTimers.current[item.id]);
    debounceTimers.current[item.id] = setTimeout(async () => {
      try {
        if (newQty <= 0) {
          await api.delete(`/api/selections/items/${entry.selectionItemId}?session_id=${sessionId}`);
        } else {
          await api.put(`/api/selections/items/${entry.selectionItemId}?session_id=${sessionId}`, { quantity: newQty });
        }
        fetchCartCount();
      } catch (err) {
        console.error("Sync failed:", err);
      }
      delete debounceTimers.current[item.id];
    }, 600);
  };

  const isLikelyARCapable = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const onAR = (item) => {
    if (!item.ar_model_url) { showToast("AR model not available for this item.", "error"); return; }
    if (!isLikelyARCapable()) { showToast("AR Preview is only available on mobile and tablet devices.", "error"); return; }
    navigate(`/ar?model=${encodeURIComponent(item.ar_model_url)}`);
  };

  const filtered = useMemo(() => {
    if (activeCategory === "all") return menuItems;
    return menuItems.filter(x => x?.category?.toLowerCase() === activeCategory);
  }, [activeCategory, menuItems]);

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", paddingBottom: 60 }}>

      {/* ── Sticky Top Navbar — locked LTR ── */}
      <nav dir="ltr" style={{
        position: "sticky", top: 0, zIndex: 400,
        background: navScrolled ? "rgba(255,255,255,0.93)" : "white",
        backdropFilter: navScrolled ? "blur(16px)" : "none",
        borderBottom: "1px solid #f3f4f6",
        boxShadow: navScrolled ? "0 2px 16px rgba(0,0,0,0.07)" : "none",
        transition: "box-shadow 0.3s ease",
        padding: "0 20px",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          height: 62, gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                width: 36, height: 36, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#f97316",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#fff7ed"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <ArrowLeft size={20} />
            </button>
            <img src={logo4} alt="Gusto" onClick={() => navigate("/")}
              style={{ height: 32, objectFit: "contain", cursor: "pointer" }} />
          </div>

          <h1 style={{
            flex: 1, textAlign: "center",
            fontSize: "clamp(16px,2.5vw,22px)",
            fontWeight: 800, color: "#111", margin: 0,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {restaurant?.name || <TranslatedText>Menu</TranslatedText>}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <LanguageSelector variant="navbar" />
            <button
              onClick={() => navigate(`/restaurant/${restaurantId}/cart`)}
              style={{
                position: "relative",
                background: "linear-gradient(135deg,#f97316,#ea580c)",
                border: "none", cursor: "pointer",
                width: 40, height: 40, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ShoppingCart size={18} color="white" />
              {cartCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: "#111", color: "white",
                  fontSize: 10, fontWeight: 700,
                  minWidth: 18, height: 18, borderRadius: 999,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 4px", border: "2px solid white",
                }}>
                  {cartCount}
                </span>
              )}
            </button>
            {customer && (profile?.allergens?.length > 0 || profile?.dietary_preferences?.length > 0) && (
              <button
                onClick={() => setProfileFilterEnabled(prev => !prev)}
                title={profileFilterEnabled
                  ? "Allergen & dietary filters ON — click to disable"
                  : "Allergen & dietary filters OFF — click to enable"}
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: profileFilterEnabled ? "#fff7ed" : "#f3f4f6",
                  border: `1.5px solid ${profileFilterEnabled ? "#f97316" : "#d1d5db"}`,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s", flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.background = profileFilterEnabled ? "#fed7aa" : "#e5e7eb"}
                onMouseLeave={e => e.currentTarget.style.background = profileFilterEnabled ? "#fff7ed" : "#f3f4f6"}
              >
                {profileFilterEnabled
                  ? <ShieldCheck size={22} color="#f97316" />
                  : <ShieldOff size={22} color="#9ca3af" />
                }
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Restaurant Hero ── */}
      {!loading && restaurant && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 20px 0" }}>
          <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", height: 200 }}>
            {restaurant.image ? (
              <>
                <img
                  src={restaurant.image}
                  alt=""
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%", objectFit: "cover",
                    filter: "blur(18px) brightness(0.6) saturate(1.2)",
                    transform: "scale(1.1)",
                  }}
                />
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
              </>
            ) : (
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#ff6a00,#ea580c)" }} />
            )}

            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 16, overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.4)",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                flexShrink: 0,
              }}>
                {restaurant.image ? (
                  <img src={restaurant.image} alt={restaurant.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                  }}>🍽️</div>
                )}
              </div>

              <div style={{ textAlign: "center" }}>
                <h2 style={{
                  color: "white", margin: 0,
                  fontSize: "clamp(20px,3vw,30px)",
                  fontWeight: 900, letterSpacing: "-0.02em",
                  textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                }}>
                  {restaurant.name}
                </h2>
                {restaurant.category && (
                  <span style={{
                    display: "inline-block", marginTop: 6,
                    background: "rgba(255,255,255,0.18)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "white", fontSize: 13, fontWeight: 600,
                    padding: "3px 12px", borderRadius: 999,
                  }}>
                    {restaurant.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page content ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 20px 0" }}>
        <CategoryBar active={activeCategory} onChange={setActiveCategory} />

        <div style={{
          marginTop: 16, background: "white", borderRadius: 24,
          padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          {loading ? (
            <div dir="ltr" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{
                  height: 340, borderRadius: 28,
                  background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)",
                  backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
                }} />
              ))}
              <style>{`@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🍽️</div>
              <p style={{ fontWeight: 600 }}>No items in this category</p>
            </div>
          ) : (
            <div dir="ltr" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
              {filtered.filter(Boolean).map((item, i) => (
                <Reveal key={item.id} delay={i * 40}>
                  <MenuCard
                    item={item}
                    onAR={onAR}
                    onOpen={setSelectedItem}
                    onAddToCart={handleAddToCart}
                    onUpdateQty={handleUpdateQty}
                    cartQty={localCart[item.id]?.qty || 0}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Chatbot FAB ── */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          position: "fixed", bottom: 28, right: 24, zIndex: 300,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg,#f97316,#ea580c)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(249,115,22,0.45)",
          transform: isChatOpen ? "scale(0.92)" : "scale(1)",
          transition: "transform 0.2s ease",
        }}
        aria-label="Open chat assistant"
      >
        <MessageCircle size={24} color="white" />
      </button>

      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {selectedItem && (
        <DishBottomSheet
          item={selectedItem}
          initialQty={localCart[selectedItem.id]?.qty || 0}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}
      {ConfirmContainer}
      {ToastContainer}
    </div>
  );
}