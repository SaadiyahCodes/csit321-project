// src/components/FoodCursor.jsx
// Subtle orange sparkle dots that follow the mouse on desktop.
// Automatically skips on touch devices — safe to mount on any page.

import { useState, useEffect } from "react";

export default function FoodCursor() {
  const [dots, setDots] = useState([]);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let lastTime = 0;
    const THROTTLE = 10; // longer gap = fewer, less annoying dots

    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastTime < THROTTLE) return;
      lastTime = now;

      const id = now + Math.random();
      const ox = (Math.random() - 0.5) * 10; // slight scatter
      const oy = (Math.random() - 0.5) * 10;
      const size = 4 + Math.random() * 8;    // 4–8px

      setDots((prev) => [...prev.slice(-10), { id, x: e.clientX + ox, y: e.clientY + oy, size }]);

      setTimeout(() => {
        setDots((prev) => prev.filter((d) => d.id !== id));
      }, 600);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!dots.length) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }} aria-hidden="true">
      {dots.map((d) => (
        <div
          key={d.id}
          style={{
            position: "absolute",
            left: d.x - d.size / 2,
            top: d.y - d.size / 2,
            width: d.size,
            height: d.size,
            borderRadius: "50%",
            background: "rgba(249,115,22,0.55)",
            boxShadow: "0 0 6px rgba(249,115,22,0.3)",
            animation: "sparkle 0.6s ease-out forwards",
          }}
        />
      ))}
      <style>{`
        @keyframes sparkle {
          0%   { opacity: 0.7; transform: scale(1)   translateY(0px);   }
          100% { opacity: 0;   transform: scale(0.2) translateY(-12px); }
        }
      `}</style>
    </div>
  );
}