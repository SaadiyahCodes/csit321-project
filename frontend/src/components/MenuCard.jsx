export default function MenuCard({ item, onAR, onOpen }) {
  return (
    <div
      onClick={() => onOpen(item)}
      className="cursor-pointer text-left bg-white rounded-[28px] overflow-hidden shadow-sm w-full transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
      role="button"
      tabIndex={0}
    >
      <div className="p-4">
        <div className="rounded-[24px] overflow-hidden">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-44 sm:h-48 object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-[18px] font-extrabold text-gray-900 leading-tight">
              {item.name}
            </h3>
            <p className="text-[11px] text-gray-600 mt-1 leading-snug">
              {item.description}
            </p>
          </div>
          {/*
          <span className="bg-orange-500 text-white text-[11px] font-bold px-2 py-1 rounded-full h-fit">
            {item.rating.toFixed(1)}
          </span>
          */}
        </div>
        {/* Price Display */}
        {item.price && (
          <div className="mt-2">
            <span className="text-lg font-bold text-yellow-600">
              {item.price.toFixed(2)} AED
            </span>
          </div>
        )}
        
        <div className="mt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAR(item);
            }}
            className="text-[11px] text-gray-700 flex items-center gap-2"
          >
            AR Preview <span className="text-base leading-none">⤢</span>
          </button>
        </div>
      </div>
    </div>
  );
}
