// src/routes/customer/MenuPage.jsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CategoryBar from "../../components/CategoryBar";
import MenuCard from "../../components/MenuCard";
import BottomNav from "../../components/BottomNav";
import LanguageSelector from "../../components/LanguageSelector";
import Chatbot from "../../components/Chatbot";
import TranslatedText from "../../components/TranslatedText";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api";

export default function MenuPage() {
  const { restaurantId } = useParams();
  const { language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeNav, setActiveNav] = useState("menu");
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId, language]);

  const fetchMenuItems = async () => {
    setLoading(true);
    const restaurantRes = await api.get(`/api/restaurants/${restaurantId}`);
    setRestaurantName(restaurantRes.data.name);
    try {
      if (language !== 'en') {
        const response = await api.get(`/api/translate/menu/${restaurantId}/${language}`);
        console.log("🔍 Translated menu response:", response.data);
        setMenuItems(response.data.items);
      } else {
        const response = await api.get(`/api/menu/?restaurant_id=${restaurantId}`);
        console.log("🔍 Original menu response:", response.data);
        setMenuItems(response.data);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching menu:", err);
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (activeCategory === "all") return menuItems;
    return menuItems.filter((x) => x.category?.toLowerCase() === activeCategory);
  }, [activeCategory, menuItems]);

  const onAR = (item) => {
    if (!item.armodelurl) return alert("AR model not available for this item.");
    alert(`AR Preview: ${item.title}\n${item.armodelurl}`);
  };

  const onOpenDish = (item) => {
    navigate(`/restaurant/${restaurantId}/dish/${item.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <TranslatedText>Loading menu...</TranslatedText>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Bar with Language Selector */}
        <div className="rounded-3xl bg-yellow-300 flex items-center justify-between px-6" style={{ paddingTop: '20px', paddingBottom: '28px' }}>
          <div style={{ flex: 1 }}></div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900" style={{ flex: 2, textAlign: 'center' }}>
            {restaurantName ? `${restaurantName} - Menu` : "Menu"}
          </h1>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <LanguageSelector variant="compact" />
        </div>
      </div>
        <div className="mt-3">
          <CategoryBar active={activeCategory} onChange={setActiveCategory} />
        </div>

        <div className="mt-4 bg-white rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onAR={onAR}
                onOpen={onOpenDish}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0">
        <BottomNav 
          active={activeNav} 
          onChange={setActiveNav}
          onChatToggle={() => setIsChatOpen(!isChatOpen)}
        />
      </div>

      {/* Chatbot Component */}
      <Chatbot 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </div>
  );
}