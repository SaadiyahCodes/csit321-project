import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CategoryBar from "../../components/CategoryBar";
import MenuCard from "../../components/MenuCard";
import BottomNav from "../../components/BottomNav";
import api from "../../api";

export default function MenuPage() {
  const {restaurantId} = useParams(); //get restaurant ID from URL
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeNav, setActiveNav] = useState("menu");
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(()=> {
    fetchMenuItems();
  }, [restaurantId]);

  const fetchMenuItems = async () => {
    try {
      //fetch menu items based on restaurant
      const response = await api.get(`/api/menu/?restaurant_id=${restaurantId}`);
      setMenuItems(response.data);
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

  // when a card is clicked, go to dish preview page
  const onOpenDish = (item) => {
    navigate(`/restaurant/${restaurantId}/dish/${item.id}`);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading menu...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Responsive container: mobile = full width, desktop = centered */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
        {/* Top area */}
        <div className="rounded-3xl bg-yellow-300 h-10 sm:h-14" />

        {/* Category bar */}
        <div className="-mt-5">
          <CategoryBar active={activeCategory} onChange={setActiveCategory} />
        </div>

        {/* White sheet area */}
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

      {/* Bottom nav: fixed like app on mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0">
        <BottomNav active={activeNav} onChange={setActiveNav} />
      </div>

      <div className="h-20 sm:hidden" />
    </div>
  );
}