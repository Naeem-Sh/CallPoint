import React, { useEffect, useState, useRef } from 'react';
import { toPersianDigits } from '../../utils/shamsi.ts';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  formatFn?: (n: number) => string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 850,
  className = '',
  prefix = '',
  suffix = '',
  formatFn,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const prevValueRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    const startTime = performance.now();

    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic function for smooth natural deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, duration]);

  const formatted = formatFn ? formatFn(displayValue) : toPersianDigits(displayValue);

  return (
    <span className={`inline-flex items-baseline tabular-nums ${className}`}>
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <span>{formatted}</span>
      {suffix && <span className="mr-1">{suffix}</span>}
    </span>
  );
};
