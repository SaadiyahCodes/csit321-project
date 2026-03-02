// src/routes/customer/DishPreviewPage.jsx
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react"; 
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import TranslatedText from "../../components/TranslatedText";
import { useSession } from "../../context/SessionContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api";

export default function DishPreviewPage() {
  const { restaurantId, dishId } = useParams();
  const navigate = useNavigate();
  const { sessionId, selectionId, loading: sessionLoading } = useSession();
  const { language, tSync } = useLanguage();
  const [activeNav, setActiveNav] = useState("menu");
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchDishDetails();
  }, [dishId, language]);

  const fetchDishDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/menu/${dishId}`);
      const dishData = response.data;

      // If not English, translate the dish
      if (language !== 'en') {
        const nameResult = await api.post('/api/translate/text', {
          text: dishData.name,
          target_lang: language,
          source_lang: 'en'
        });
        const descResult = await api.post('/api/translate/text', {
          text: dishData.description || '',
          target_lang: language,
          source_lang: 'en'
        });

        if (nameResult.data.success) {
          dishData.name = nameResult.data.translated_text;
        }
        if (descResult.data.success && dishData.description) {
          dishData.description = descResult.data.translated_text;
        }
      }

      setItem(dishData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching dish: ", err);
      setError("Dish not found");
      setLoading(false);
    }
  };

  const goBackToMenu = () => {
    navigate(`/restaurant/${restaurantId}/menu`);
  };

  const handleCustomize = () => {
    navigate(`/restaurant/${restaurantId}/customize/${dishId}`);
  };

  const handleQuickOrder = async () => {
    if (!selectionId || !item) return;

    setAddingToCart(true);
    try {
      await api.post(
        `/api/selections/${selectionId}/items?session_id=${sessionId}`,
        {
          menu_item_id: item.id,
          quantity: 1,
          notes: null
        }
      );

      alert(tSync("Item added to cart!"));
      navigate(`/restaurant/${restaurantId}/cart`);
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert(tSync("Failed to add item to cart"));
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #fbbf24, #f59e0b)' }}>
        <div className="bg-white rounded-3xl p-6 text-center">
          <p className="font-semibold text-gray-900">
            <TranslatedText>Loading...</TranslatedText>
          </p>
        </div>
      </div>      
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-yellow-300 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-6 text-center w-full max-w-sm shadow-sm">
          <p className="font-semibold text-gray-900">
            <TranslatedText>Dish not found</TranslatedText>
          </p>
          <button
            className="mt-4 px-5 py-2 rounded-full bg-orange-600 text-white font-bold"
            onClick={goBackToMenu}
          >
            <TranslatedText>Back to menu</TranslatedText>
          </button>
          <p className="mt-3 text-xs text-gray-500">
            Missing ID: <span className="font-mono">{dishId}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #fbbf24, #f59e0b)' }}>
    <div className="mx-auto w-full max-w-lg px-4 pt-4 pb-24">
      
      {/* White sheet - NOW INCLUDES HEADER */}
      <div className="mt-4 bg-white rounded-[32px] p-5 shadow-sm">
        
        {/* Header - MOVED INSIDE WHITE BOX */}
        <div className="flex items-start gap-3 mb-4">
          <button
            onClick={goBackToMenu}
            className="text-gray-900 hover:text-orange-600 transition-colors mt-1"
          >
            <ArrowLeft size={24} />
          </button>
          
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              {item.name}
            </h1>
            <span className="inline-flex mt-2 -ml-20 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              ${item.price?.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex justify-center">
            <div className="bg-gray-200 text-orange-600 font-extrabold rounded-full px-10 py-3 text-sm tracking-wide">
              <TranslatedText>DISH PREVIEW</TranslatedText>
            </div>
          </div>

          {/* Image */}
          {item.image_url && (
            <div className="mt-5 rounded-[28px] overflow-hidden">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-56 object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div className="mt-4 text-[13px] text-gray-900">
              <p className="font-extrabold">
                <TranslatedText>Description:</TranslatedText>
              </p>
              <p className="text-gray-700 leading-relaxed">
                {item.description}
              </p>
            </div>
          )}

          {/* Text blocks */}
          <div className="mt-4 text-[13px] text-gray-900 space-y-4">
            <div>
              <p className="font-extrabold">
                <TranslatedText>Category:</TranslatedText>
              </p>
              <p className="text-gray-700 leading-relaxed">
                {item.category || "—"}
              </p>
            </div>

            <div>
              <p className="font-extrabold">
                <TranslatedText>Allergens:</TranslatedText>
              </p>
              <p className="text-gray-700 leading-relaxed">
                {item.allergens && item.allergens.length > 0
                  ? item.allergens.join(", ")
                  : tSync("None listed")}
              </p>
            </div>

            <div>
              <p className="font-extrabold">
                <TranslatedText>Availability:</TranslatedText>
              </p>
              <p className="text-gray-700 leading-relaxed">
                {item.is_available ? (
                  <TranslatedText>✓ Available</TranslatedText>
                ) : (
                  <TranslatedText>✗ Currently unavailable</TranslatedText>
                )}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-7 flex flex-col gap-3 items-center">
            <button
              onClick={handleCustomize}
              className="w-44 rounded-full bg-orange-600 text-white font-extrabold py-3 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!item.is_available}
            >
              <TranslatedText>Customize</TranslatedText>
            </button>
            <button 
              onClick={handleQuickOrder}
              className="w-44 rounded-full bg-orange-600 text-white font-extrabold py-3 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!item.is_available || addingToCart}
            >
              <TranslatedText>
                {addingToCart ? "Adding..." : "Place Order"}
              </TranslatedText>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden">
        <BottomNav active={activeNav} onChange={setActiveNav} />
      </div>
    </div>
  );
}