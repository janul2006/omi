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
          "w-20 h-28 sm:w-24 sm:h-34 bg-[#1e1e21] border-2 border-slate-700/50 rounded-lg shadow-xl flex items-center justify-center relative overflow-hidden",
          className
        )}
      >
        <div className="absolute inset-2 border border-slate-600/20 rounded" />
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-10 h-10 bg-slate-800 rounded-full opacity-30" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      whileHover={!disabled ? { y: -20, scale: 1.05 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "w-20 h-28 sm:w-24 sm:h-34 bg-white border border-slate-200 rounded-lg shadow-lg flex flex-col p-2 cursor-pointer select-none relative group",
        disabled && "opacity-40 grayscale-[0.5] cursor-not-allowed",
        className
      )}
    >
      <div className={cn("text-sm font-black leading-none", suitColors[card.suit])}>
        {card.rank}
      </div>
      <div className={cn("text-xs leading-none", suitColors[card.suit])}>
        {suitSymbols[card.suit]}
      </div>
      
      <div className={cn("absolute bottom-2 right-2 text-xl rotate-180", suitColors[card.suit])}>
        <div className="text-sm font-black leading-none">{card.rank}</div>
        <div className="text-xs leading-none">{suitSymbols[card.suit]}</div>
      </div>

      <div className={cn("flex-grow flex items-center justify-center text-4xl", suitColors[card.suit])}>
          {suitSymbols[card.suit]}
      </div>
    </motion.div>
  );
};
