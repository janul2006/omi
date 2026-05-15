import React from 'react';
import { useGameStore } from '../store.js';
import { Card } from './Card.js';
import { motion, AnimatePresence } from 'motion/react';
import { Suit, Player } from '../types.js';
import { Trophy, MessageSquare, Shield, Clock, QrCode, Copy, Link, Eye, Share2 } from 'lucide-react';
import { cn } from '../lib/utils.js';
import { QRCodeCanvas } from 'qrcode.react';

import { soundManager } from '../lib/sounds.js';

const suitSymbols: Record<Suit, string> = {
  CLUBS: '♣',
  DIAMONDS: '♦',
  HEARTS: '♥',
  SPADES: '♠'
};

export const GameTable: React.FC = () => {
  const { game, me, ready, setTrump, playCard, fillBots, isSpectator } = useGameStore();

  // Play sounds based on state changes
  React.useEffect(() => {
    if (!game) return;
    
    // Card played
    const currentTrickLength = game.currentTrick.length;
    if (currentTrickLength > 0) {
        soundManager.play('CARD_PLAY');
    }
  }, [game?.currentTrick.length]);

  React.useEffect(() => {
    if (game?.phase === 'PLAYING') {
        soundManager.play('GAME_START');
    }
  }, [game?.phase]);

  React.useEffect(() => {
    if (game?.lastTrickResult) {
        soundManager.play('TRICK_WIN');
    }
  }, [game?.lastTrickResult?.winnerName]);

  if (!game || !me) return null;

  const inviteUrl = `${window.location.origin}?room=${game.roomId}`;

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

  const isMyTurn = game.currentTurnIdx === me.pos && game.phase === 'PLAYING';
  const isMyTrumpCall = game.trumpCallerIdx === me.pos && game.phase === 'TRUMP_CALLING';

  return (
    <div className="h-screen w-full bg-[#0A0A0B] text-slate-200 flex overflow-hidden font-sans">
      {/* Left Sidebar: Stats & Activity */}
      <aside className="w-80 bg-[#121214] border-r border-slate-800 flex flex-col z-30 shrink-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-emerald-900/20 text-xl tracking-tighter">O</div>
            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">OMI PRO</h1>
          </div>

          <div className="space-y-6">
            {/* Scoreboard */}
            <div className="bg-[#1A1A1D] rounded-2xl p-5 border border-slate-800 transition-all shadow-xl">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-5">Match Standings</h2>
              <div className="flex justify-between items-end gap-2">
                <div className="flex-1 text-center">
                  <p className={`text-[10px] font-bold uppercase mb-1 ${me.team === 0 ? 'text-blue-400' : 'text-rose-400'}`}>Team 01</p>
                  <p className="text-4xl font-black text-white tabular-nums">{game.scores[0].toString().padStart(2, '0')}</p>
                </div>
                <div className="h-12 w-[1px] bg-slate-800 mb-1"></div>
                <div className="flex-1 text-center">
                  <p className={`text-[10px] font-bold uppercase mb-1 ${me.team === 1 ? 'text-blue-400' : 'text-rose-400'}`}>Team 02</p>
                  <p className="text-4xl font-black text-white tabular-nums">{game.scores[1].toString().padStart(2, '0')}</p>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-800 flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-slate-500">Tricks this round</span>
                <span className="text-emerald-400 font-black">T1: {game.tricksWon[0]} | T2: {game.tricksWon[1]}</span>
              </div>
            </div>

            {/* Room Info */}
            <div className="space-y-3 px-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-500">Room Code</span>
                <span className="text-slate-100 font-mono text-xs">#{game.roomId.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-500">Phase</span>
                <span className={cn(
                    "font-black px-2 py-0.5 rounded text-[9px]",
                    game.phase === 'PLAYING' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800 text-slate-400"
                )}>
                    {game.phase.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Activity Logs */}
            <div className="bg-[#0A0A0B] rounded-2xl border border-slate-800 p-4 shadow-inner">
              <p className="text-[10px] uppercase text-slate-600 font-black tracking-widest mb-4">Tactical Feed</p>
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {[...game.history].reverse().map((log, i) => (
                  <div key={i} className="text-[10px] leading-relaxed text-slate-400 border-l-2 border-emerald-500/20 pl-3 py-1">
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
      </aside>

      {/* Main Game Stage */}
      <main className="flex-1 relative bg-[#0A0A0B] flex flex-col overflow-hidden">
        {/* Trump Indicator Floating */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-black/40 backdrop-blur-xl px-6 py-2 rounded-full border border-slate-700/50 flex items-center gap-4 shadow-2xl">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Trump Vector</span>
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner group">
              {game.trumpSuit ? (
                <span className={cn(
                    "transition-all duration-500 group-hover:scale-125",
                    (game.trumpSuit === 'HEARTS' || game.trumpSuit === 'DIAMONDS') ? 'text-rose-500' : 'text-white'
                )}>
                    {suitSymbols[game.trumpSuit]}
                </span>
              ) : (
                <span className="text-slate-700 animate-pulse">?</span>
              )}
            </div>
          </div>
        </div>

        {/* The Table Stage */}
        <div className="flex-1 flex items-center justify-center px-4 py-4 pointer-events-none overflow-hidden">
          <div className="relative w-full max-w-4xl aspect-[16/10] bg-[#0E3524] rounded-[240px] border-[12px] border-[#1C1C1E] shadow-[0_0_80px_rgba(0,0,0,0.6),inset_0_0_100px_rgba(0,0,0,0.5)] flex items-center justify-center">
             {/* Center Play Area */}
             <div className="relative w-[28%] aspect-square rounded-full flex items-center justify-center border border-white/5 bg-black/5">
                <AnimatePresence>
                    {game.currentTrick.map((play) => {
                        const relIdx = getRelativePos(game.players.find(p => p.id === play.playerId)!.pos);
                        const offsets = [
                            { y: 45, x: 0, r: 0 },   // Bottom
                            { y: 0, x: -45, r: 0 }, // Left
                            { y: -45, x: 0, r: 0 },  // Top
                            { y: 0, x: 45, r: 0 },   // Right
                        ];

                        const isResolving = !!game.lastTrickResult;
                        const winner = playersByPos.find(p => p?.name === game.lastTrickResult?.winnerName);
                        const winnerRelIdx = winner ? getRelativePos(winner.pos) : -1;
                        
                        // Winner directions
                        const winnerOffsets = [
                            { y: 500, x: 0 },   // Bottom
                            { y: 0, x: -500 }, // Left
                            { y: -500, x: 0 },  // Top
                            { y: 0, x: 500 },   // Right
                        ];

                        return (
                            <motion.div
                                key={`${play.playerId}-${play.card.id}`}
                                initial={{ scale: 0.5, opacity: 0, y: offsets[relIdx].y * 1.5, x: offsets[relIdx].x * 1.5 }}
                                animate={isResolving && winnerRelIdx !== -1 ? { 
                                    scale: 0.4, 
                                    opacity: 0, 
                                    y: winnerOffsets[winnerRelIdx].y, 
                                    x: winnerOffsets[winnerRelIdx].x 
                                } : { 
                                    scale: 1, 
                                    opacity: 1, 
                                    y: offsets[relIdx].y, 
                                    x: offsets[relIdx].x 
                                }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ 
                                    type: isResolving ? 'tween' : 'spring', 
                                    stiffness: 250, 
                                    damping: 25,
                                    duration: isResolving ? 0.6 : undefined
                                }}
                                className="absolute z-20 pointer-events-auto"
                            >
                                <Card card={play.card} disabled className="shadow-2xl scale-[0.65] border-2 border-slate-100" />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {game.currentTrick.length === 0 && game.phase === 'PLAYING' && (
                    <div className="text-[9px] font-black uppercase text-white/5 tracking-[0.4em] text-center max-w-[100px]">
                        Tactical Field
                    </div>
                )}
             </div>

             {/* Player Avatars around the table */}
             {playersByPos.map((p: Player | null, i) => {
                if (!p) return null;
                const posStyles = [
                    "-bottom-8 left-1/2 -translate-x-1/2", // Bottom
                    "-left-8 top-1/2 -translate-y-1/2",   // Left
                    "-top-8 left-1/2 -translate-x-1/2",    // Top
                    "-right-8 top-1/2 -translate-y-1/2",  // Right
                ];
                const isCurrent = game.currentTurnIdx === p.pos;
                const teamColor = p.team === me.team ? 'border-blue-500' : 'border-rose-500';

                return (
                    <div key={p.id} className={`absolute ${posStyles[i]} z-20 flex flex-col items-center gap-2`}>
                        <div className={cn(
                            "w-12 h-12 rounded-full border-2 p-0.5 bg-[#121214] overflow-hidden transition-all duration-300",
                            isCurrent ? "scale-110 shadow-[0_0_20px_rgba(16,185,129,0.5)] border-emerald-500" : `${teamColor} opacity-90 shadow-lg`
                        )}>
                            <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center font-black text-sm text-slate-100">
                                {p.name[0].toUpperCase()}
                            </div>
                        </div>
                        <div className={cn(
                            "px-3 py-1 rounded-full border border-slate-800/50 backdrop-blur-md flex flex-col items-center min-w-[70px]",
                            isCurrent ? "bg-emerald-500/10 border-emerald-500/30" : "bg-black/50"
                        )}>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-100 truncate max-w-[80px]">{p.name}</span>
                            <div className="flex gap-0.5 mt-1">
                                {Array(p.handSize).fill(0).map((_, idx) => (
                                    <div key={idx} className="w-1 h-1 bg-white/20 rounded-full" />
                                ))}
                            </div>
                        </div>
                    </div>
                );
             })}
          </div>
        </div>

        {/* Bottom Section: Hand & Status */}
        <div className={cn(
            "h-56 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center justify-end pb-6 z-30 shrink-0",
            isSpectator ? "pointer-events-none opacity-60 grayscale" : ""
        )}>
          {isSpectator ? (
             <div className="mb-12 text-center">
                <div className="inline-flex items-center gap-3 px-8 py-3 bg-slate-900 border border-slate-800 rounded-full shadow-2xl">
                    <Eye size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Tactical Spectator Feed</span>
                </div>
             </div>
          ) : (
            <div className="flex -space-x-12 sm:-space-x-8 pointer-events-auto items-center justify-center">
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
                                initial={{ y: 200, rotate: fanRotation }}
                                animate={{ 
                                    y: 0, 
                                    rotate: fanRotation, 
                                    opacity: legal ? 1 : 0.25,
                                    scale: legal ? 0.75 : 0.7,
                                    filter: legal ? 'brightness(1)' : 'brightness(0.3) grayscale(0.5)'
                                }}
                                whileHover={legal ? { y: -50, rotate: 0, zIndex: 100, scale: 0.9 } : {}}
                                exit={{ y: -100, opacity: 0 }}
                                className="transition-all duration-300 origin-bottom"
                                style={{ zIndex: idx }}
                            >
                                <Card 
                                    card={card} 
                                    onClick={() => playCard(card.id)} 
                                    disabled={!isMyTurn || !legal}
                                    className={cn(
                                        "ring-offset-4 ring-offset-[#0A0A0B] transition-all duration-300",
                                        isMyTurn && legal && "hover:ring-2 hover:ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                    )}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
          )}

          <div className="mt-8 flex items-center gap-8">
            <AnimatePresence>
                {isMyTurn && !isSpectator && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/40 px-8 py-2 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Deploy Tactical Card</span>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock size={12} className="text-slate-800" />
                Channel: <span className="text-emerald-500/60 font-mono">ENCRYPTED</span>
            </div>
          </div>
        </div>

        {/* Global Overlays */}
        <AnimatePresence>
            {game.lastTrickResult && (
                <motion.div
                    key="trick-result"
                    initial={{ opacity: 0, scale: 0.8, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, scale: 0.8, y: -50, x: '-50%' }}
                    className="absolute top-24 left-1/2 z-50 pointer-events-none"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                    <div className="bg-emerald-600 text-white px-8 py-3 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)] border border-white/20 flex items-center gap-4 backdrop-blur-md">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-xl">
                            {suitSymbols[game.lastTrickResult.winningCard.suit]}
                        </div>
                        <div className="text-left">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 leading-none mb-1">Hand Captured</p>
                            <p className="text-sm font-black uppercase tracking-tight">{game.lastTrickResult.winnerName} <span className="opacity-60 font-normal">[{game.lastTrickResult.winningCard.rank}]</span></p>
                        </div>
                    </div>
                </motion.div>
            )}

            {game.phase === 'LOBBY' && !me.isReady && !isSpectator && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md flex items-center justify-center p-6"
                >
                    <div className="bg-[#121214] p-12 rounded-[2.5rem] border border-slate-800 text-center max-w-sm w-full shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                        <div className="w-20 h-20 bg-slate-800 rounded-3xl mx-auto mb-8 flex items-center justify-center text-amber-500 shadow-inner">
                            <Clock size={40} />
                        </div>
                        <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">PRE-STAGING</h2>
                        <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Coordinate with your team. All 4 units must be ready to proceed with the round.</p>
                        <div className="space-y-3">
                            <button
                                onClick={ready}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-2xl font-black tracking-widest transition-all shadow-xl shadow-emerald-900/10 uppercase text-xs"
                            >
                                Signal Ready
                            </button>
                            {game.players.length < 4 && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => useGameStore.getState().addBot()}
                                        className="w-full bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-black tracking-widest transition-all uppercase text-[10px] text-slate-400 border border-slate-700/50"
                                    >
                                        +1 AI
                                    </button>
                                    <button
                                        onClick={() => fillBots()}
                                        className="w-full bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-black tracking-widest transition-all uppercase text-[10px] text-slate-400 border border-slate-700/50"
                                    >
                                        Auto-Fill
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {isMyTrumpCall && !isSpectator && (
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md flex items-center justify-center p-6 ml-[-288px]"
                 >
                    <div className="bg-[#121214] p-10 rounded-[2.5rem] border border-slate-800 text-center max-w-xl w-full">
                        <h2 className="text-xs font-black mb-8 uppercase tracking-[0.4em] text-slate-500">Designate Trump Vector</h2>
                        <div className="grid grid-cols-4 gap-6">
                            {(['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'] as Suit[]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setTrump(s)}
                                    className="aspect-square bg-[#0A0A0B] hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 transition-all rounded-3xl flex flex-col items-center justify-center group shadow-xl"
                                >
                                    <span className={cn(
                                        "text-4xl transition-transform group-hover:scale-125 duration-300",
                                        (s === 'HEARTS' || s === 'DIAMONDS') ? 'text-rose-500' : 'text-slate-200'
                                    )}>
                                        {suitSymbols[s]}
                                    </span>
                                    <span className="text-[9px] font-black mt-3 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest text-slate-500">{s}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                 </motion.div>
            )}
        </AnimatePresence>
      </main>
    </div>
  );
};
