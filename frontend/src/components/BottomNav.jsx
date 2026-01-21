//src/components/BottomNav.jsx
import { Home, ShoppingCart, MessageCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { SessionContext } from "../context/SessionContext";

//Always show 3 buttons, but disable cart/chat on home page
export default function BottomNav({ active, onChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Safely get session context (might be null if outside SessionProvider)
  const sessionContext = useContext(SessionContext);
  const restaurantId = sessionContext?.restaurantId;

  const handleNavClick = (id) => {
    if (id === "home") {
      navigate("/");
      onChange?.("home");
    } else if (id === "cart") {
      if (!restaurantId) {
        alert("Please select a restaurant first");
        return;
      }
      navigate(`/restaurant/${restaurantId}/cart`);
      onChange?.("cart");
    } else if (id === "chat") {
      if (!restaurantId) {
        alert("Please select a restaurant first");
        return;
      }
      navigate(`/restaurant/${restaurantId}/chat`);
      onChange?.("chat");
    }
  };

  const isInRestaurant = !!restaurantId;

  return (
    <div className="bg-orange-600 h-16 flex justify-around items-center px-4 shadow-[0_-6px_20px_rgba(0,0,0,0.12)]">
      <button
        onClick={() => handleNavClick("home")}
        className={`w-11 h-11 flex items-center justify-center rounded-xl ${
          active === "home" ? "bg-white/15" : ""
        }`}
      >
        <Home className="text-white" size={22} />
      </button>

      <button
        onClick={() => handleNavClick("cart")}
        disabled={!isInRestaurant}
        className={`w-11 h-11 flex items-center justify-center rounded-xl ${
          active === "cart" ? "bg-white/15" : ""
        } ${!isInRestaurant ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <ShoppingCart className="text-white" size={22} />
      </button>

      <button
        onClick={() => handleNavClick("chat")}
        disabled={!isInRestaurant}
        className={`w-11 h-11 flex items-center justify-center rounded-xl ${
          active === "chat" ? "bg-white/15" : ""
        } ${!isInRestaurant ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <MessageCircle className="text-white" size={22} />
      </button>
    </div>
  );
}