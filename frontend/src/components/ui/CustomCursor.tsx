"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 40, stiffness: 400, mass: 0.4 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const dotXSpring = useSpring(cursorX, { damping: 15, stiffness: 800 });
  const dotYSpring = useSpring(cursorY, { damping: 15, stiffness: 800 });

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
      if (!visible) setVisible(true);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    window.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [visible, cursorX, cursorY]);

  return (
    <>
      {/* Outer glow aura lagging the cursor */}
      <motion.div
        className={`pointer-events-none fixed left-0 top-0 z-50 h-8 w-8 rounded-full border border-purple-500/50 bg-purple-500/10 mix-blend-screen transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
      />
      {/* Core solid pointer dot */}
      <motion.div
        className={`pointer-events-none fixed left-0 top-0 z-50 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400 mix-blend-screen transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        style={{
          x: dotXSpring,
          y: dotYSpring,
        }}
      />
    </>
  );
}
