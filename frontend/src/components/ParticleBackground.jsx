// src/components/ParticleBackground.jsx
// Full-viewport canvas with slowly drifting food emoji particles.
// Fixed position, pointer-events none — never blocks clicks.
// Safe to mount on any page; cleans up its own animation frame + resize listener.

import { useEffect, useRef } from "react";

const EMOJIS = ["🍕", "🍔", "🌮", "🍜", "🧆", "🥗", "🍱", "🥘", "🍣", "🧁"];
const COUNT = 22;

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: COUNT }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: 14 + Math.random() * 18,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: -0.2 - Math.random() * 0.3,
      opacity: 0.07 + Math.random() * 0.13,
      emoji: EMOJIS[i % EMOJIS.length],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.008,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();

        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;

        // Wrap around edges
        if (p.y < -40)               { p.y = canvas.height + 40; p.x = Math.random() * canvas.width; }
        if (p.x < -40)               p.x = canvas.width + 40;
        if (p.x > canvas.width + 40) p.x = -40;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}