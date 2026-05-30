"use client";

import React, { useState, useRef, MouseEvent } from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // e.g. "rgba(168, 85, 247, 0.2)" (purple)
}

export default function GlassCard({ children, className = "", glowColor = "rgba(168, 85, 247, 0.15)" }: GlassCardProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 shadow-xl ${className}`}
      style={{
        boxShadow: isHovered ? "0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)" : "0 10px 30px -15px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* High-fidelity cursor moving spotlight glow */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-300 blur-[80px]"
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            width: "250px",
            height: "250px",
            background: glowColor,
          }}
        />
      )}
      
      {/* Subtle border glow reflection */}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
