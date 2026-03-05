// src/components/MenuCard.jsx
import { Plus, Minus } from "lucide-react";

export default function MenuCard({ item, onAR, onOpen, onAddToCart, onUpdateQty, cartQty = 0 }) {
  if (!item) return null;
  const handleAdd = (e) => {
    e.stopPropagation();
    onAddToCart(item, 1); // fire and forget
  };

  const handleMinus = (e) => {
    e.stopPropagation();
    onUpdateQty(item, cartQty - 1); // fire and forget
  };

  const handlePlus = (e) => {
    e.stopPropagation();
    onUpdateQty(item, cartQty + 1); // fire and forget
  };

  return (
    <div
      dir="ltr"
      onClick={() => onOpen(item)}
      className="cursor-pointer text-left bg-white rounded-[28px] overflow-hidden shadow-sm w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col"
      style={{ height: 340 }} // fixed card height
      role="button"
      tabIndex={0}
    >
      {/* Image — fixed height */}
      <div className="rounded-[24px] overflow-hidden mx-3 mt-3 flex-shrink-0" style={{ height: 160 }}>
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* Content — fills remaining space */}
      <div className="flex flex-col flex-1 px-4 pt-3 pb-3">
        {/* Name — fixed 2-line clamp so cards stay uniform */}
        <h3
          className="text-[15px] font-extrabold text-gray-900 leading-tight"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.4em",
          }}
        >
          {item.name}
        </h3>

        {/* Description — 2-line clamp */}
        <p
          className="text-[11px] text-gray-500 mt-1 leading-snug"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.8em",
          }}
        >
          {item.description || " "}
        </p>

        {/* Price + AR */}
        <div className="flex items-center justify-between mt-auto pt-2">
          {item.price && (
            <span className="text-[15px] font-bold text-orange-500">
              {item.price.toFixed(2)} AED
            </span>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAR(item); }}
            className="text-[11px] text-orange-400 border border-orange-200 flex items-center gap-1 px-2 py-1 rounded-full hover:bg-orange-50 hover:text-orange-500 transition-colors"
          >
            AR <span className="text-sm leading-none">⤢</span>
          </button>
        </div>

        {/* Qty controls or Add button */}
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          {cartQty === 0 ? (
            <button
              onClick={handleAdd}
              disabled={!item.is_available}
              className="w-full py-2 rounded-full bg-orange-500 text-white text-[13px] font-bold transition-all duration-200 hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Plus size={14} />
              {item.is_available ? "Add" : "Unavailable"}
            </button>
          ) : (
            <div className="flex items-center justify-between bg-orange-50 rounded-full px-2 py-1">
              <button
                onClick={handleMinus}
                className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="font-bold text-orange-600 text-[15px] w-8 text-center">
                {cartQty}
              </span>
              <button
                onClick={handlePlus}
                className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}