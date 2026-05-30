"use client";

import { useEffect, useState, useRef } from "react";

interface AnimatedMetricProps {
  value: number;
  suffix?: string;
  decimals?: number;
  duration?: number; // ms
}

export default function AnimatedMetric({ value, suffix = "", decimals = 0, duration = 2000 }: AnimatedMetricProps) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          startCountUp();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    const startCountUp = () => {
      const startTime = performance.now();
      
      const step = (currentTime: number) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        // Easing function: out-quad
        const easeProgress = progress * (2 - progress);
        const currentVal = easeProgress * value;
        
        setCount(currentVal);
        
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setCount(value);
        }
      };
      
      requestAnimationFrame(step);
    };

    return () => {
      observer.disconnect();
    };
  }, [value, duration]);

  return (
    <span ref={elementRef} className="font-mono tabular-nums">
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}
