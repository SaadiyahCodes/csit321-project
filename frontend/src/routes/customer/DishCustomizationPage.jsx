// src/routes/customer/DishCustomizationPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { useSession } from "../../context/SessionContext";
import api from "../../api";

export default function DishCustomizationPage() {
  const navigate = useNavigate();
  const { restaurantId, dishId } = useParams();
  const { sessionId, selectionId, loading: sessionLoading } = useSession();
  const [activeNav, setActiveNav] = useState("menu");

  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchDish();
  }, [dishId]);

  const fetchDish = async () => {
    try {
      const response = await api.get(`/api/menu/${dishId}`);
      setDish(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching dish:", err);
      alert("Dish not found");
      navigate(`/restaurant/${restaurantId}/menu`);
    }
  };

  const handleAddToCart = async () => {
    if (!selectionId || !dish) return;

    setAddingToCart(true);
    try {
      await api.post(
        `/api/selections/${selectionId}/items?session_id=${sessionId}`,
        {
          menu_item_id: dish.id,
          quantity: qty,
          notes: notes || null
        }
      );

      alert("Item added to cart!");
      navigate(`/restaurant/${restaurantId}/cart`);
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert(err.response?.data?.detail || "Failed to add item to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading || sessionLoading || !dish) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="font-semibold">Loading...</p>
      </div>
    );
  }

  const totalPrice = dish.price * qty;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header with back button */}
      <div className="flex items-center gap-3 p-4 bg-white shadow-sm sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-2xl font-bold text-orange-600"
        >
          ←
        </button>
        <h1 className="text-lg font-extrabold">{dish.name}</h1>
      </div>

      {/* Dish image & info */}
      <div className="px-4 mt-4">
        {dish.image_url && (
          <div className="rounded-3xl overflow-hidden shadow-md">
            <img
              src={dish.image_url}
              alt={dish.name}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        <div className="flex justify-between items-center mt-3">
          <span className="inline-block bg-orange-600 text-white text-sm font-bold px-3 py-1 rounded-full">
            ${dish.price.toFixed(2)}
          </span>
          <span className="text-sm text-gray-600">{dish.category}</span>
        </div>

        {dish.description && (
          <p className="mt-4 text-gray-700 text-sm">{dish.description}</p>
        )}

        {dish.allergens && dish.allergens.length > 0 && (
          <p className="mt-2 text-gray-700 text-sm">
            <strong>Allergens:</strong> {dish.allergens.join(", ")}
          </p>
        )}
      </div>

      {/* Quantity selector */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={() => setQty(Math.max(1, qty - 1))}
          className="bg-orange-600 text-white w-10 h-10 rounded-full text-lg font-bold"
        >
          −
        </button>
        <span className="text-lg font-bold">{qty}</span>
        <button
          onClick={() => setQty(qty + 1)}
          className="bg-orange-600 text-white w-10 h-10 rounded-full text-lg font-bold"
        >
          +
        </button>
      </div>

      {/* Special instructions */}
      <div className="px-4 mt-6">
        <label className="block text-sm font-bold mb-2">
          Special Instructions (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., No onions, extra spicy..."
          className="w-full rounded-2xl p-3 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
          rows={3}
        />
      </div>

      {/* Footer with total */}
      <div className="fixed bottom-14 left-0 right-0 bg-white p-4 border-t shadow-lg">
        <div className="flex justify-between items-center">
          <span className="font-extrabold text-lg">
            ${totalPrice.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="bg-orange-600 text-white px-6 py-2 rounded-full font-bold disabled:opacity-50"
          >
            {addingToCart ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0">
        <BottomNav active={activeNav} onChange={setActiveNav} />
      </div>
    </div>
  );
}