// src/components/DishBottomSheet.jsx
import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TranslatedText from "./TranslatedText";
import { useLanguage } from "../context/LanguageContext";

export default function DishBottomSheet({ item, onClose, onAddToCart, initialQty = 0 }) {
  const { tSync } = useLanguage();
  const navigate = useNavigate();
  const [qty, setQty] = useState(initialQty > 0 ? initialQty : 1);
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAdd = async () => {
    setAdding(true);
    await onAddToCart(item, qty, notes || null);
    setAdding(false);
    handleClose();
  };

  const isLikelyARCapable = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const onAR = () => {
    console.log("onAR fired, ar_model_url:", item.ar_model_url);
    if (!item.ar_model_url) { alert("AR model not available for this item."); return; }
    if (!isLikelyARCapable()) { alert("AR Preview is only available on mobile and tablet devices."); return; }
    navigate(`/ar?model=${encodeURIComponent(item.ar_model_url)}`);
  };

  if (!item) return null;

  const totalPrice = item.price ? (item.price * qty).toFixed(2) : null;
  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const isAvailable = item.is_available !== false;

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{
        position: "fixed", inset: 0, zIndex: 800,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)",
        opacity: visible ? 1 : 0, transition: "opacity 0.3s ease",
      }} />

      {/* Sheet */}
      <div dir="ltr" style={{
        position: "fixed", bottom: 0, left: "50%", zIndex: 801,
        width: "100%", maxWidth: 880,
        background: "white", borderRadius: "28px 28px 0 0",
        maxHeight: "92vh", overflowY: "auto",
        transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
      }}>

        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: "#e5e7eb" }} />
        </div>

        {/* Close */}
        <button onClick={handleClose} style={{
          position: "absolute", top: 16, right: 16, zIndex: 10,
          background: "#f3f4f6", border: "none", cursor: "pointer",
          width: 32, height: 32, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280",
        }}>
          <X size={16} />
        </button>

        {/* ── Two-col on desktop, stacked on mobile ── */}
        <div className="bs-layout" style={{ display: "flex", flexWrap: "wrap", padding: "8px 0 36px" }}>

          {/* LEFT: image */}
          {item.image_url && (
            <div className="bs-img-col" style={{ width: "100%", flexShrink: 0 }}>
              <div style={{ margin: "0 20px 16px", borderRadius: 20, overflow: "hidden", position: "relative" }}>
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="dish-bs-img"
                  style={{ width: "100%", objectFit: "cover", display: "block", height: 220 }}
                />
                {!isAvailable && (
                  <div style={{
                    position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{
                      background: "#ef4444", color: "white", fontWeight: 800,
                      fontSize: 15, letterSpacing: "0.06em",
                      padding: "6px 18px", borderRadius: 999, textTransform: "uppercase",
                    }}>Sold Out</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RIGHT: all details */}
          <div className="bs-detail-col" style={{ flex: 1, minWidth: 0, padding: "0 24px" }}>

            {/* ── Name — centred ── */}
            <h2 style={{
              fontSize: 22, fontWeight: 800, color: "#111",
              margin: "0 0 10px", lineHeight: 1.3, textAlign: "center",
            }}>
              {item.name}
            </h2>

            {/* ── Description — centred ── */}
            {item.description && (
              <p style={{
                fontSize: 15, color: "#555", lineHeight: 1.7,
                margin: "0 0 12px", textAlign: "center",
              }}>
                {item.description}
              </p>
            )}

            {/* ── AR Preview — centred ── */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <button onClick={onAR} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#fff7ed", border: "1.5px solid #fed7aa",
                borderRadius: 10, padding: "8px 14px",
                color: "#f97316", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>
                <span style={{ fontSize: 16 }}>⤢</span>
                AR Preview
                {!isLikelyARCapable() && (
                  <span style={{ fontSize: 12, color: "#fb923c", fontWeight: 400 }}>· Mobile Only</span>
                )}
              </button>
            </div>

            {/* ── Category + Ingredients — both rows left-aligned from same point ── */}
            {(item.category || item.ingredients) && (
              <div style={{
                background: "#fafaf8", borderRadius: 12, padding: "10px 14px",
                marginBottom: 14, width: "100%", boxSizing: "border-box",
              }}>
                {item.category && (
                  <div style={{ display: "flex", gap: 0, marginBottom: item.ingredients ? 6 : 0 }}>
                    <span style={{ fontWeight: 700, color: "#374151", fontSize: 14, width: 100, flexShrink: 0 }}>
                      <TranslatedText>Category</TranslatedText>:
                    </span>
                    <span style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.5 }}>
                      {capitalize(item.category)}
                    </span>
                  </div>
                )}
                {item.ingredients && (
                  <div style={{ display: "flex", gap: 0 }}>
                    <span style={{ fontWeight: 700, color: "#374151", fontSize: 14, width: 100, flexShrink: 0 }}>
                      <TranslatedText>Ingredients</TranslatedText>:
                    </span>
                    <span style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.5 }}>
                      {item.ingredients}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Allergens — title + tags both centred ── */}
            <div style={{ marginBottom: 14, textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>
                <TranslatedText>Allergens</TranslatedText>
              </p>
              {item.allergens && item.allergens.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {item.allergens.map((a, i) => (
                    <span key={i} style={{
                      background: "#fee2e2", color: "#dc2626",
                      border: "1.5px solid #fca5a5",
                      padding: "5px 14px", borderRadius: 999,
                      fontSize: 13, fontWeight: 500, textTransform: "capitalize",
                    }}>{a}</span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
                  <TranslatedText>None listed</TranslatedText>
                </p>
              )}
            </div>

            {/* ── Special Instructions — full width ── */}
            {isAvailable && (
              <div style={{ marginBottom: 18, width: "100%", boxSizing: "border-box" }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 8, textAlign: "center" }}>
                  <TranslatedText>Special Instructions</TranslatedText>
                  <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: 4 }}>
                    (<TranslatedText>optional</TranslatedText>)
                  </span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={tSync("e.g. No onions, extra spicy...")}
                  rows={2}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    borderRadius: 12, padding: "10px 14px",
                    fontSize: 14, border: "1.5px solid #e5e7eb",
                    outline: "none", resize: "none",
                    fontFamily: "inherit", color: "#111",
                  }}
                  onFocus={e => e.target.style.borderColor = "#f97316"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>
            )}

            {/* ── Qty + Add — centred ── */}
            {isAvailable ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#fff7ed", borderRadius: 999, padding: "6px 10px",
                }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: qty === 1 ? "#e5e7eb" : "#f97316",
                    border: "none", cursor: qty === 1 ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: qty === 1 ? "#9ca3af" : "white",
                  }}><Minus size={14} /></button>
                  <span style={{ fontWeight: 800, fontSize: 18, color: "#111", minWidth: 20, textAlign: "center" }}>{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "#f97316", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "white",
                  }}><Plus size={14} /></button>
                </div>

                <button onClick={handleAdd} disabled={adding} style={{
                  padding: "13px 28px", borderRadius: 999,
                  background: "linear-gradient(135deg,#f97316,#ea580c)",
                  border: "none", cursor: "pointer",
                  color: "white", fontSize: 16, fontWeight: 800,
                  display: "flex", alignItems: "center", gap: 10,
                  boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
                  opacity: adding ? 0.7 : 1, whiteSpace: "nowrap",
                }}>
                  {adding ? <TranslatedText>Adding…</TranslatedText> : (
                    <>
                      <TranslatedText>Add to Cart</TranslatedText>
                      {totalPrice && <span style={{ opacity: 0.85, fontSize: 14 }}>· {totalPrice} AED</span>}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div style={{
                background: "#fee2e2", borderRadius: 12, padding: "12px 16px",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 18 }}>🚫</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#dc2626" }}>
                  <TranslatedText>This item is currently sold out</TranslatedText>
                </span>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @media (min-width: 640px) {
            .bs-img-col { width: 280px !important; flex-shrink: 0 !important; align-self: flex-start; }
            .bs-img-col > div { margin: 16px 0 0 20px !important; position: sticky; top: 16px; }
            .dish-bs-img { height: 300px !important; }
            .bs-detail-col { padding-top: 8px !important; }
          }
        `}</style>
      </div>
    </>
  );
}