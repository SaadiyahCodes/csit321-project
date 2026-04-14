//src/components/RestaurantCard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TranslatedText from "./TranslatedText";

export default function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => navigate(`/restaurant/${restaurant.id}/menu`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: "white",
        borderRadius: "24px",
        boxShadow: hovered
          ? "0 12px 28px rgba(0,0,0,0.13)"
          : "0 1px 3px rgba(0,0,0,0.1)",
        overflow: "hidden",
        cursor: "pointer",
        border: "1px solid #f3f4f6",
        transform: hovered ? "scale(1.03)" : "scale(1)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div style={{ position: "relative", height: "120px", overflow: "hidden" }}>
        <img
          src={restaurant.image}
          alt={restaurant.name}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hovered ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.3s ease",
          }}
        />
      </div>

      <div style={{ padding: "12px" }}>
        <h3 style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>
          {restaurant.name}
        </h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>
            <TranslatedText>{restaurant.category}</TranslatedText>
          </span>
          <span style={{
            fontSize: "12px", backgroundColor: "#ffedd5", color: "#ea580c",
            padding: "4px 8px", borderRadius: "9999px",
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            ⭐ {restaurant.rating}
          </span>
        </div>
      </div>
    </div>
  );
}