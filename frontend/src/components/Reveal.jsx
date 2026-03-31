//src/components/Reveal.jsx
// Wraps any content in a fade + slide-up animation triggered when it enters the viewport.
// Uses IntersectionObserver — no external dependencies.
//
// Props:
//   delay    — stagger delay in ms (default 0). Use multiples of 60-80 for grid staggering.
//   style    — any extra styles applied to the wrapper div
//   children — content to reveal

import { useState, useEffect, useRef } from "react";

export default function Reveal({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect(); // fire once only
        }
      },
      { threshold: 0.12 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}