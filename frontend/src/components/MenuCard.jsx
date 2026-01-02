export default function MenuCard({ item, onAR, onOpen }) {
  return (
    <div
      onClick={() => onOpen(item)}
      className="cursor-pointer text-left bg-white rounded-[28px] overflow-hidden shadow-sm w-full"
      role="button"
      tabIndex={0}
    >
      <div className="p-4">
        <div className="rounded-[24px] overflow-hidden">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-44 sm:h-48 object-cover"
          />
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
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
