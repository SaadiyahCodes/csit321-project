import {
  Home,
  UtensilsCrossed,
  Heart,
  ClipboardList,
  Headphones,
} from "lucide-react";

const tabs = [
  { id: "home", icon: Home },
  { id: "menu", icon: UtensilsCrossed },
  { id: "fav", icon: Heart },
  { id: "orders", icon: ClipboardList },
  { id: "help", icon: Headphones },
];

export default function BottomNav({ active, onChange }) {
  return (
    <div className="bg-orange-600 h-16 flex justify-around items-center px-4 shadow-[0_-6px_20px_rgba(0,0,0,0.12)]">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;

        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`w-11 h-11 flex items-center justify-center rounded-xl ${
              isActive ? "bg-white/15" : ""
            }`}
          >
            <Icon className="text-white" size={22} />
          </button>
        );
      })}
    </div>
  );
}
