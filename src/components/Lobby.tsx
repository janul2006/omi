import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Play, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils.js';
import { BotDifficulty } from '../types.js';

interface Character {
  id: string;
  name: string;
  avatar: string;
  difficulty: BotDifficulty;
  stars: number;
}

const CHARACTERS: Character[] = [
  { id: '1', name: 'Jack', avatar: '👨‍🏫', difficulty: 'ELITE', stars: 3 },
  { id: '2', name: 'Annie', avatar: '👩‍💻', difficulty: 'EASY', stars: 1 },
  { id: '3', name: 'Billy', avatar: '👨‍🎤', difficulty: 'TACTICAL', stars: 2 },
  { id: '4', name: 'Kate', avatar: '👩‍🎨', difficulty: 'TACTICAL', stars: 2 },
  { id: '5', name: 'Stark', avatar: '🦸‍♂️', difficulty: 'ELITE', stars: 3 },
  { id: '6', name: 'Rose', avatar: '👩‍🚀', difficulty: 'EASY', stars: 1 },
];

interface LobbyProps {
  onBack: () => void;
  onPlay: (players: { name: string, difficulty: BotDifficulty, style: string }[]) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onBack, onPlay }) => {
  const [partnerIdx, setPartnerIdx] = useState(0);
  const [opp1Idx, setOpp1Idx] = useState(1);
  const [opp2Idx, setOpp2Idx] = useState(2);

  const rotate = (current: number, delta: number, others: number[]) => {
    let next = (current + delta + CHARACTERS.length) % CHARACTERS.length;
    // Skip if already selected by someone else
    while (others.includes(next)) {
        next = (next + delta + CHARACTERS.length) % CHARACTERS.length;
        // Safety break if somehow all are taken (shouldn't happen with 6 chars and 3 slots)
        if (next === current) break;
    }
    return next;
  };

  const handleStart = () => {
    const p = CHARACTERS[partnerIdx];
    const o1 = CHARACTERS[opp1Idx];
    const o2 = CHARACTERS[opp2Idx];
    
    onPlay([
        { name: p.name, difficulty: p.difficulty, style: p.name },
        { name: o1.name, difficulty: o1.difficulty, style: o1.name },
        { name: o2.name, difficulty: o2.difficulty, style: o2.name },
    ]);
  };

  const CharCard = ({ char, onPrev, onNext, label, used }: { char: Character, onPrev: () => void, onNext: () => void, label: string, used?: boolean }) => (
    <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-blue-300/50 mb-1">{label}</span>
        <div className="flex items-center gap-4">
            <button onClick={onPrev} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
                <ChevronLeft size={24} />
            </button>
            <motion.div 
                key={char.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                    "w-48 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 flex flex-col items-center shadow-2xl relative overflow-hidden group transition-all",
                    used && "grayscale opacity-50 brightness-50"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-5xl mb-3 z-10">{char.avatar}</div>
                <div className="text-white font-bold text-lg z-10">{char.name}</div>
                <div className="flex gap-1 mt-1 z-10">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={cn("w-2 h-2 rounded-full", i < char.stars ? "bg-yellow-400" : "bg-white/10")} />
                    ))}
                </div>
            </motion.div>
            <button onClick={onNext} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
                <ChevronRight size={24} />
            </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0c162e]/80 backdrop-blur-2xl border-4 border-blue-900/50 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(30,58,138,0.5)] flex flex-col items-center gap-8 relative">
        
        <button onClick={onBack} className="absolute top-8 left-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-colors">
            <ArrowLeft size={20} />
        </button>
        
        <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic border-b-4 border-cyan-400 pb-2">Lobby</h2>

        <div className="w-full space-y-10 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
            <CharCard 
                label="Partner" 
                char={CHARACTERS[partnerIdx]} 
                onPrev={() => setPartnerIdx(rotate(partnerIdx, -1, [opp1Idx, opp2Idx]))} 
                onNext={() => setPartnerIdx(rotate(partnerIdx, 1, [opp1Idx, opp2Idx]))} 
            />

            <div className="space-y-6">
                <span className="block text-center text-xs font-black uppercase tracking-[0.3em] text-blue-300">Opponents</span>
                <div className="space-y-4">
                    <CharCard 
                        label="" 
                        char={CHARACTERS[opp1Idx]} 
                        onPrev={() => setOpp1Idx(rotate(opp1Idx, -1, [partnerIdx, opp2Idx]))} 
                        onNext={() => setOpp1Idx(rotate(opp1Idx, 1, [partnerIdx, opp2Idx]))} 
                    />
                    <CharCard 
                        label="" 
                        char={CHARACTERS[opp2Idx]} 
                        onPrev={() => setOpp2Idx(rotate(opp2Idx, -1, [partnerIdx, opp1Idx]))} 
                        onNext={() => setOpp2Idx(rotate(opp2Idx, 1, [partnerIdx, opp1Idx]))} 
                    />
                </div>
            </div>
        </div>

        <div className="flex flex-col w-full gap-3 mt-4">
            <button
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black py-6 rounded-[2rem] shadow-[0_10px_30px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-3 active:scale-95 group mb-4"
            >
                <span className="tracking-[0.2em] uppercase text-xl italic">Play</span>
                <Play size={24} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
                onClick={onBack}
                className="w-full bg-white/5 hover:bg-white/10 text-white/60 font-black py-4 rounded-[1.5rem] transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest text-[10px]"
            >
                Back
            </button>
        </div>
      </div>
    </div>
  );
};
