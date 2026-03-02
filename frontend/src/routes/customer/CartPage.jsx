// src/routes/customer/CartPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus } from "lucide-react";
import BottomNav from "../../components/BottomNav";
import TranslatedText from "../../components/TranslatedText";
import { useSession } from "../../context/SessionContext";
import { useLanguage } from "../../context/LanguageContext";
import Chatbot from "../../components/Chatbot";
import api from "../../api";

export default function CartPage() {
  const navigate = useNavigate();
  const { sessionId, selectionId, restaurantId, loading: sessionLoading } = useSession();
  const { language, tSync } = useLanguage();
  const [activeNav, setActiveNav] = useState("cart");
  
  const [selection, setSelection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (selectionId && sessionId) {
      fetchCart();
    }
  }, [selectionId, sessionId, language]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/api/selections/${selectionId}?session_id=${sessionId}`
      );
      const cartData = response.data;

      // If not English, translate menu item names and descriptions
      if (language !== 'en' && cartData.items) {
        for (let item of cartData.items) {
          if (item.menu_item.name) {
            const nameResult = await api.post('/api/translate/text', {
              text: item.menu_item.name,
              target_lang: language,
              source_lang: 'en'
            });
            if (nameResult.data.success) {
              item.menu_item.name = nameResult.data.translated_text;
            }
          }
        }
      }

      setSelection(cartData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    
    try {
      if (newQuantity === 0) {
        await api.delete(
          `/api/selections/items/${itemId}?session_id=${sessionId}`
        );
      } else {
        await api.put(
          `/api/selections/items/${itemId}?session_id=${sessionId}`,
          { quantity: newQuantity }
        );
      }
      
      await fetchCart();
    } catch (err) {
      console.error("Error updating item:", err);
      alert(tSync("Failed to update item"));
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const removeItem = async (itemId) => {
    if (!confirm(tSync("Remove this item from cart?"))) return;
    
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    
    try {
      await api.delete(
        `/api/selections/items/${itemId}?session_id=${sessionId}`
      );
      await fetchCart();
    } catch (err) {
      console.error("Error removing item:", err);
      alert(tSync("Failed to remove item"));
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleCheckout = () => {
    navigate(`/restaurant/${restaurantId}/order-summary`);
  };

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="font-semibold">
          <TranslatedText>Loading cart...</TranslatedText>
        </p>
      </div>
    );
  }

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
            className="bg-orange-600 text-white px-6 py-3 rounded-full font-bold"
          >
            <TranslatedText>Browse Menu</TranslatedText>
          </button>
        </div>
        <div className="fixed bottom-0 left-0 right-0">
          <BottomNav active={activeNav} onChange={setActiveNav} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/restaurant/${restaurantId}/menu`)}
              className="text-2xl font-bold text-orange-600"
            >
              ←
            </button>
            <h1 className="text-xl font-extrabold">
              <TranslatedText>Your Cart</TranslatedText>
            </h1>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {selection.items.map((item) => (
            <div
              key={item.id}
              className="p-4 border-b last:border-b-0 flex gap-4"
            >
              {/* Item Image */}
              {item.menu_item.image_url && (
                <img
                  src={item.menu_item.image_url}
                  alt={item.menu_item.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              )}

              {/* Item Details */}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{item.menu_item.name}</h3>
                <p className="text-sm text-gray-600">${item.menu_item.price.toFixed(2)} each</p>
                
                {item.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    {tSync("Note")}: {item.notes}
                  </p>
                )}

                {/* Quantity Controls */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={updating[item.id]}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center disabled:opacity-50"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold text-gray-900 w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={updating[item.id]}
                    className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center disabled:opacity-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Item Total & Remove */}
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={updating[item.id]}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 size={20} />
                </button>
                <span className="font-bold text-gray-900">
                  ${item.item_total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">
              <TranslatedText>Subtotal</TranslatedText>
            </span>
            <span className="font-semibold">${selection.total_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">
              <TranslatedText>Items</TranslatedText>
            </span>
            <span className="font-semibold">{selection.item_count}</span>
          </div>
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-extrabold">
                <TranslatedText>Total</TranslatedText>
              </span>
              <span className="text-2xl font-extrabold text-orange-600">
                ${selection.total_price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-14 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleCheckout}
            className="w-full bg-orange-600 text-white py-4 rounded-full font-extrabold text-lg"
          >
            <TranslatedText>Proceed to Checkout</TranslatedText>
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0">
        <BottomNav active={activeNav} onChange={setActiveNav}
         onChatToggle={() => setIsChatOpen(!isChatOpen)} 
        />

        <Chatbot 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />
      </div>
    </div>
  );
}