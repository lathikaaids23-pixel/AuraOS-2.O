import React from 'react';
import { motion } from 'motion/react';

interface AIAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'small' | 'medium' | 'large';
  variant?: 'idle' | 'thinking' | 'alert';
}

export const AIAvatar: React.FC<AIAvatarProps> = ({ size = 'md', variant = 'idle' }) => {
  // Normalize size names
  const normalizedSize = size === 'small' ? 'sm' : size === 'medium' ? 'md' : size === 'large' ? 'lg' : size;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  // Outer glowing ring color mapping
  const glowColors = {
    idle: 'shadow-[0_0_15px_rgba(6,182,212,0.5)] border-cyan-500/50 bg-gradient-to-tr from-slate-900 via-slate-800 to-cyan-950',
    thinking: 'shadow-[0_0_20px_rgba(59,130,246,0.8)] border-blue-400 bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950',
    alert: 'shadow-[0_0_20px_rgba(239,68,68,0.8)] border-red-500/50 bg-gradient-to-tr from-slate-950 via-slate-900 to-red-950',
  };

  return (
    <div className={`relative flex items-center justify-center rounded-full border ${glowColors[variant]} ${sizeClasses[normalizedSize]} overflow-hidden select-none`}>
      {/* Background animated orbs/pulses */}
      {variant === 'idle' && (
        <motion.div
          className="absolute inset-0 rounded-full bg-cyan-500/10"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        />
      )}

      {variant === 'thinking' && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border border-dashed border-cyan-400/30"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full bg-blue-500/20 filter blur-sm"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          />
        </>
      )}

      {variant === 'alert' && (
        <motion.div
          className="absolute inset-0 rounded-full bg-red-500/20"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
        />
      )}

      {/* Embedded face glyph SVG */}
      <svg
        className={`relative z-10 ${normalizedSize === 'sm' ? 'w-5 h-5' : normalizedSize === 'md' ? 'w-6 h-6' : normalizedSize === 'lg' ? 'w-9 h-9' : 'w-12 h-12'} text-white`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {variant === 'idle' && (
          <>
            {/* Friendly robotic face with eyes and smiling mouth */}
            <rect x="3" y="11" width="18" height="10" rx="2" className="text-cyan-400" />
            <path d="M12 2v4M12 6h.01" />
            <path d="M8 15h.01M16 15h.01" />
            <path d="M9 18c1 1 2 1 3 0" className="text-cyan-300" />
            <circle cx="12" cy="6" r="1" className="fill-cyan-400 stroke-none" />
          </>
        )}

        {variant === 'thinking' && (
          <>
            {/* Thinking robotic face with glowing lens / spiral eye */}
            <rect x="3" y="11" width="18" height="10" rx="2" className="text-blue-400" />
            <path d="M12 2v4" />
            <circle cx="9" cy="15" r="1.5" className="fill-blue-400 text-blue-300 animate-pulse" />
            <circle cx="15" cy="15" r="1.5" className="fill-blue-400 text-blue-300 animate-pulse" />
            <path d="M11 18h2" className="text-blue-300" strokeWidth="1.5" />
            {/* Rotating top radar bulb */}
            <circle cx="12" cy="4" r="1.5" className="fill-cyan-400 text-cyan-400" />
          </>
        )}

        {variant === 'alert' && (
          <>
            {/* Alarm alert face with wide eyes and open emergency alarm mouth */}
            <rect x="3" y="11" width="18" height="10" rx="2" className="text-red-400" />
            <path d="M12 2v4" />
            <circle cx="8" cy="15" r="1" className="fill-red-500 text-red-500" />
            <circle cx="16" cy="15" r="1" className="fill-red-500 text-red-500" />
            <circle cx="12" cy="18" r="1.5" className="fill-red-400 stroke-none" />
            <circle cx="12" cy="3" r="2" className="fill-red-500 text-red-500 animate-ping" />
          </>
        )}
      </svg>
    </div>
  );
};
