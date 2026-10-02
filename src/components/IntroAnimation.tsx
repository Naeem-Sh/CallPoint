import React, { useEffect, useState, useRef } from 'react';
import { PhoneCall, Sparkles, Check } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
  organizationName?: string;
  logoUrl?: string;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({
  onComplete,
  organizationName,
  logoUrl,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const totalDuration = 1500; // 1.5 seconds exact runtime
    const start = performance.now();
    let frameId: number;
    let isTerminated = false;

    const finish = () => {
      if (!isTerminated) {
        isTerminated = true;
        onCompleteRef.current();
      }
    };

    const update = (now: number) => {
      if (isTerminated) return;
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setProgress(pct);

      if (elapsed >= 1050) {
        setIsConnected(true);
      }

      if (elapsed >= 1300) {
        setIsExiting(true);
      }

      if (elapsed < totalDuration) {
        frameId = requestAnimationFrame(update);
      } else {
        finish();
      }
    };

    frameId = requestAnimationFrame(update);

    const safetyTimer = setTimeout(() => {
      finish();
    }, totalDuration);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        finish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isTerminated = true;
      cancelAnimationFrame(frameId);
      clearTimeout(safetyTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-label="بارگذاری سامانه"
      onClick={() => {
        setIsExiting(true);
        onCompleteRef.current();
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/25 dark:bg-slate-950/45 backdrop-blur-md transition-all duration-300 select-none cursor-pointer ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      dir="rtl"
    >
      {/* Light, Translucent Floating Glass Container */}
      <div className="relative flex flex-col items-center p-8 sm:p-10 rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 shadow-2xl shadow-indigo-900/10 dark:shadow-black/40 text-center max-w-xs sm:max-w-sm w-full mx-4">
        
        {/* Soft Ambient Glows behind icon */}
        <div className="absolute w-40 h-40 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute w-36 h-36 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>

        {/* Central Communications Icon Hub */}
        <div className="relative flex items-center justify-center w-28 h-28 mb-5">
          {/* Transparent Sonar Ripples */}
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/35 animate-sonar-wave"></div>
          <div
            className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-sonar-wave"
            style={{ animationDelay: '0.4s' }}
          ></div>

          {/* Main Bright Glowing Emblem */}
          <div
            className={`relative flex items-center justify-center w-20 h-20 rounded-2xl transition-all duration-300 shadow-xl border ${
              isConnected
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 border-emerald-300 text-white shadow-emerald-500/30 scale-105'
                : 'bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-500 border-white/40 text-white shadow-indigo-500/30'
            }`}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="لوگو"
                className="w-12 h-12 rounded-xl object-contain drop-shadow"
              />
            ) : isConnected ? (
              <Check className="w-10 h-10 stroke-[2.5]" />
            ) : (
              <PhoneCall className="w-9 h-9 animate-phone-ring" />
            )}

            <span className="absolute -top-1 -right-1 p-1 rounded-full bg-amber-400 text-slate-900 shadow-md">
              <Sparkles className="w-2.5 h-2.5 fill-current" />
            </span>
          </div>
        </div>

        {/* Minimal Title (Only Org Name or Short Brand) */}
        <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white tracking-tight mb-4">
          {organizationName || 'دفتر تلفن سازمانی'}
        </h2>

        {/* Minimal Clean 1.5s Progress Track */}
        <div className="w-36 sm:w-44 h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-700/60 overflow-hidden p-[1px]">
          <div
            className={`h-full rounded-full transition-all ease-out duration-75 ${
              isConnected
                ? 'bg-emerald-500 shadow-sm shadow-emerald-400'
                : 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 shadow-sm shadow-indigo-400'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
