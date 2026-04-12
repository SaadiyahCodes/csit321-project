// src/routes/customer/OrderSummaryPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle, Hash, CookingPot, Motorbike, ChefHat, NotebookPen } from "lucide-react";
import TranslatedText from "../../components/TranslatedText";
import LanguageSelector from "../../components/LanguageSelector";
import { useSession } from "../../context/SessionContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api";
import logo4 from "../../assets/gusto-logo4.png";
import { useToast } from "../../components/Toast";

// ── Confetti ──────────────────────────────────────────────
const COLORS = ["#f97316","#ea580c","#fbbf24","#34d399","#60a5fa","#f472b6","#a78bfa"];
const rand = (min, max) => Math.random() * (max - min) + min;

function Confetti() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 120 }, () => ({
      x: rand(0, canvas.width),
      y: rand(-200, 0),
      r: rand(5, 12),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: rand(0, Math.PI * 2),
      spin: rand(-0.08, 0.08),
      vx: rand(-2, 2),
      vy: rand(3, 7),
      shape: Math.random() > 0.5 ? "rect" : "circle",
      w: rand(8, 16), h: rand(4, 10),
      opacity: 1,
    }));

    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      pieces.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.angle += p.spin;
        p.vy += 0.08; // gravity
        if (p.y < canvas.height + 40) alive = true;
        if (p.y > canvas.height * 0.6) p.opacity = Math.max(0, p.opacity - 0.015);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      });
      ctx.globalAlpha = 1;
      if (alive) frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", inset: 0, zIndex: 999,
      pointerEvents: "none",
    }} />
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function OrderSummaryPage() {
  const navigate = useNavigate();
  const { sessionId, selectionId, restaurantId, refreshSelection } = useSession();
  const { tSync } = useLanguage();
  const { showToast, ToastContainer } = useToast();
  const location = useLocation();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [checkVisible, setCheckVisible] = useState(false);
  const hasFinalizedRef = useRef(false);
  const { orderType, tableNumber, deliveryAddress } = location.state || {};

  useEffect(() => {
    if (selectionId && sessionId && !hasFinalizedRef.current) {
      hasFinalizedRef.current = true;
      finalizeOrder();
    }
  }, [selectionId, sessionId]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const finalizeOrder = async () => {
    setFinalizing(true);
    try {
      // Get order details from navigation state
      const { orderType, tableNumber, deliveryAddress } = location.state || {};
      
      if (!orderType) {
        showToast(tSync("Missing order details. Please try again."), "error");
        navigate(`/restaurant/${restaurantId}/cart`);
        return;
      }

      const finalizeData = {
        order_type: orderType,
        table_number: tableNumber,
        delivery_address: deliveryAddress,
      };

      const response = await api.post(
        `/api/selections/${selectionId}/finalize?session_id=${sessionId}`,
        finalizeData
      );
      
      setOrderData(response.data);
      setLoading(false);
      // Clear the session so a fresh selection is created when returning to menu
      localStorage.removeItem(`session_${restaurantId}`);
      await refreshSelection();
      // Stagger: confetti first, then checkmark pops in
      setShowConfetti(true);
      setTimeout(() => setCheckVisible(true), 300);
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (err) {
      console.error("Error finalizing order:", err);
      showToast(err.response?.data?.detail || tSync("Failed to finalize order"), "error");
      navigate(`/restaurant/${restaurantId}/cart`);
    } finally {
      setFinalizing(false);
    }
  };

  const handleNewOrder = () => {
    localStorage.removeItem(`session_${restaurantId}`);
    navigate(`/restaurant/${restaurantId}/menu`);
    window.location.reload();
  };

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
          <TranslatedText>Order Confirmed</TranslatedText>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <LanguageSelector variant="navbar" />
        </div>
      </div>
    </nav>
  );

  // ── Loading ──
  if (loading || finalizing) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafaf8" }}>
        <Navbar />
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", height: "70vh", gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: "3px solid #fed7aa", borderTopColor: "#f97316",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: "#888" }}>
            <TranslatedText>Placing your order...</TranslatedText>
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!orderData) return null;

  return (
    <div dir="ltr" style={{ minHeight: "100vh", background: "#fafaf8", paddingBottom: 40 }}>
      {showConfetti && <Confetti />}
      <Navbar />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px 0" }}>

        {/* ── Success hero ── */}
        <div style={{
          background: "linear-gradient(135deg,#f97316,#ea580c)",
          borderRadius: 28, padding: "36px 24px",
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 12, marginBottom: 20,
          boxShadow: "0 8px 32px rgba(249,115,22,0.3)",
        }}>
          {/* Animated checkmark */}
          <div style={{
            transform: checkVisible ? "scale(1)" : "scale(0)",
            transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            <CheckCircle size={72} color="white" strokeWidth={1.8} />
          </div>
          <h2 style={{
            fontSize: 28, fontWeight: 900, color: "white",
            margin: 0, textAlign: "center",
            opacity: checkVisible ? 1 : 0,
            transform: checkVisible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.4s ease 0.3s, transform 0.4s ease 0.3s",
          }}>
            <TranslatedText>Order Placed!</TranslatedText>
          </h2>
          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.85)",
            margin: 0, textAlign: "center",
            opacity: checkVisible ? 1 : 0,
            transition: "opacity 0.4s ease 0.5s",
          }}>
            <TranslatedText>Your order has been sent to the kitchen</TranslatedText>
          </p>

          {/* Order ID pill */}
          <div style={{
            background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 999, padding: "6px 18px",
            display: "flex", alignItems: "center", gap: 6,
            opacity: checkVisible ? 1 : 0,
            transition: "opacity 0.4s ease 0.6s",
          }}>
            <Hash size={14} color="white" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>
              Order #{orderData.selection_id}
            </span>
          </div>
        </div>

        {/* ── Order Type Details ── */}
        {orderType && (
          <div style={{
            background: "white", borderRadius: 24,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            padding: "24px 20px", marginBottom: 16,
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 12, textAlign: "center",
          }}>
            <div style={{
              background: "#fff7ed", borderRadius: "50%",
              width: 64, height: 64,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {orderType === "dine_in"
                ? <ChefHat size={32} color="#f97316" />
                : <Motorbike size={32} color="#f97316" />}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>
                <TranslatedText>{orderType === "dine_in" ? "Dine In" : "Delivery"}</TranslatedText>
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 800, color: "#111" }}>
                {orderType === "dine_in" ? tableNumber : deliveryAddress}
              </p>
            </div>
          </div>
        )}

        {/* ── Itemized list ── */}
        <div style={{
          background: "white", borderRadius: 24,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          overflow: "hidden", marginBottom: 16,
        }}>
          <div style={{ padding: "18px 20px 12px" }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111", margin: 0 }}>
              <TranslatedText>What you ordered</TranslatedText>
            </h3>
          </div>
          {(orderData.items || []).map((item, idx) => {
            const isLast = idx === (orderData.items.length - 1);
            return (
              <div key={item.id ?? idx} style={{
                display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", gap: 12,
                padding: "12px 20px",
                borderTop: "1px solid #f3f4f6",
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>
                    {item.menu_item?.name ?? item.name}
                    <span style={{ color: "#9ca3af", fontWeight: 500, marginLeft: 6 }}>× {item.quantity}</span>
                  </span>
                  {item.notes && (
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <NotebookPen size={12} /> {item.notes}
                      </span>
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111", flexShrink: 0 }}>
                  {item.item_total?.toFixed(2)} AED
                </span>
              </div>
            );
          })}
          {/* Total row */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 20px", borderTop: "2px solid #f3f4f6",
          }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#111" }}>
              <TranslatedText>Total</TranslatedText>
            </span>
            <span style={{
              fontSize: 20, fontWeight: 900,
              background: "linear-gradient(135deg,#f97316,#ea580c)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {orderData.total_price?.toFixed(2)} AED
            </span>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={handleNewOrder}
            style={{
              width: "100%", padding: "16px 0", borderRadius: 999,
              background: "linear-gradient(135deg,#f97316,#ea580c)",
              border: "none", cursor: "pointer",
              color: "white", fontSize: 17, fontWeight: 800,
              boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
            }}
          >
            <TranslatedText>Start New Order</TranslatedText>
          </button>
          <button
            onClick={() => navigate(`/restaurant/${restaurantId}/menu`)}
            style={{
              width: "100%", padding: "16px 0", borderRadius: 999,
              background: "#f3f4f6", border: "none", cursor: "pointer",
              color: "#374151", fontSize: 17, fontWeight: 700,
            }}
          >
            <TranslatedText>Back to Menu</TranslatedText>
          </button>
        </div>
      </div>
      {ToastContainer}
    </div>
  );
}