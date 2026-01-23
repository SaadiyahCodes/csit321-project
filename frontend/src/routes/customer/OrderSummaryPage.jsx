// src/routes/customer/OrderSummaryPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import BottomNav from "../../components/BottomNav";
import TranslatedText from "../../components/TranslatedText";
import { useSession } from "../../context/SessionContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api";

export default function OrderSummaryPage() {
  const navigate = useNavigate();
  const { sessionId, selectionId, restaurantId } = useSession();
  const { tSync } = useLanguage();
  const [activeNav, setActiveNav] = useState("orders");
  
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (selectionId && sessionId) {
      finalizeOrder();
    }
  }, [selectionId, sessionId]);

  const finalizeOrder = async () => {
    setFinalizing(true);
    
    try {
      const response = await api.post(
        `/api/selections/${selectionId}/finalize?session_id=${sessionId}`
      );
      setOrderData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error finalizing order:", err);
      alert(err.response?.data?.detail || tSync("Failed to finalize order"));
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

  if (loading || finalizing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="font-semibold">
            <TranslatedText>Finalizing your order...</TranslatedText>
          </p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="font-semibold text-red-600">
          <TranslatedText>Failed to load order</TranslatedText>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-12 px-4 text-center">
        <CheckCircle size={64} className="mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold mb-2">
          <TranslatedText>Order Placed!</TranslatedText>
        </h1>
        <p className="text-orange-100">
          <TranslatedText>Show this QR code to the waiter</TranslatedText>
        </p>
      </div>

      {/* Order Details */}
      <div className="max-w-2xl mx-auto px-4 -mt-8">
        {/* QR Code Card */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
          <h2 className="text-center font-bold text-lg mb-4">
            <TranslatedText>Scan to Confirm Order</TranslatedText>
          </h2>
          <div className="flex justify-center">
            <img
              src={orderData.qr_code}
              alt="Order QR Code"
              className="w-64 h-64 border-4 border-orange-200 rounded-2xl"
            />
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
          <h3 className="font-extrabold text-lg mb-4">
            <TranslatedText>Order Summary</TranslatedText>
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                <TranslatedText>Order ID</TranslatedText>
              </span>
              <span className="font-bold">#{orderData.selection_id}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                <TranslatedText>Items</TranslatedText>
              </span>
              <span className="font-bold">{orderData.item_count}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                <TranslatedText>Ordered At</TranslatedText>
              </span>
              <span className="font-bold">
                {new Date(orderData.finalized_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-xl font-extrabold">
                  <TranslatedText>Total</TranslatedText>
                </span>
                <span className="text-2xl font-extrabold text-orange-600">
                  ${orderData.total_price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleNewOrder}
            className="w-full bg-orange-600 text-white py-4 rounded-full font-extrabold"
          >
            <TranslatedText>Start New Order</TranslatedText>
          </button>
          
          <button
            onClick={() => navigate(`/restaurant/${restaurantId}/menu`)}
            className="w-full bg-gray-200 text-gray-900 py-4 rounded-full font-bold"
          >
            <TranslatedText>Back to Menu</TranslatedText>
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0">
        <BottomNav active={activeNav} onChange={setActiveNav} />
      </div>
    </div>
  );
}