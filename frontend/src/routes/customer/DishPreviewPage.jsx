import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import api from "../../api";

export default function DishPreviewPage() {
  const { restaurantId, dishId } = useParams();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("menu");
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(()=> {
    fetchDishDetails();
  }, [dishId]);

  const fetchDishDetails = async () => {
    try {
      const response = await api.get(`/api/menu/${dishId}`);
      setItem(response.data);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-300 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-6 text-center">
          <p className="font-semibold text-gray-900">Loading...</p>
        </div>
      </div>      
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-yellow-300 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-6 text-center w-full max-w-sm shadow-sm">
          <p className="font-semibold text-gray-900">Dish not found</p>
          <button
            className="mt-4 px-5 py-2 rounded-full bg-orange-600 text-white font-bold"
            onClick={goBackToMenu}
          >
            Back to menu
          </button>
          <p className="mt-3 text-xs text-gray-500">
            Missing ID: <span className="font-mono">{dishId}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-300">
      <div className="mx-auto w-full max-w-md px-4 pt-4 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              • {item.name}
            </h1>
            {/*
            <span className="inline-flex mt-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {item.rating?.toFixed ? item.rating.toFixed(1) : item.rating}
            </span>
            */}
            <span className="inline-flex mt-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              ${item.price?.toFixed(2)}
            </span>
          </div>

          <button
            onClick={goBackToMenu}
            className="text-sm font-bold text-gray-900"
          >
            Back
          </button>
        </div>

        {/* White sheet */}
        <div className="mt-4 bg-white rounded-[32px] p-5 shadow-sm">
          <div className="flex justify-center">
            <div className="bg-gray-200 text-orange-600 font-extrabold rounded-full px-10 py-3 text-sm tracking-wide">
              DISH PREVIEW
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
              <p className="font-extrabold">Description:</p>
              <p className="text-gray-700 leading-relaxed">
                {item.description}
              </p>
            </div>
          )}

          {/* Text blocks */}
          <div className="mt-4 text-[13px] text-gray-900 space-y-4">
            {/*}
            <div>
              <p className="font-extrabold">Ingredients:</p>
              <p className="text-gray-700 leading-relaxed">
                {item.ingredients || "—"}
              </p>
            </div>
            */}

            <div>
              <p className="font-extrabold">Category:</p>
              <p className="text-gray-700 leading-relaxed">
                {item.category || "—"}
              </p>
            </div>

            <div>
              <p className="font-extrabold">Allergens:</p>
              <p className="text-gray-700 leading-relaxed">
                {item.allergens || "None listed"}
              </p>
            </div>

            {/*
            <div>
              <p className="font-extrabold">Nutrition (per serving):</p>
              <p className="text-gray-700 leading-relaxed">
                {item.nutrition || "—"}
              </p>
            </div>
            */}

            <div>
              <p className="font-extrabold">Availability:</p>
              <p className="text-gray-700 leading-relaxed">
                {item.is_available ? "✓ Available" : "✗ Currently unavailable"}
              </p>
            </div>

          </div>

          {/* Buttons */}
          <div className="mt-7 flex flex-col gap-3 items-center">
            <button 
              className="w-44 rounded-full bg-orange-600 text-white font-extrabold py-3 active:scale-[0.99]"
              disabled={!item.is_available}
              style={{ opacity: item.is_available ? 1 : 0.5 }}
            >
              Customize
            </button>
            <button 
              className="w-44 rounded-full bg-orange-600 text-white font-extrabold py-3 active:scale-[0.99]"
              disabled={!item.is_available}
              style={{ opacity: item.is_available ? 1 : 0.5 }}
            >
              Place Order
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
