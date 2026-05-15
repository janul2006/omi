import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card as CardType, Suit } from '../types.js';
import { cn } from '../lib/utils.js';

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const suitSymbols: Record<Suit, string> = {
  CLUBS: '♣',
  DIAMONDS: '♦',
  HEARTS: '♥',
  SPADES: '♠'
};

const suitColors: Record<Suit, string> = {
  CLUBS: 'text-gray-900',
  DIAMONDS: 'text-red-600',
  HEARTS: 'text-red-600',
  SPADES: 'text-gray-900'
};

export const Card: React.FC<CardProps> = ({ card, faceDown, onClick, className, disabled }) => {
  if (faceDown || !card) {
    return (
      <motion.div
        layout
        whileHover={!disabled ? { scale: 1.05, rotate: -2, y: -5 } : {}}
        className={cn(
          "w-20 h-28 sm:w-26 sm:h-38 bg-[#0c162e] rounded-2xl shadow-2xl flex items-center justify-center relative overflow-hidden border-[3px] border-blue-500/30",
          className
        )}
      >
        {/* Core Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-indigo-900/60 to-slate-900" />
        
        {/* Pattern Layer */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent bg-[length:12px_12px]" />
        
        {/* Thematic Logo/Text */}
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-white/10 flex items-center justify-center mb-1">
                <div className="text-white/40 font-black text-xl italic tracking-tighter">O</div>
            </div>
            <div className="text-white/10 font-black text-[8px] uppercase tracking-[0.4em] italic">Tactical</div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l border-t border-white/10" />
        <div className="absolute top-2 right-2 w-4 h-4 border-r border-t border-white/10" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l border-b border-white/10" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r border-b border-white/10" />

        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent skew-y-[-12deg] origin-top-left pointer-events-none" />
      </motion.div>
    );
  }

  const isRed = card.suit === 'HEARTS' || card.suit === 'DIAMONDS';

  return (
    <motion.div
      layout
      whileHover={!disabled ? { y: -25, scale: 1.1, rotate: -2 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "w-20 h-28 sm:w-26 sm:h-38 bg-white border-[3px] rounded-2xl shadow-xl flex flex-col p-3 cursor-pointer select-none relative group transition-colors",
        isRed ? "border-rose-100" : "border-slate-100",
        disabled && "opacity-40 grayscale-[0.5] cursor-not-allowed",
        className
      )}
    >
      <div className="absolute inset-0 opacity-5 pointer-events-none rounded-2xl bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')]" />

      <div className={cn("text-lg font-black leading-none flex flex-col items-center", suitColors[card.suit])}>
        {card.rank}
        <span className="text-[10px]">{suitSymbols[card.suit]}</span>
      </div>
      
      <div className={cn("absolute bottom-3 right-3 flex flex-col items-center rotate-180", suitColors[card.suit])}>
        <div className="text-lg font-black leading-none">{card.rank}</div>
        <div className="text-[10px]">{suitSymbols[card.suit]}</div>
      </div>

      <div className={cn("flex-grow flex items-center justify-center text-5xl", suitColors[card.suit])}>
          {suitSymbols[card.suit]}
      </div>

      <div className="absolute inset-2 border border-dashed border-black/5 rounded-xl pointer-events-none" />
    </motion.div>
  );
};
