import React from 'react';
import { useGameStore } from '../store.js';
import { Card } from './Card.js';
import { motion, AnimatePresence } from 'motion/react';
import { Suit, Player, BotDifficulty } from '../types.js';
import { Trophy, Shield, Clock, QrCode, Copy, Link, Eye, Share2, PanelLeft, MessageSquare, History, Send, WifiOff, Users, ChevronLeft, ChevronRight, Settings2, Volume2, VolumeX, LogOut } from 'lucide-react';
import { cn } from '../lib/utils.js';
import { QRCodeCanvas } from 'qrcode.react';

import { soundManager } from '../lib/sounds.js';

const suitSymbols: Record<Suit, string> = {
  CLUBS: '♣',
  DIAMONDS: '♦',
  HEARTS: '♥',
  SPADES: '♠'
};

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

export const GameTable: React.FC = () => {
  const { game, me, ready, setTrump, playCard, fillBots, addBot, isSpectator, isConnected, sendMessage, matchHistory, updateSettings } = useGameStore();
  const [showChat, setShowChat] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [chatInp, setChatInp] = React.useState('');
  const [charIdx, setCharIdx] = React.useState(0);
  const [bgmStarted, setBgmStarted] = React.useState(false);
  const [sidebarVisible, setSidebarVisible] = React.useState(true);
  const [showLastTrickOverlay, setShowLastTrickOverlay] = React.useState(false);
  const [lastRoundWinner, setLastRoundWinner] = React.useState<number | null>(null);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);
  const [isBGMMuted, setIsBGMMuted] = React.useState(soundManager.getBGMState());
  const [isSFXMuted, setIsSFXMuted] = React.useState(soundManager.getSFXState());

  // Detect round end
  React.useEffect(() => {
    if (!game) return;
    if (game.tricksWon[0] + game.tricksWon[1] === 8) {
        const winner = game.tricksWon[0] > game.tricksWon[1] ? 0 : 1;
        setLastRoundWinner(winner);
        soundManager.play('ROUND_WIN');
        const timer = setTimeout(() => setLastRoundWinner(null), 4500);
        return () => clearTimeout(timer);
    }
  }, [game?.tricksWon[0], game?.tricksWon[1]]);

  // Background Music
  React.useEffect(() => {
    if (isConnected && !bgmStarted) {
        soundManager.startBGM();
        setBgmStarted(true);
    }
    return () => {
        if (bgmStarted) {
            soundManager.stopBGM();
        }
    };
  }, [isConnected, bgmStarted]);

  // Auto scroll chat
  React.useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [game?.chat.length, showChat]);

  // Play sounds based on state changes
  React.useEffect(() => {
    if (!game) return;
    
    // Trick win sound
    if (game.lastTrickResult) {
        soundManager.play('TRICK_WIN');
    }
  }, [game?.lastTrickResult?.winnerName]);

  // Card play sound
  React.useEffect(() => {
    if (!game || game.phase !== 'PLAYING') return;
    if (game.currentTrick.length > 0 && !game.lastTrickResult) {
        soundManager.play('CARD_PLAY');
    }
  }, [game?.currentTrick.length]);

  if (!game || !me) return null;

  const inviteUrl = `${window.location.origin}?room=${game.roomId}`;

  const availableCharacters = CHARACTERS.filter(char => 
    !game.players.some(p => p.name === char.name)
  );

  const currentChar = availableCharacters[charIdx % (availableCharacters.length || 1)] || CHARACTERS[0];

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
  };

  const shareGame = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Omi Pro Game Invitation',
                text: `Join my Omi table in sector ${game.roomId}!`,
                url: inviteUrl,
            });
        } catch (err) {
            console.log('Share failed', err);
        }
    } else {
        copyInvite();
    }
  };

  // Calculate relative positions
  const getRelativePos = (serverPos: number) => {
    return (serverPos - me.pos + 4) % 4;
  };

  const playersByPos = Array(4).fill(null);
  game.players.forEach(p => {
    playersByPos[getRelativePos(p.pos)] = p;
  });

  const isMyTurn = game.currentTurnIdx === me.pos && game.phase === 'PLAYING' && !game.lastTrickResult;
  const isMyTrumpCall = game.trumpCallerIdx === me.pos && game.phase === 'TRUMP_CALLING';

  return (
    <div className="h-screen w-full bg-[#0A0A0B] text-slate-200 flex flex-col lg:flex-row overflow-hidden font-sans relative">
      {/* Sidebar Toggle Button (Mobile/Tablet) */}
      <div className="lg:hidden fixed top-6 left-6 z-[90] flex gap-3">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="p-4 bg-[#0c162e]/80 backdrop-blur-3xl border-2 border-blue-500/30 rounded-2xl text-cyan-400 shadow-2xl"
          >
              <PanelLeft size={20} />
          </motion.button>
          <div className="flex flex-col justify-center">
            <h1 className="text-xs font-black tracking-widest text-white italic">OMI PRO</h1>
            <p className="text-[8px] font-black text-cyan-400/50 uppercase tracking-widest">Sector {game.roomId.toUpperCase()}</p>
          </div>
      </div>

      {/* Sidebar: Stats & Activity */}
      <AnimatePresence mode="wait">
        {sidebarVisible && (
          <>
            {/* Backdrop for mobile */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarVisible(false)}
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[85]"
            />
            <motion.aside 
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed lg:relative inset-y-0 left-0 w-80 bg-[#0c162e]/95 lg:bg-[#0c162e]/80 backdrop-blur-3xl border-r-4 border-blue-900/30 flex flex-col z-[90] lg:z-30 shrink-0 shadow-2xl"
            >
                {/* Sidebar Toggle Button (Desktop when visible) */}
                <button 
                    onClick={() => setSidebarVisible(false)}
                    className="hidden lg:flex absolute top-1/2 -right-6 -translate-y-1/2 w-6 h-20 bg-blue-900/40 hover:bg-blue-900/60 transition-colors items-center justify-center rounded-r-xl border-r-2 border-y-2 border-blue-800/50 group"
                >
                    <ChevronLeft size={16} className="text-blue-300/40 group-hover:text-cyan-400 group-hover:-translate-x-0.5 transition-all" />
                </button>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              <div className="flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-white shadow-xl shadow-blue-900/40 text-2xl tracking-tighter border-2 border-white/20">O</div>
            <h1 className="text-2xl font-black tracking-tight text-white italic drop-shadow-md">OMI PRO</h1>
          </div>

          <div className="space-y-6">
            {/* Scoreboard */}
            <div className="bg-white/5 rounded-3xl p-6 border-2 border-white/5 transition-all shadow-2xl backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy size={48} className="text-blue-300" />
              </div>
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-blue-300 font-black mb-6">Match Standings</h2>
              <div className="flex justify-between items-end gap-3">
                <div className="flex-1 text-center">
                  <p className="text-[11px] font-black uppercase mb-1 text-cyan-400">We</p>
                  <p className="text-5xl font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    {game.scores[me.team].toString().padStart(2, '0')}
                  </p>
                </div>
                <div className="h-14 w-[2px] bg-white/10 rounded-full mb-1 flex items-center justify-center">
                  <div className="absolute -top-8 text-[8px] font-black tracking-widest text-blue-400/30 whitespace-nowrap">Target: 10 Pts</div>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[11px] font-black uppercase mb-1 text-blue-300/40">They</p>
                  <p className="text-5xl font-black text-white tabular-nums opacity-60">
                    {game.scores[1 - me.team].toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-5 border-t-2 border-white/5 flex justify-between text-[11px] font-black uppercase tracking-wider">
                <span className="text-blue-300/50">Tricks</span>
                <span className="text-cyan-400 drop-shadow-sm">
                  WE: {game.tricksWon[me.team]} | THEY: {game.tricksWon[1 - me.team]}
                </span>
              </div>
            </div>

            {/* Room Info */}
            <div className="space-y-3 px-1">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-blue-400/50">Sector</span>
                <span className="text-white font-mono text-xs">#{game.roomId.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-blue-400/50">Phase</span>
                <span className={cn(
                    "font-black px-2 py-0.5 rounded text-[9px] uppercase",
                    game.phase === 'PLAYING' ? "bg-cyan-500/10 text-cyan-400" : "bg-white/5 text-blue-300/40"
                )}>
                    {game.phase.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Activity Logs */}
            <div className="bg-black/20 rounded-[2rem] border-2 border-white/5 p-5 shadow-inner">
              <p className="text-[10px] uppercase text-blue-300 font-black tracking-widest mb-4 italic">Log</p>
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {[...game.history].reverse().map((log, i) => (
                  <div key={i} className="text-[10px] leading-relaxed text-blue-100/60 border-l-4 border-cyan-500/20 pl-3 py-1 font-bold">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Spectators */}
            {game.spectators.length > 0 && (
              <div className="p-4 bg-black/20 rounded-2xl border border-slate-800/50">
                 <div className="flex items-center gap-2 mb-3">
                   <Eye size={12} className="text-emerald-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Watching ({game.spectators.length})</span>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {game.spectators.map(s => (
                     <div key={s.id} className="px-2 py-1 bg-slate-800 rounded-md text-[9px] font-bold text-slate-400 border border-slate-700/50">
                       {s.name}
                     </div>
                   ))}
                 </div>
              </div>
            )}

            {/* Invite Section */}
            <div className="space-y-4">
               <div className="bg-emerald-600/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-2xl">
                      <QRCodeCanvas value={inviteUrl} size={100} level="H" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Invite Allies</p>
                    <p className="text-[9px] text-slate-500 font-medium">Scan to join the conflict</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-2">
                   <button 
                      onClick={copyInvite}
                      className="py-3 px-4 bg-[#0A0A0B] hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between group transition-all"
                   >
                      <div className="flex items-center gap-2">
                          <Link size={14} className="text-slate-500 group-hover:text-emerald-500 transition-colors" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Copy</span>
                      </div>
                   </button>
                   <button 
                      onClick={shareGame}
                      className="py-3 px-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 group transition-all"
                   >
                      <Share2 size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Invite</span>
                   </button>
               </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-[#121214] shrink-0">
           <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-800 hover:bg-rose-900/20 hover:text-rose-500 hover:border-rose-500/30 border border-transparent rounded-xl text-[10px] font-black tracking-widest transition-all active:scale-95 uppercase">LEAVE TABLE</button>
        </div>
      </motion.aside>
     </>
    )}
  </AnimatePresence>

      {/* Main Game Stage */}
      <main className={cn(
        "flex-1 relative flex flex-col overflow-hidden transition-all duration-500",
        sidebarVisible ? "lg:pl-0" : ""
      )}>
        
        {/* Disconnection Overlay */}
        {!isConnected && (
            <div className="absolute inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/5 border-2 border-white/10 p-10 sm:p-14 rounded-[3.5rem] shadow-[0_0_100px_rgba(244,63,94,0.1)] max-w-lg w-full backdrop-blur-md relative overflow-hidden"
                >
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl" />
                    
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto border-2 border-rose-500/20">
                        <WifiOff className="w-10 h-10 sm:w-12 sm:h-12 text-rose-500 animate-pulse" />
                    </div>
                    
                    <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 uppercase tracking-tight italic">Link Severed</h2>
                    <p className="text-rose-400 font-bold text-[10px] uppercase tracking-[0.4em] mb-8">Operative: {me.name}</p>
                    
                    <div className="bg-black/40 rounded-3xl p-6 border border-white/5 mb-10">
                        <p className="text-blue-200/60 text-xs sm:text-sm font-bold leading-relaxed uppercase tracking-widest italic mb-2">
                             Secure channel instability detected. 
                        </p>
                        <p className="text-[10px] text-blue-300/30 uppercase tracking-[0.2em] font-black">
                            Attempting automatic node recovery...
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-black py-5 rounded-[2rem] transition-all uppercase tracking-widest text-xs border-b-6 border-cyan-700 shadow-2xl shadow-cyan-900/40 active:translate-y-1 active:border-b-0"
                        >
                            Reload Tactical Link
                        </button>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => {
                                    const url = new URL(window.location.href);
                                    url.searchParams.set('spectate', 'true');
                                    window.location.href = url.toString();
                                }}
                                className="bg-white/5 hover:bg-white/10 text-white/60 font-black py-4 rounded-[1.5rem] transition-all uppercase tracking-widest text-[9px] border border-white/10 flex items-center justify-center gap-2 group"
                            >
                                <Eye size={14} className="group-hover:text-cyan-400 transition-colors" />
                                Watch Mode
                            </button>
                            <button 
                                onClick={() => window.location.href = '/'}
                                className="bg-white/5 hover:bg-white/10 text-white/60 font-black py-4 rounded-[1.5rem] transition-all uppercase tracking-widest text-[9px] border border-white/10 flex items-center justify-center gap-2 group"
                            >
                                <LogOut size={14} className="group-hover:text-rose-500 transition-colors" />
                                Abandon Ops
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-[8px] font-black text-rose-500/40 uppercase tracking-[0.2em] italic">
                        <div className="w-1.5 h-1.5 bg-rose-500/40 rounded-full animate-ping" />
                        Re-sync in progress
                    </div>
                </motion.div>
            </div>
        )}
        {/* Trump Indicator Floating */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-[#0c162e]/40 backdrop-blur-2xl px-8 py-3 rounded-[2rem] border-2 border-white/10 flex items-center gap-6 shadow-2xl">
            <span className="text-[11px] text-blue-300/50 font-black uppercase tracking-[0.3em] italic">Trump Suit</span>
            <motion.div 
                whileHover={{ scale: 1.2, rotate: 10 }}
                className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(255,255,255,0.2)] border-2 border-white/20 group cursor-default"
            >
              {game.trumpSuit ? (
                <span className={cn(
                    "transition-all duration-500",
                    (game.trumpSuit === 'HEARTS' || game.trumpSuit === 'DIAMONDS') ? 'text-rose-500' : 'text-slate-900'
                )}>
                    {suitSymbols[game.trumpSuit]}
                </span>
              ) : (
                <span className="text-slate-200 animate-pulse">?</span>
              )}
            </motion.div>
          </div>
        </div>

        {/* The Table Stage */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 pointer-events-none overflow-hidden relative">
          <div className="relative w-full max-w-[95vw] lg:max-w-5xl aspect-[4/5] sm:aspect-[18/10] bg-[#0E3524] rounded-[100px] sm:rounded-[300px] border-[8px] sm:border-[16px] border-[#131b2e] shadow-[0_0_120px_rgba(0,0,0,0.8),inset_0_0_100px_rgba(0,0,0,0.5)] flex items-center justify-center mt-12 sm:mt-0">
             
             {/* Center Label */}
             <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none overflow-hidden">
                <span className="text-6xl sm:text-8xl font-black text-white/10 italic select-none tracking-widest">OMI</span>
             </div>
 
             {/* Center Play Area */}
             <div className="relative w-[40%] sm:w-[30%] aspect-square rounded-full flex items-center justify-center">
                
                {/* Discard Piles */}
                <div className="absolute left-[-100px] sm:left-[-220px] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-auto scale-75 sm:scale-100">
                    <div className="relative w-12 h-16">
                        {game.discardedTricksCount[0] > 0 && Array.from({ length: Math.min(game.discardedTricksCount[0], 8) }).map((_, i) => (
                            <div 
                                key={i} 
                                className="absolute inset-0 bg-[#0c162e] border border-blue-500/20 rounded-lg shadow-xl"
                                style={{ transform: `translate(${i * 1.5}px, ${-i * 1.5}px) rotate(${i * 3}deg)` }}
                            />
                        ))}
                    </div>
                    <div className="text-[8px] font-black uppercase text-blue-300/30 tracking-[0.2em] whitespace-nowrap">We: {game.discardedTricksCount[0]}</div>
                </div>
 
                <div className="absolute right-[-100px] sm:right-[-220px] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-auto scale-75 sm:scale-100">
                    <div className="relative w-12 h-16">
                        {game.discardedTricksCount[1] > 0 && Array.from({ length: Math.min(game.discardedTricksCount[1], 8) }).map((_, i) => (
                            <div 
                                key={i} 
                                className="absolute inset-0 bg-[#0c162e] border border-blue-500/20 rounded-lg shadow-xl"
                                style={{ transform: `translate(${-i * 1.5}px, ${-i * 1.5}px) rotate(${-i * 3}deg)` }}
                            />
                        ))}
                    </div>
                    <div className="text-[8px] font-black uppercase text-blue-300/30 tracking-[0.2em] whitespace-nowrap">They: {game.discardedTricksCount[1]}</div>
                </div>
 
                <AnimatePresence>
                    {game.currentTrick.map((play) => {
                        const relIdx = getRelativePos(game.players.find(p => p.id === play.playerId)!.pos);
                        const isMobile = window.innerWidth < 640;
                        const offsetVal = isMobile ? 50 : 80;
                        const offsets = [
                            { y: offsetVal, x: 0, r: 0 },   // Bottom
                            { y: 0, x: -offsetVal, r: -90 }, // Left
                            { y: -offsetVal, x: 0, r: 180 },  // Top
                            { y: 0, x: offsetVal, r: 90 },   // Right
                        ];
 
                        const isResolving = !!game.lastTrickResult;
                        const winner = playersByPos.find(p => p?.name === game.lastTrickResult?.winnerName);
                        const winnerRelIdx = winner ? getRelativePos(winner.pos) : -1;
                        
                        // Winner directions
                        const winnerOffsets = [
                            { y: 700, x: 0 },   // Bottom
                            { y: 0, x: -1200 }, // Left
                            { y: -700, x: 0 },  // Top
                            { y: 0, x: 1200 },   // Right
                        ];
 
                        return (
                            <motion.div
                                key={`${play.playerId}-${play.card.id}`}
                                initial={{ scale: 0.2, opacity: 0, y: offsets[relIdx].y * 3, x: offsets[relIdx].x * 3, rotate: offsets[relIdx].r + 45 }}
                                animate={isResolving && winnerRelIdx !== -1 ? { 
                                    scale: 0.1, 
                                    opacity: 0, 
                                    y: winnerOffsets[winnerRelIdx].y, 
                                    x: winnerOffsets[winnerRelIdx].x,
                                    rotate: offsets[relIdx].r + 180
                                } : { 
                                    scale: 1, 
                                    opacity: 1, 
                                    y: offsets[relIdx].y, 
                                    x: offsets[relIdx].x,
                                    rotate: offsets[relIdx].r + (Math.random() * 10 - 5)
                                }}
                                transition={{ 
                                    type: 'spring', 
                                    stiffness: 300, 
                                    damping: 30,
                                    duration: isResolving ? 0.7 : undefined
                                }}
                                className="absolute z-20 pointer-events-auto"
                            >
                                <Card card={play.card} disabled className="shadow-2xl scale-[0.5] sm:scale-[0.7]" />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
             </div>
 
             {/* Player Avatars around the table */}
             {playersByPos.map((p: Player | null, i) => {
                if (!p) return null;
                const posStyles = [
                    "-bottom-8 sm:-bottom-12 left-1/2 -translate-x-1/2", // Bottom
                    "-left-8 sm:-left-12 top-1/2 -translate-y-1/2",   // Left
                    "-top-8 sm:-top-12 left-1/2 -translate-x-1/2",    // Top
                    "-right-8 sm:-right-12 top-1/2 -translate-y-1/2",  // Right
                ];
                const isCurrent = game.currentTurnIdx === p.pos;
                const teamColor = p.team === me.team ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]';
 
                return (
                    <motion.div 
                        key={p.id} 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`absolute ${posStyles[i]} z-20 flex flex-col items-center gap-1 sm:gap-3`}
                    >
                        <div className={cn(
                            "w-14 h-14 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2.5rem] border-4 bg-[#0c162e] flex items-center justify-center text-2xl sm:text-4xl shadow-2xl transition-all duration-500 relative group",
                            isCurrent ? "scale-110 sm:scale-125 border-cyan-400 ring-4 sm:ring-8 ring-cyan-400/10" : `${teamColor} opacity-90`
                        )}>
                            {p.avatar || '👨‍🚀'}
                            {isCurrent && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 bg-cyan-400 rounded-full border-2 sm:border-4 border-[#0c162e] animate-bounce" />
                            )}
                            
                            {/* Prominent Card Count */}
                            <div className="absolute -bottom-1 sm:-bottom-2 -left-1 sm:-left-2 bg-gradient-to-br from-indigo-600 to-blue-700 text-white text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-white/20 shadow-xl flex items-center gap-1">
                                <span className="opacity-50">🎴</span>
                                {p.handSize}
                            </div>
                        </div>
                        <div className={cn(
                            "px-3 sm:px-5 py-1 sm:py-2 rounded-xl sm:rounded-2xl border-2 backdrop-blur-3xl flex flex-col items-center min-w-[80px] sm:min-w-[100px] shadow-xl",
                            isCurrent ? "bg-cyan-400/20 border-cyan-400/40" : "bg-black/60 border-white/5"
                        )}>
                            <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-white truncate max-w-[70px] sm:max-w-[100px]">{p.name}</span>
                            <div className="flex gap-1 mt-1 sm:mt-2">
                                {Array(Math.min(p.handSize, 4)).fill(0).map((_, idx) => (
                                    <div key={idx} className="w-1 h-1 bg-cyan-400/20 rounded-full" />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );
             })}
          </div>
        </div>
 
        {/* Bottom Section: Hand & Status */}
        <div className={cn(
            "h-48 sm:h-64 bg-gradient-to-t from-[#0c162e] to-transparent flex flex-col items-center justify-end pb-4 sm:pb-8 z-30 shrink-0",
            isSpectator ? "pointer-events-none opacity-60 grayscale" : ""
        )}>
          {isSpectator ? (
             <div className="mb-6 sm:mb-12 text-center px-4">
                <div className="inline-flex items-center gap-3 px-6 sm:px-10 py-3 sm:py-4 bg-white/5 border-2 border-white/5 rounded-full shadow-2xl backdrop-blur-md">
                    <Eye size={16} className="text-cyan-400" />
                    <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-white italic">Spectating Match</span>
                </div>
             </div>
          ) : (
            <div className="flex -space-x-12 sm:-space-x-12 pointer-events-auto items-center justify-center mb-0 sm:mb-4 px-4 overflow-x-auto w-full no-scrollbar">
                <AnimatePresence>
                    {me.hand.map((card, idx) => {
                        const isLegal = () => {
                            if (game.currentTrick.length === 0) return true;
                            const leadSuit = game.currentTrick[0].card.suit;
                            const hasLeadSuit = me.hand.some(c => c.suit === leadSuit);
                            if (hasLeadSuit) return card.suit === leadSuit;
                            return true;
                        };
                        const legal = isLegal();
                        const fanRotation = (idx - (me.hand.length / 2)) * 4;
 
                        return (
                            <motion.div
                                key={card.id}
                                initial={{ y: 300, rotate: fanRotation, scale: 0.5 }}
                                animate={{ 
                                    y: 0, 
                                    rotate: fanRotation, 
                                    opacity: legal ? 1 : 0.4,
                                    scale: legal ? (window.innerWidth < 640 ? 0.7 : 0.85) : 0.8,
                                    filter: legal ? 'brightness(1)' : 'brightness(0.5) contrast(0.8)'
                                }}
                                whileHover={legal && isMyTurn ? { y: -80, rotate: 0, zIndex: 100, scale: (window.innerWidth < 640 ? 0.8 : 1) } : {}}
                                onClick={() => isMyTurn && legal && playCard(card.id)}
                                exit={{ y: -500, opacity: 0, scale: 0.2 }}
                                className={cn(
                                    "transition-all duration-300 origin-bottom pointer-events-auto shrink-0",
                                    legal && isMyTurn ? "cursor-pointer" : "cursor-not-allowed"
                                )}
                                style={{ zIndex: idx }}
                            >
                                <Card 
                                    card={card} 
                                    disabled={!isMyTurn || !legal}
                                    className={cn(
                                        "ring-offset-8 ring-offset-[#131b2e] transition-all duration-300 rounded-xl sm:rounded-[2rem]",
                                        isMyTurn && legal && "hover:ring-4 hover:ring-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.4)]"
                                    )}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
          )}
 
          <div className="mt-2 sm:mt-4 flex items-center gap-8">
            <AnimatePresence>
                {isMyTurn && !isSpectator && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-4 bg-cyan-400/20 border-2 border-cyan-400/40 px-6 sm:px-10 py-2 sm:py-3 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                    >
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                        <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-white italic">Your Turn</span>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>

        {/* Global Overlays */}
        <AnimatePresence>
            {lastRoundWinner !== null && game.phase !== 'FINISHED' && (
                <motion.div 
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    className="absolute inset-0 z-[150] flex flex-col items-center justify-center pointer-events-none"
                >
                    <div className="bg-black/40 backdrop-blur-3xl p-16 rounded-[4rem] border-4 border-white/5 flex flex-col items-center gap-6 shadow-2xl">
                        <motion.div 
                            animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }} 
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="w-24 h-24 bg-cyan-400/20 rounded-full flex items-center justify-center border-4 border-cyan-400/40"
                        >
                            <Trophy size={48} className="text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
                        </motion.div>
                        <div className="text-center">
                            <h3 className="text-sm font-black text-cyan-400 uppercase tracking-[0.4em] mb-2">Round Extraction Complete</h3>
                            <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase drop-shadow-2xl">
                                {lastRoundWinner === me.team ? 'VICTORY' : 'DEFEAT'}
                            </h2>
                            <p className="mt-6 text-[10px] font-black text-blue-300/40 uppercase tracking-[0.3em]">
                                Team {lastRoundWinner + 1} Secured {game.tricksWon[lastRoundWinner]} Tricks
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {game.phase === 'FINISHED' && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 overflow-hidden">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
                    />
                    
                    {/* Confetti-like bits */}
                    <div className="absolute inset-0 pointer-events-none">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ 
                                    y: -20, 
                                    x: Math.random() * 100 + "%", 
                                    opacity: 1, 
                                    rotate: 0,
                                    scale: Math.random() * 0.5 + 0.5
                                }}
                                animate={{ 
                                    y: "120vh", 
                                    rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                                }}
                                transition={{ 
                                    duration: Math.random() * 3 + 2, 
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: Math.random() * 5
                                }}
                                className={cn(
                                    "absolute w-4 h-4 rounded-sm",
                                    i % 2 === 0 ? "bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" : "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                )}
                            />
                        ))}
                    </div>

                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0, rotateX: 45 }}
                        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                        className="relative w-full max-w-2xl bg-gradient-to-br from-[#0c162e] to-[#040815] rounded-[4rem] border-8 border-cyan-400/20 p-16 shadow-[0_0_150px_rgba(34,211,238,0.2)] text-center"
                    >
                         <motion.div 
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="w-32 h-32 bg-cyan-400/20 rounded-[3rem] flex items-center justify-center mx-auto mb-10 border-4 border-cyan-400/40 relative"
                         >
                             <Trophy size={64} className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
                             <div className="absolute -inset-4 bg-cyan-400/10 rounded-full blur-2xl animate-pulse" />
                         </motion.div>

                         <h2 className="text-[12px] font-black text-cyan-400 uppercase tracking-[0.5em] mb-4 italic">Campaign Concluded</h2>
                         <h1 className="text-7xl font-black text-white italic tracking-tighter mb-4 uppercase drop-shadow-2xl">
                            {game.winnerTeam === me.team ? 'VICTORY' : 'DEFEAT'}
                         </h1>

                         <div className="flex justify-center gap-4 mb-8">
                            {game.players.filter(p => p.team === game.winnerTeam).map(p => (
                                <div key={p.id} className="flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-cyan-400/30 flex items-center justify-center text-3xl shadow-lg">
                                        {p.avatar}
                                    </div>
                                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{p.name}</span>
                                </div>
                            ))}
                         </div>
                         
                         <div className="bg-white/5 rounded-[2.5rem] p-8 border-2 border-white/5 mb-12 flex justify-center items-center gap-12">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-cyan-400 uppercase mb-2">We</p>
                                <p className="text-6xl font-black text-white">{game.scores[me.team]}</p>
                            </div>
                            <div className="h-16 w-0.5 bg-white/10" />
                            <div className="text-center">
                                <p className="text-[10px] font-black text-white/20 uppercase mb-2">They</p>
                                <p className="text-6xl font-black text-white/20">{game.scores[1 - me.team]}</p>
                            </div>
                         </div>

                         <div className="flex gap-4">
                            <button 
                                onClick={() => window.location.reload()}
                                className="flex-1 py-6 bg-cyan-500 hover:bg-cyan-400 text-white font-black rounded-3xl transition-all shadow-[0_10px_30px_rgba(34,211,238,0.3)] uppercase tracking-widest text-xs border-b-6 border-cyan-700 active:translate-y-1 active:border-b-0"
                            >
                                Re-Deploy Operative
                            </button>
                            <button 
                                onClick={() => window.location.href = '/'}
                                className="px-8 py-6 bg-white/5 hover:bg-white/10 text-white/40 font-black rounded-3xl transition-all uppercase tracking-widest text-xs border border-white/10"
                            >
                                Retreat
                            </button>
                         </div>
                    </motion.div>
                </div>
            )}

            {showLastTrickOverlay && game.lastTrick && (
                <div className="absolute inset-0 z-[120] flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowLastTrickOverlay(false)}
                        className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
                    />
                    <motion.div 
                        initial={{ scale: 0.9, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        className="relative w-full max-w-2xl bg-[#0c162e] rounded-[4rem] border-4 border-white/5 p-12 shadow-[0_0_150px_rgba(0,0,0,0.8)]"
                    >
                         <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-10 text-center">Last Played Hand</h3>
                         <div className="flex justify-center gap-12">
                            {game.lastTrick.map((play, idx) => {
                                const player = game.players.find(p => p.id === play.playerId);
                                return (
                                    <div key={idx} className="flex flex-col items-center gap-4">
                                        <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest">{player?.name}</div>
                                        <Card card={play.card} disabled className="scale-[1.2]" />
                                    </div>
                                );
                            })}
                         </div>
                         <button 
                            onClick={() => setShowLastTrickOverlay(false)}
                            className="mt-16 w-full py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-3xl transition-all uppercase tracking-widest text-xs border border-white/10"
                         >
                            Return to Table
                         </button>
                    </motion.div>
                </div>
            )}

            {game.lastTrickResult && (
                <motion.div
                    key="trick-result"
                    initial={{ opacity: 0, scale: 0.5, y: 100, x: '-50%' }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, scale: 0.5, y: -100, x: '-50%' }}
                    className="absolute top-32 left-1/2 z-50 pointer-events-none"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <div className="bg-cyan-500 text-white px-10 py-4 rounded-[2rem] shadow-[0_0_50px_rgba(34,211,238,0.5)] border-4 border-white/20 flex items-center gap-5 backdrop-blur-xl">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-black">
                            {suitSymbols[game.lastTrickResult.winningCard.suit]}
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 leading-none mb-1italic">Captured by</p>
                            <p className="text-lg font-black uppercase tracking-tight italic">{game.lastTrickResult.winnerName}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {game.phase === 'LOBBY' && !isSpectator && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-[#0A0A0B] flex flex-col items-center py-12 px-6 overflow-y-auto custom-scrollbar"
                >
                    <div className="bg-[#0c162e] p-8 md:p-12 rounded-[3.5rem] border-4 border-white/5 text-center max-w-4xl w-full shadow-[0_0_150px_rgba(30,58,138,0.3)] relative shrink-0">
                        <div className="absolute -top-12 -left-12 w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
                        
                        <div className="flex flex-col items-center mb-10">
                            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-cyan-400 shadow-inner border-2 border-white/5 mb-6">
                                <Users size={40} className="animate-pulse" />
                            </div>
                            <h2 className="text-5xl font-black mb-2 uppercase tracking-tighter italic text-white">Battle Lobby</h2>
                            <p className="text-blue-200/30 text-xs font-bold uppercase tracking-[0.4em]">Sector {game.roomId.toUpperCase()} • Staging Area</p>
                        </div>

                        {/* Player Slots */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            {[0, 1, 2, 3].map(pos => {
                                const p = game.players.find(player => player.pos === pos);
                                const isMe = p?.id === me.id;
                                const team = (pos % 2 === 0 ? 1 : 2);
                                
                                return (
                                    <motion.div 
                                        key={pos}
                                        layout
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={cn(
                                            "relative p-6 rounded-[2.5rem] border-4 flex flex-col items-center gap-4 transition-all duration-500 group",
                                            p ? (p.isBot ? "bg-white/5 border-white/10" : "bg-cyan-500/10 border-cyan-400/40 shadow-2xl") : "bg-black/40 border-white/5 border-dashed"
                                        )}
                                    >
                                        <div className="absolute -top-3 px-3 py-1 bg-black rounded-full text-[8px] font-black uppercase tracking-widest text-blue-300/40 border border-white/10">
                                            Team {team} Slot
                                        </div>

                                        <div className={cn(
                                            "w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl relative",
                                            p ? "bg-white/10" : "bg-white/5 grayscale"
                                        )}>
                                            {p ? (p.isBot ? '🤖' : '👨‍🚀') : currentChar.avatar}
                                            {p?.isReady && (
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyan-400 rounded-full border-4 border-[#0c162e] flex items-center justify-center">
                                                    <Shield size={10} className="text-[#0c162e]" fill="currentColor" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-center gap-1">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]",
                                                p ? "text-white" : "text-blue-300/20"
                                            )}>
                                                {p ? (isMe ? 'YOU' : p.name) : currentChar.name}
                                            </span>
                                            {p && (
                                                <span className="text-[8px] font-black text-cyan-400/50 uppercase tracking-[0.2em]">
                                                    {p.isBot ? p.botDifficulty : 'OPERATIVE'}
                                                </span>
                                            )}
                                            {!p && (
                                                <div className="flex gap-1 mt-1">
                                                    {[...Array(3)].map((_, i) => (
                                                        <div key={i} className={cn("w-1 h-1 rounded-full", i < currentChar.stars ? "bg-cyan-400" : "bg-white/10")} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {!p && !isSpectator && (
                                            <div className="flex flex-col w-full gap-3 mt-2">
                                                <div className="flex items-center justify-between w-full px-2">
                                                    <button 
                                                        onClick={() => setCharIdx((charIdx - 1 + availableCharacters.length) % availableCharacters.length)}
                                                        className="p-1 hover:bg-white/10 rounded-lg text-white"
                                                    >
                                                        <ChevronLeft size={16} />
                                                    </button>
                                                    <span className="text-[8px] font-black text-blue-300/40 uppercase">Selector</span>
                                                    <button 
                                                        onClick={() => setCharIdx((charIdx + 1) % availableCharacters.length)}
                                                        className="p-1 hover:bg-white/10 rounded-lg text-white"
                                                    >
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => addBot(currentChar.difficulty, currentChar.name)}
                                                    className="w-full py-3 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest text-cyan-400 transition-all border-2 border-cyan-400/40 shadow-lg shadow-cyan-900/10"
                                                >
                                                    Deploy AI
                                                </button>
                                            </div>
                                        )}

                                        {isMe && !p.isReady && (
                                            <div className="text-[8px] font-black text-rose-500 uppercase tracking-widest animate-pulse mt-1">Pending Sync</div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="flex flex-col items-center gap-6">
                            {!me.isReady ? (
                                <button
                                    onClick={ready}
                                    className="w-full max-w-sm bg-cyan-500 hover:bg-cyan-400 py-6 rounded-[2rem] font-black tracking-[0.3em] transition-all shadow-[0_10px_40px_rgba(34,211,238,0.4)] uppercase text-sm text-white italic border-b-[6px] border-cyan-700 active:translate-y-1 active:border-b-0"
                                >
                                    Engage Mission
                                </button>
                            ) : (
                                <div className="text-cyan-400 font-black uppercase tracking-[0.5em] flex items-center gap-4 text-sm animate-pulse italic">
                                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
                                    Waiting for Signal Alignment
                                </div>
                            )}

                            {game.players.length < 4 && !isSpectator && (
                                <button
                                    onClick={() => fillBots()}
                                    className="px-8 py-3 bg-white/5 hover:bg-white/10 text-blue-300/40 font-black rounded-full transition-all uppercase tracking-widest text-[9px] border border-white/5"
                                >
                                    Auto-Fill Squad Deployment
                                </button>
                            )}

                            <div className="text-blue-300/20 text-[9px] font-black uppercase tracking-[0.4em] max-w-xs leading-relaxed italic">
                                All 4 operative slots must be filled and synced before match initiation.
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {isMyTrumpCall && !isSpectator && (
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-[#0c162e]/80 backdrop-blur-xl flex items-center justify-center p-6"
                 >
                    <div className="bg-[#0c162e] p-12 rounded-[3.5rem] border-4 border-white/5 text-center max-w-xl w-full shadow-2xl">
                        <h2 className="text-[11px] font-black mb-10 uppercase tracking-[0.4em] text-blue-300/40 italic">Designate Trump Vector</h2>
                        <div className="grid grid-cols-4 gap-8">
                            {(['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'] as Suit[]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setTrump(s)}
                                    className="aspect-square bg-white/5 hover:bg-white/10 border-4 border-white/5 hover:border-cyan-400 transition-all rounded-[2.5rem] flex flex-col items-center justify-center group shadow-2xl"
                                >
                                    <span className={cn(
                                        "text-5xl transition-transform group-hover:scale-125 duration-500",
                                        (s === 'HEARTS' || s === 'DIAMONDS') ? 'text-rose-500' : 'text-white'
                                    )}>
                                        {suitSymbols[s]}
                                    </span>
                                    <span className="text-[10px] font-black mt-4 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest text-cyan-400 italic">{s}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                 </motion.div>
            )}
        </AnimatePresence>

        {/* Floating Utility Buttons */}
        <div className="fixed sm:absolute bottom-6 sm:bottom-10 right-6 sm:right-10 z-[60] flex sm:flex-col gap-3 sm:gap-5">
            {game.lastTrick && (
                <motion.button 
                    whileHover={{ scale: 1.1, rotate: -10 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowLastTrickOverlay(true)}
                    className="bg-cyan-500/20 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-cyan-400 border-2 border-cyan-400/30 hover:bg-cyan-500/30 transition-all shadow-xl group"
                >
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
            )}
            <motion.button 
                whileHover={{ scale: 1.1, rotate: -10 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(true)}
                className="bg-[#0c162e]/60 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-blue-300/60 border-2 border-white/5 hover:bg-white/10 hover:text-white transition-all shadow-xl group"
            >
                <Settings2 className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform" />
            </motion.button>
            <motion.button 
                whileHover={{ scale: 1.1, rotate: -10 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowHistory(true)}
                className="bg-[#0c162e]/60 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-blue-300/60 border-2 border-white/5 hover:bg-white/10 hover:text-white transition-all shadow-xl group"
            >
                <History className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
            <motion.button 
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowChat(!showChat)}
                className="bg-[#0c162e]/60 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-blue-300/60 border-2 border-white/5 hover:bg-white/10 hover:text-white transition-all shadow-xl relative group"
            >
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                {game.chat.length > 0 && !showChat && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-[#0c162e] shadow-lg animate-bounce" />
                )}
            </motion.button>
        </div>

        {/* Tactical Chat Panel */}
        <AnimatePresence>
            {showChat && (
                <motion.div 
                    initial={{ x: 400 }}
                    animate={{ x: 0 }}
                    exit={{ x: 400 }}
                    className="fixed lg:absolute top-0 right-0 bottom-0 w-full sm:w-80 bg-[#0c162e]/95 backdrop-blur-3xl border-l-4 border-blue-900/30 z-[70] flex flex-col shadow-2xl"
                >
                    <div className="p-6 border-b-2 border-white/5 flex justify-between items-center bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                            <div>
                                <h3 className="font-black text-white uppercase tracking-[0.2em] text-[10px] italic">Tactical Comms</h3>
                            </div>
                        </div>
                        <button onClick={() => setShowChat(false)} className="text-blue-300/40 hover:text-white transition-colors">✕</button>
                    </div>
                    <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                        {game.chat.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-10">
                                <MessageSquare size={48} className="mb-4" />
                                <p className="text-[12px] uppercase font-black tracking-widest text-center italic">Encryption Active</p>
                            </div>
                        )}
                        {game.chat.map((msg) => (
                            <div key={msg.id} className={cn("flex flex-col", msg.senderId === me.id ? "items-end" : "items-start")}>
                                <span className="text-[10px] font-black text-blue-300/30 mb-2 uppercase tracking-tighter italic">{msg.senderName}</span>
                                <div className={cn(
                                    "max-w-[90%] px-5 py-3 rounded-[1.5rem] text-[13px] font-bold leading-relaxed shadow-xl",
                                    msg.senderId === me.id ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-tr-none border-2 border-white/10" : "bg-white/5 text-blue-100 rounded-tl-none border-2 border-white/5"
                                )}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (chatInp.trim()) {
                                sendMessage(chatInp);
                                setChatInp('');
                            }
                        }}
                        className="p-6 border-t-2 border-white/5 flex gap-3 bg-white/5"
                    >
                        <input 
                            value={chatInp}
                            onChange={e => setChatInp(e.target.value)}
                            placeholder="Type comms..."
                            className="flex-1 bg-black/40 border-2 border-white/5 rounded-2xl px-5 py-4 text-white text-xs focus:border-cyan-400 outline-none transition-all placeholder:text-blue-300/20 font-bold"
                        />
                        <button className="p-4 bg-cyan-500 hover:bg-cyan-400 transition-colors rounded-2xl text-white shadow-xl shadow-cyan-900/40 active:scale-95 border-b-4 border-cyan-700">
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Global Settings Overlay */}
        <AnimatePresence>
            {showSettings && (
                <div className="absolute inset-0 z-[140] flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowSettings(false)}
                        className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
                    />
                    <motion.div 
                        initial={{ scale: 0.9, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        className="relative w-full max-w-xl bg-[#0c162e] rounded-[4rem] border-4 border-white/5 p-12 shadow-[0_0_150px_rgba(0,0,0,0.8)]"
                    >
                         <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-10 text-center flex items-center justify-center gap-4">
                            <Settings2 className="w-8 h-8 text-cyan-400" />
                            Tactical Settings
                         </h3>

                         <div className="space-y-10">
                            {/* Target Score setting */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em] italic px-4">Match Target Score</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[5, 10, 15].map(score => (
                                        <button 
                                            key={score}
                                            onClick={() => updateSettings(score)}
                                            className={cn(
                                                "py-5 rounded-3xl font-black text-sm transition-all border-2",
                                                game.targetScore === score 
                                                    ? "bg-cyan-500 border-cyan-400 text-white shadow-xl shadow-cyan-900/40" 
                                                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10"
                                            )}
                                        >
                                            {score} PTS
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* BGM Volume Setting */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em] italic px-4">Ambient Protocol Volume</label>
                                <div className="flex items-center gap-6 p-6 bg-white/5 border-2 border-white/5 rounded-3xl">
                                    <Volume2 size={20} className="text-cyan-400" />
                                    <input 
                                        type="range"
                                        min="0"
                                        max="0.2"
                                        step="0.01"
                                        defaultValue="0.05"
                                        onChange={(e) => soundManager.setBGMVolume(parseFloat(e.target.value))}
                                        className="flex-1 accent-cyan-400 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Sound Toggle Setting */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button 
                                    onClick={() => {
                                        const muted = soundManager.toggleBGMMute();
                                        setIsBGMMuted(muted);
                                    }}
                                    className="flex flex-col items-center gap-4 p-6 bg-white/5 border-2 border-white/5 rounded-3xl hover:bg-white/10 transition-all group"
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                        isBGMMuted ? "bg-rose-500/20 text-rose-500" : "bg-cyan-500/20 text-cyan-400"
                                    )}>
                                        {isBGMMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-white uppercase italic">Ambient Music</p>
                                        <p className="text-[8px] text-blue-300/30 uppercase font-black tracking-widest">{isBGMMuted ? 'Offline' : 'Operational'}</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => {
                                        const muted = soundManager.toggleSFXMute();
                                        setIsSFXMuted(muted);
                                    }}
                                    className="flex flex-col items-center gap-4 p-6 bg-white/5 border-2 border-white/5 rounded-3xl hover:bg-white/10 transition-all group"
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                        isSFXMuted ? "bg-rose-500/20 text-rose-500" : "bg-indigo-500/20 text-indigo-400"
                                    )}>
                                        {isSFXMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-white uppercase italic">Tactical FX</p>
                                        <p className="text-[8px] text-blue-300/30 uppercase font-black tracking-widest">{isSFXMuted ? 'Offline' : 'Operational'}</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowSettings(false)}
                            className="mt-16 w-full py-6 bg-white/5 hover:bg-white/10 text-white font-black rounded-[2rem] transition-all uppercase tracking-widest text-xs border border-white/10"
                        >
                            Apply Protocol
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Global History Overlay */}
        <AnimatePresence>
            {showHistory && (
                <div className="absolute inset-0 z-[80] flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowHistory(false)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        className="relative w-full max-w-xl bg-[#0c162e] rounded-[3.5rem] border-4 border-blue-900/30 shadow-[0_0_150px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        <div className="p-10 border-b-2 border-white/5 flex justify-between items-center bg-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <History size={120} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Tactical Archives</h3>
                                <p className="text-[11px] text-blue-300/40 font-black uppercase mt-1 tracking-widest">Historical Conflict Outcomes</p>
                            </div>
                            <button onClick={() => setShowHistory(false)} className="relative z-10 bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-white transition-colors border-2 border-white/10">✕</button>
                        </div>
                        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4 custom-scrollbar">
                            {matchHistory.length === 0 && (
                                <div className="py-24 text-center opacity-10">
                                    <History size={80} className="mx-auto mb-6" />
                                    <p className="text-sm font-black uppercase tracking-[0.4em] italic">Archive purge complete</p>
                                </div>
                            )}
                            {matchHistory.map((h, i) => (
                                <div key={i} className="bg-black/30 p-6 rounded-[2rem] border-2 border-white/5 flex justify-between items-center group hover:border-cyan-500/40 transition-all transform hover:scale-[1.02]">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-blue-300/30 uppercase tracking-widest">{h.date}</div>
                                        <div className="flex items-center gap-4">
                                            <span className={cn(
                                                "px-4 py-1 rounded-full text-[11px] font-black border-2 italic",
                                                h.winner === me.team ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]" : "bg-rose-500/10 border-rose-500/40 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                                            )}>
                                                {h.winner === me.team ? 'VICTORY' : 'DEFEAT'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black text-white font-mono tracking-tighter flex items-center">
                                        <span className={h.winner === 0 ? "text-cyan-400" : "opacity-40"}>{h.score[0]}</span>
                                        <span className="mx-3 opacity-10 italic">/</span>
                                        <span className={h.winner === 1 ? "text-cyan-400" : "opacity-40"}>{h.score[1]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-white/5 border-t-2 border-white/5 text-center">
                             <p className="text-[10px] text-blue-300/30 font-black uppercase tracking-[0.2em] italic">Archive storage: 50 cycles remaining</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      </main>
    </div>
  );
};
