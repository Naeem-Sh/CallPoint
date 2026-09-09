import React from 'react';
import { getHighResImageUrl } from '../utils/image.ts';

interface MeteorAvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'rounded';
  className?: string;
  showMeteor?: boolean;
}

const sizeConfig = {
  sm: {
    wrapper: 'w-9 h-9',
    text: 'text-xs',
    padding: 'p-[1.5px]',
  },
  md: {
    wrapper: 'w-12 h-12',
    text: 'text-base',
    padding: 'p-[1.5px]',
  },
  lg: {
    wrapper: 'w-16 h-16',
    text: 'text-lg',
    padding: 'p-[1.5px]',
  },
  xl: {
    wrapper: 'w-24 h-24',
    text: 'text-2xl',
    padding: 'p-[2px]',
  },
  '2xl': {
    wrapper: 'w-28 h-28',
    text: 'text-3xl',
    padding: 'p-[2px]',
  },
};

export const MeteorAvatar: React.FC<MeteorAvatarProps> = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  shape = 'rounded',
  className = '',
  showMeteor = true,
}) => {
  const config = sizeConfig[size] || sizeConfig.md;
  const roundedClass = shape === 'circle' ? 'rounded-full' : size === 'sm' ? 'rounded-xl' : size === 'md' ? 'rounded-2xl' : 'rounded-3xl';

  const initial = name.trim() ? name.trim()[0] : '👤';
  const resolvedSrc = getHighResImageUrl(src);

  return (
    <div
      className={`meteor-avatar-wrapper ${config.wrapper} ${config.padding} ${roundedClass} ${className} shrink-0`}
      title={name || alt}
    >
      <div className={`meteor-avatar-inner ${roundedClass}`}>
        {resolvedSrc ? (
          <img
            src={resolvedSrc}
            alt={alt || name}
            referrerPolicy="no-referrer"
            loading="eager"
            decoding="async"
            style={{
              imageRendering: 'auto',
              WebkitPrintColorAdjust: 'exact',
            }}
            className="w-full h-full object-cover select-none"
            onError={(e) => {
              // Hide broken image and fallback to initials if loading fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 text-white flex items-center justify-center font-black select-none shadow-inner">
            <span className={config.text}>{initial}</span>
          </div>
        )}
      </div>
    </div>
  );
};
