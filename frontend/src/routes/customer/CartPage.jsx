// src/routes/customer/CartPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingCart, MapPin } from "lucide-react";
import TranslatedText from "../../components/TranslatedText";
import LanguageSelector from "../../components/LanguageSelector";
import Chatbot from "../../components/Chatbot";
import { useSession } from "../../context/SessionContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api";
import logo4 from "../../assets/gusto-logo4.png";
import { useConfirm } from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

export default function CartPage() {
  const navigate = useNavigate();
  const { sessionId, selectionId, restaurantId, loading: sessionLoading, fetchCartCount } = useSession();
  const { language, tSync } = useLanguage();
  const { confirm, ConfirmContainer } = useConfirm();
  const { showToast, ToastContainer } = useToast();
  const [selection, setSelection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState("cart");
  const [tableNumber, setTableNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Optimistic local quantities — { [itemId]: qty }
  const [localQtys, setLocalQtys] = useState({});
  const debounceTimers = useRef({});

  useEffect(() => {
    if (selectionId && sessionId) fetchCart();
  }, [selectionId, sessionId, language]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cancel all pending timers on unmount
  useEffect(() => {
    return () => Object.values(debounceTimers.current).forEach(clearTimeout);
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/selections/${selectionId}?session_id=${sessionId}`);
      const cartData = response.data;

      if (language !== "en" && cartData.items) {
        for (let item of cartData.items) {
          if (item.menu_item.name) {
            const result = await api.post("/api/translate/text", {
              text: item.menu_item.name, target_lang: language, source_lang: "en",
            });
            if (result.data.success) item.menu_item.name = result.data.translated_text;
          }
        }
      }

      setSelection(cartData);
      // Seed local qtys from server
      const qtys = {};
      for (const it of cartData.items || []) qtys[it.id] = it.quantity;
      setLocalQtys(qtys);
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  // Instant local update + debounced API sync (same pattern as MenuPage)
  const updateQuantity = (itemId, newQty) => {
    if (newQty < 0) return;

    // Instant UI
    setLocalQtys(prev => ({ ...prev, [itemId]: newQty }));

    // Debounce API
    clearTimeout(debounceTimers.current[itemId]);
    debounceTimers.current[itemId] = setTimeout(async () => {
      try {
        if (newQty === 0) {
          await api.delete(`/api/selections/items/${itemId}?session_id=${sessionId}`);
          // Remove from local state instead of full refetch
          setSelection(prev => {
            if (!prev) return prev;
            const items = prev.items.filter(it => it.id !== itemId);
            const total_price = items.reduce((s, it) => s + it.item_total, 0);
            const item_count = items.reduce((s, it) => s + it.quantity, 0);
            return { ...prev, items, total_price, item_count };
          });
          setLocalQtys(prev => {
            const next = { ...prev };
            delete next[itemId];
            return next;
          });
          fetchCartCount();
        }
      } catch (err) {
        console.error("Sync failed:", err);
      }
      delete debounceTimers.current[itemId];
    }, 600);
  };

  const removeItem = async (itemId) => {
    const ok = await confirm(tSync("Remove this item from cart?"));
    if (!ok) return;
    // Instant remove from UI
    setSelection(prev => {
      if (!prev) return prev;
      const items = prev.items.filter(it => it.id !== itemId);
      const total_price = items.reduce((s, it) => s + it.item_total, 0);
      const item_count = items.reduce((s, it) => s + it.quantity, 0);
      return { ...prev, items, total_price, item_count };
    });
    try {
      await api.delete(`/api/selections/items/${itemId}?session_id=${sessionId}`);
      fetchCartCount();
    } catch (err) {
      console.error("Error removing item:", err);
      showToast("Error removing item:" + err, "error")
      await fetchCart(); // restore on error
    }
  };

  const handleCheckout = () => navigate(`/restaurant/${restaurantId}/order-summary`);

  // ── Navbar ──
  const Navbar = () => (
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
        maxWidth: 800, margin: "0 auto",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        height: 62, gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => navigate(`/restaurant/${restaurantId}/menu`)}
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
          fontSize: "clamp(15px,2.5vw,19px)",
          fontWeight: 800, color: "#111", margin: 0,
        }}>
          <TranslatedText>Your Cart</TranslatedText>
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <LanguageSelector variant="navbar" />
        </div>
      </div>
    </nav>
  );

  if (loading || sessionLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafaf8" }}>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <p style={{ fontWeight: 600, fontSize: 16, color: "#888" }}>
            <TranslatedText>Loading cart...</TranslatedText>
          </p>
        </div>
      </div>
    );
  }

  // ── Empty cart — original design ──
  if (!selection || selection.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            <TranslatedText>Your Cart is Empty</TranslatedText>
          </h2>
          <p className="text-gray-600 mb-6">
            <TranslatedText>Add some delicious items to get started!</TranslatedText>
          </p>
          <button
            onClick={() => navigate(`/restaurant/${restaurantId}/menu`)}
            className="bg-orange-600 text-white px-6 py-3 rounded-full font-bold text-base"
          >
            <TranslatedText>Browse Menu</TranslatedText>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", paddingBottom: 110 }}>
      <Navbar />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 20px 0" }}>

        {/* ── Cart Items ── */}
        <div style={{
          background: "white", borderRadius: 24,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          overflow: "hidden", marginBottom: 16,
        }}>
          {selection.items.map((item, idx) => {
            const isLast = idx === selection.items.length - 1;
            const qty = localQtys[item.id] ?? item.quantity;
            const itemTotal = (item.menu_item.price * qty).toFixed(2);

            return (
              <div key={item.id} style={{
                display: "flex", gap: 16, padding: "18px 20px",
                borderBottom: isLast ? "none" : "1px solid #f3f4f6",
              }}>
                {/* Image */}
                {item.menu_item.image_url && (
                  <div style={{
                    width: 100, height: 100, borderRadius: 16,
                    overflow: "hidden", flexShrink: 0,
                  }}>
                    <img
                      src={item.menu_item.image_url}
                      alt={item.menu_item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: 0, lineHeight: 1.3 }}>
                      {item.menu_item.name}
                    </h3>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#ef4444", padding: 4, flexShrink: 0,
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Notes pill */}
                  {item.notes && (
                    <span style={{
                      display: "inline-block", width: "fit-content",
                      background: "#fafaf8", border: "1px solid #e5e7eb",
                      borderRadius: 999, padding: "2px 10px",
                      fontSize: 12, color: "#6b7280",
                    }}>
                      📝 {item.notes}
                    </span>
                  )}

                  {/* Qty + subtotal */}
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginTop: "auto", paddingTop: 4,
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: "#fff7ed", borderRadius: 999, padding: "5px 10px",
                    }}>
                      <button
                        onClick={() => updateQuantity(item.id, qty - 1)}
                        style={{
                          width: 30, height: 30, borderRadius: "50%",
                          background: qty === 1 ? "#e5e7eb" : "#f97316",
                          border: "none", cursor: qty === 1 ? "default" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: qty === 1 ? "#9ca3af" : "white",
                        }}
                      ><Minus size={13} /></button>
                      <span style={{ fontWeight: 800, fontSize: 16, color: "#111", minWidth: 18, textAlign: "center" }}>
                        {qty}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, qty + 1)}
                        style={{
                          width: 30, height: 30, borderRadius: "50%",
                          background: "#f97316", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white",
                        }}
                      ><Plus size={13} /></button>
                    </div>

                    <span style={{ fontSize: 17, fontWeight: 800, color: "#111" }}>
                      {itemTotal} AED
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Order Summary ── */}
        <div style={{
          background: "white", borderRadius: 24,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          padding: "22px 24px",
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#111", margin: "0 0 16px" }}>
            <TranslatedText>Order Summary</TranslatedText>
          </h2>

          {selection.items.map(item => {
            const qty = localQtys[item.id] ?? item.quantity;
            const itemTotal = (item.menu_item.price * qty).toFixed(2);
            return (
              <div key={item.id} style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 15, color: "#555", marginBottom: 10,
              }}>
                <span style={{ flex: 1, marginRight: 12 }}>
                  {item.menu_item.name}
                  <span style={{ color: "#9ca3af", marginLeft: 6 }}>×{qty}</span>
                </span>
                <span style={{ fontWeight: 600, color: "#111" }}>{itemTotal} AED</span>
              </div>
            );
          })}

          <div style={{ borderTop: "1px solid #f3f4f6", marginTop: 12, paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>
                <TranslatedText>Total</TranslatedText>
              </span>
              <span style={{
                fontSize: 24, fontWeight: 900,
                background: "linear-gradient(135deg,#f97316,#ea580c)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                {selection.total_price.toFixed(2)} AED
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>
              {selection.item_count} <TranslatedText>items</TranslatedText>
            </p>
          </div>
        </div>

        {/* ── Dining Details ── */}
        <div style={{
          background: "white", borderRadius: 24,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          padding: "20px", marginBottom: 16,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#111", margin: 0 }}>
            <TranslatedText>Dining Details</TranslatedText>
          </h2>

          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              <TranslatedText>Table Number</TranslatedText>
              <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: 4 }}>
                (<TranslatedText>optional</TranslatedText>)
              </span>
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              placeholder={tSync("e.g. Table 7")}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "11px 14px", borderRadius: 12, fontSize: 15,
                border: "1.5px solid #e5e7eb", outline: "none",
                fontFamily: "inherit", color: "#111",
              }}
              onFocus={e => e.target.style.borderColor = "#f97316"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              <MapPin size={14} color="#f97316" />
              <TranslatedText>Delivery Address</TranslatedText>
              <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: 2 }}>
                (<TranslatedText>optional</TranslatedText>)
              </span>
            </label>
            <textarea
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              placeholder={tSync("Enter delivery address if applicable...")}
              rows={2}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "11px 14px", borderRadius: 12, fontSize: 15,
                border: "1.5px solid #e5e7eb", outline: "none",
                resize: "none", fontFamily: "inherit", color: "#111",
              }}
              onFocus={e => e.target.style.borderColor = "#f97316"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>
        </div>
      </div>

      {/* ── Fixed Checkout Button ── */}
      <div dir="ltr" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        borderTop: "1px solid #f3f4f6", padding: "14px 20px 22px",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <button
            onClick={handleCheckout}
            style={{
              width: "100%", padding: "16px 0", borderRadius: 999,
              background: "linear-gradient(135deg,#f97316,#ea580c)",
              border: "none", cursor: "pointer",
              color: "white", fontSize: 17, fontWeight: 800,
              boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            <ShoppingCart size={20} />
            <TranslatedText>Proceed to Checkout</TranslatedText>
            <span style={{ opacity: 0.85, fontSize: 15 }}>· {selection.total_price.toFixed(2)} AED</span>
          </button>
        </div>
      </div>

      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      {ConfirmContainer}
      {ToastContainer}
    </div>
  );
}