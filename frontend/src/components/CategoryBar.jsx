// src/components/CategoryBar.jsx
import { LayoutGrid, Utensils, Dessert, CupSoda, Cookie } from "lucide-react";
import TranslatedText from "./TranslatedText";

const categories = [
  { id: "all",     label: "All",     icon: LayoutGrid },
  { id: "mains",   label: "Mains",   icon: Utensils   },
  { id: "sides",   label: "Sides",   icon: Cookie     },
  { id: "dessert", label: "Dessert", icon: Dessert    },
  { id: "drinks",  label: "Drinks",  icon: CupSoda    },
];

export default function CategoryBar({ active, onChange }) {
  return (
    <div dir="ltr" className="bg-orange-600 rounded-3xl px-5 py-4 flex justify-around shadow-md shadow-black/20">
      {categories.map((c) => {
        const Icon = c.icon;
        const isActive = active === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className="flex flex-col items-center gap-2 transition-all duration-300 active:scale-80 hover:scale-85 hover:-translate-y-1"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isActive ? "bg-white shadow-lg" : "bg-orange-100 hover:bg-white/80 hover:shadow-md"
            }`}>
              <Icon size={22} className="text-orange-600 transition-colors duration-300" />
            </div>
            <span className={`text-xs font-medium transition-all duration-300 ${
              isActive ? "text-white font-bold" : "text-white"
            }`}>
              <TranslatedText>{c.label}</TranslatedText>
            </span>
          </button>
        );
      })}
    </div>
  );
}