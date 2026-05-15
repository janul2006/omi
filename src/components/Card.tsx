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
        whileHover={!disabled ? { y: -10 } : {}}
        className={cn(
          "w-20 h-28 sm:w-26 sm:h-38 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-2xl shadow-xl flex items-center justify-center relative overflow-hidden border-[3px] border-white/20",
          className
        )}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:8px_8px]" />
        <div className="text-white/20 font-black text-2xl tracking-tighter italic">OMI</div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent skew-y-[-12deg] origin-top-left pointer-events-none" />
      </motion.div>
    );
  }

  const isRed = card.suit === 'HEARTS' || card.suit === 'DIAMONDS';

  return (
    <motion.div
      layout
      whileHover={!disabled ? { y: -30, scale: 1.1, rotate: 2 } : {}}
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
