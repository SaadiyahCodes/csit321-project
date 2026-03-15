// src/components/MenuCard.jsx
import { Plus, Minus } from "lucide-react";

export default function MenuCard({ item, onAR, onOpen, onAddToCart, onUpdateQty, cartQty = 0 }) {
  if (!item) return null;

  const handleAdd = (e) => { e.stopPropagation(); onAddToCart(item, 1); };
  const handleMinus = (e) => { e.stopPropagation(); onUpdateQty(item, cartQty - 1); };
  const handlePlus = (e) => { e.stopPropagation(); onUpdateQty(item, cartQty + 1); };

  return (
    <>
      <style>{`
        @keyframes borderSpin {
          0%   { --angle: 0deg; }
          100% { --angle: 360deg; }
        }
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        .ar-btn {
          position: relative;
          background: rgba(249,115,22,0.06);
          border: none;
          cursor: pointer;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          color: #f97316;
          letter-spacing: 0.04em;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: background 0.2s ease, transform 0.2s ease, color 0.2s ease;
          isolation: isolate;
        }
        .ar-btn::before {
          content: '';
          position: absolute;
          inset: -1.5px;
          border-radius: 999px;
          background: conic-gradient(from var(--angle), #f97316, #fbbf24, #fde68a, #f59e0b, #ea580c, #f97316);
          animation: borderSpin 2.4s linear infinite;
          z-index: -1;
        }
        .ar-btn::after {
          content: '';
          position: absolute;
          inset: 1.5px;
          border-radius: 999px;
          background: rgba(255,255,255,0.92);
          z-index: -1;
          transition: background 0.2s ease;
        }
        .ar-btn:hover::after {
          background: rgba(255,243,232,0.95);
        }
        .ar-btn:hover {
          background: rgba(249,115,22,0.18);
          color: #ea580c;
          transform: scale(1.08);
        }
      `}</style>

      <div
        dir="ltr"
        onClick={() => onOpen(item)}
        role="button"
        tabIndex={0}
        style={{
          cursor: "pointer",
          textAlign: "left",
          background: "white",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.12)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.07)";
        }}
      >
        {/* Image */}
        <div style={{ borderRadius: 22, overflow: "hidden", margin: "10px 10px 0", flexShrink: 0, height: 155 }}>
          <img
            src={item.image_url}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease", display: "block" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          />
        </div>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "10px 14px 12px" }}>

          {/* Name */}
          <h3 style={{
            fontSize: 16, fontWeight: 800, color: "#111",
            lineHeight: 1.25, margin: "0 0 2px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.5em",
          }}>
            {item.name}
          </h3>

          {/* Description */}
          <p style={{
            fontSize: 14, color: "#999",
            lineHeight: 1.5, margin: "0 0 4px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "3.0em",
          }}>
            {item.description || " "}
          </p>

          {/* Price + AR */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 2 }}>
            {item.price && (
              <span style={{ fontSize: 16, fontWeight: 800, color: "#f97316" }}>
                {item.price.toFixed(2)} AED
              </span>
            )}
            <button
              type="button"
              className="ar-btn"
              onClick={(e) => { e.stopPropagation(); onAR(item); }}
            >
              AR <span style={{ fontSize: 14, lineHeight: 1 }}>⤢</span>
            </button>
          </div>

          {/* Add / Qty controls */}
          <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
            {cartQty === 0 ? (
              <button
                onClick={handleAdd}
                disabled={!item.is_available}
                style={{
                  width: "100%", padding: "9px 0", borderRadius: 999,
                  background: item.is_available
                    ? "linear-gradient(135deg,#f97316,#ea580c)"
                    : "#e5e7eb",
                  border: "none", cursor: item.is_available ? "pointer" : "not-allowed",
                  color: item.is_available ? "white" : "#aaa",
                  fontSize: 14, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={e => { if (item.is_available) e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <Plus size={14} />
                {item.is_available ? "Add" : "Unavailable"}
              </button>
            ) : (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#fff7ed", borderRadius: 999, padding: "3px 5px",
              }}>
                <button onClick={handleMinus} style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg,#f97316,#ea580c)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Minus size={14} color="white" />
                </button>
                <span style={{ fontWeight: 800, color: "#f97316", fontSize: 16, width: 30, textAlign: "center" }}>
                  {cartQty}
                </span>
                <button onClick={handlePlus} style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg,#f97316,#ea580c)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Plus size={14} color="white" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}