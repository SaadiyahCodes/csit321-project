import { LayoutGrid, Utensils, Dessert, CupSoda, Cookie } from "lucide-react";

const categories = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "mains", label: "Mains", icon: Utensils },
  { id: "sides", label: "Sides", icon: Cookie },
  { id: "dessert", label: "Dessert", icon: Dessert },
  { id: "drinks", label: "Drinks", icon: CupSoda },
];

export default function CategoryBar({ active, onChange }) {
  return (
    <div className="bg-orange-600 rounded-3xl px-5 py-4 flex justify-between">
      {categories.map((c) => {
        const Icon = c.icon;
        const isActive = active === c.id;

        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className="flex flex-col items-center gap-2"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isActive ? "bg-yellow-300" : "bg-orange-100"
              }`}
            >
              <Icon
                size={22}
                className={isActive ? "text-orange-700" : "text-orange-600"}
              />
            </div>
            <span className="text-xs text-white">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}