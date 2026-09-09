import React, { useEffect, useState } from 'react';
import { formatPersianDate, formatPersianTime } from '../utils/shamsi.ts';
import { Calendar, Clock } from 'lucide-react';

interface AnalogClockProps {
  timezone?: string;
  size?: number;
}

export const AnalogClock: React.FC<AnalogClockProps> = ({ size = 64 }) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    let animId: number;
    const update = () => {
      setTime(new Date());
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  const seconds = time.getSeconds() + time.getMilliseconds() / 1000;
  const minutes = time.getMinutes() + seconds / 60;
  const hours = (time.getHours() % 12) + minutes / 60;

  const secAngle = seconds * 6; // 360 / 60
  const minAngle = minutes * 6; // 360 / 60
  const hourAngle = hours * 30; // 360 / 12

  const dialSize = Math.max(size, 48);

  return (
    <div className="flex items-center gap-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 shadow-xs">
      {/* Minimal Swiss-style Analog Clock Dial */}
      <div
        className="relative rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center select-none shrink-0"
        style={{ width: dialSize, height: dialSize }}
      >
        {/* Minimal 12 Hour Ticks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const isCardinal = i % 3 === 0;
          return (
            <div
              key={i}
              className="absolute w-full h-full flex justify-center"
              style={{ transform: `rotate(${i * 30}deg)` }}
            >
              <div
                className={`rounded-full ${
                  isCardinal
                    ? 'w-[1.5px] h-2 bg-slate-700 dark:bg-slate-200 mt-1'
                    : 'w-[1px] h-1 bg-slate-300 dark:bg-slate-700 mt-1'
                }`}
              />
            </div>
          );
        })}

        {/* Hour Hand */}
        <div
          className="absolute origin-bottom rounded-full bg-slate-800 dark:bg-slate-100 z-10"
          style={{
            width: '2px',
            height: `${dialSize * 0.26}px`,
            bottom: '50%',
            transform: `rotate(${hourAngle}deg)`,
            transformOrigin: '50% 100%',
          }}
        />

        {/* Minute Hand */}
        <div
          className="absolute origin-bottom rounded-full bg-slate-600 dark:bg-slate-300 z-20"
          style={{
            width: '1.5px',
            height: `${dialSize * 0.36}px`,
            bottom: '50%',
            transform: `rotate(${minAngle}deg)`,
            transformOrigin: '50% 100%',
          }}
        />

        {/* Second Hand (Minimal Accent Needle) */}
        <div
          className="absolute origin-bottom rounded-full bg-rose-500 dark:bg-rose-400 z-30"
          style={{
            width: '1px',
            height: `${dialSize * 0.40}px`,
            bottom: '50%',
            transform: `rotate(${secAngle}deg)`,
            transformOrigin: '50% 100%',
          }}
        />

        {/* Minimal Center Dot */}
        <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white z-40" />
      </div>

      {/* Clean Date & Time Display */}
      <div className="flex flex-col text-right justify-center min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          <span className="font-mono tracking-tight">{formatPersianTime(time)}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          <Calendar className="w-2.5 h-2.5 text-slate-400" />
          <span className="truncate">{formatPersianDate(time)}</span>
        </div>
      </div>
    </div>
  );
};
