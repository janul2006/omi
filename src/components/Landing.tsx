import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store.js';
import { Trophy, Users, Play, Heart, Eye, Settings2, Volume2, VolumeX } from 'lucide-react';
import { BotDifficulty } from '../types.js';
import { cn } from '../lib/utils.js';
import { Lobby } from './Lobby.js';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../lib/sounds.js';

export const Landing: React.FC = () => {
  const [name, setName] = useState(localStorage.getItem('omi_callsign') || '');
  const [avatar, setAvatar] = useState(localStorage.getItem('omi_avatar') || '👨‍🚀');
  const [room, setRoom] = useState('');
  const [showLobby, setShowLobby] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.isSoundMuted());
  const connect = useGameStore(state => state.connect);

  const avatars = ['👨‍🚀', '🦸‍♂️', '🦹‍♂️', '🥷', '🕵️', '👩‍🚀', '👩‍🚒', '👮', '👽', '🤖', '👾', '🤡', '🦊', '🦁', '🦉', '🐲'];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) setRoom(roomParam);
  }, []);

  const handleStartWithBots = (bots: { name: string, difficulty: BotDifficulty, style: string }[]) => {
    if (name && room) {
        localStorage.setItem('omi_selected_bots', JSON.stringify(bots));
        localStorage.setItem('omi_callsign', name);
        localStorage.setItem('omi_avatar', avatar);
        connect(room, name, avatar, false);
    }
  };

  const handleJoin = (isSpectator: boolean = false) => {
    if (name && room) {
        localStorage.setItem('omi_callsign', name);
        localStorage.setItem('omi_avatar', avatar);
        connect(room, name, avatar, isSpectator);
    }
  };

  return (
    <div className="min-h-screen text-slate-200 flex flex-col items-center p-4 font-sans overflow-y-auto custom-scrollbar bg-[#050505]">
      <div className="max-w-md w-full my-auto space-y-8 bg-[#0c162e]/60 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl border-2 sm:border-4 border-blue-900/40 relative overflow-hidden shrink-0">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 blur-[100px] rounded-full" />

        <div className="text-center relative">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xl shadow-blue-900/40 mb-6 sm:mb-8 font-black text-4xl sm:text-5xl tracking-tighter transform -rotate-6 border-4 border-white/20">
            O
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-2 text-white uppercase italic drop-shadow-lg">OMI PRO</h1>
          <p className="text-blue-300/60 font-black text-[10px] sm:text-xs tracking-[0.3em] uppercase">Multiplayer Elite</p>
        </div>

        <div className="space-y-5 sm:space-y-6 pt-2 sm:pt-4 relative">
          <div className="flex justify-center mb-2 sm:mb-4">
              <button 
                onClick={() => setShowProfileEditor(true)}
                className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 border-4 border-blue-500/20 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center text-4xl sm:text-5xl hover:bg-white/10 transition-all active:scale-95 shadow-xl"
              >
                  {avatar}
              </button>
          </div>

          <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/50 ml-1 group-focus-within:text-blue-400 transition-colors">Tactical ID</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border-2 border-white/5 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-white/10 font-bold text-sm"
              placeholder="ENTER CALLSIGN"
            />
          </div>

          <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/50 ml-1 group-focus-within:text-blue-400 transition-colors">Combat Sector</label>
            <input
              type="text"
              required
              value={room}
              onChange={e => setRoom(e.target.value)}
              className="w-full bg-white/5 border-2 border-white/5 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-white/10 font-bold uppercase text-sm"
              placeholder="ROOM CODE"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 sm:pt-4">
            <button
              onClick={() => handleJoin(false)}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black py-4 sm:py-5 rounded-xl sm:rounded-[2rem] shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 group border-b-4 border-blue-800"
            >
              <span className="tracking-[0.2em] uppercase text-xs sm:text-sm italic">Multiplayer</span>
              <Users size={16} />
            </button>
            <button
              onClick={() => setShowLobby(true)}
              className="bg-white/5 hover:bg-white/10 text-white font-black py-4 sm:py-5 rounded-xl sm:rounded-[1.5rem] transition-all flex items-center justify-center gap-3 active:scale-95 border border-white/5 group"
            >
              <span className="tracking-[0.2em] uppercase text-xs sm:text-sm italic">Training</span>
              <Trophy size={16} className="group-hover:rotate-12 transition-transform text-blue-400" />
            </button>
          </div>

          <button
            onClick={() => handleJoin(true)}
            className="w-full bg-black/40 hover:bg-black/60 text-white/30 font-black py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] transition-all flex items-center justify-center gap-2 active:scale-95 border border-white/5"
          >
            <Eye size={14} />
            <span className="tracking-[0.2em] uppercase text-[9px] sm:text-[10px]">Spectate Mode</span>
          </button>
        </div>

        <div className="pt-8 border-t border-white/5 flex justify-center gap-6 relative">
            <div className="flex items-center gap-2 opacity-40">
                <Users size={14} className="text-blue-400" />
                <span className="text-[9px] font-black tracking-widest text-blue-300 uppercase">Pro Elite</span>
            </div>
            <div className="flex items-center gap-2 opacity-40">
                <Heart size={14} className="text-rose-500" />
                <span className="text-[9px] font-black tracking-widest text-blue-300 uppercase">Active</span>
            </div>
        </div>

        <div className="absolute top-6 right-6 flex gap-3">
            <button 
                onClick={() => {
                    const muted = soundManager.toggleBGMMute();
                    setIsMuted(muted);
                }}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all shadow-lg"
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button 
                onClick={() => setShowSettings(true)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all group shadow-lg"
            >
                <Settings2 size={20} className="group-hover:rotate-90 transition-transform" />
            </button>
        </div>
      </div>

      <AnimatePresence>
        {/* Profile Editor Overlay */}
        {showProfileEditor && (
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowProfileEditor(false)}
                    className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
                />
                <motion.div 
                    initial={{ scale: 0.9, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 50, opacity: 0 }}
                    className="relative w-full max-w-lg bg-[#0c162e] rounded-[3.5rem] border-4 border-white/5 p-10 shadow-2xl"
                >
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-8 text-center">Operative Profile</h2>
                    
                    <div className="space-y-8">
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-blue-300/40 uppercase tracking-[0.3em] px-2 italic">Callsign Redesignation</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold text-sm uppercase"
                                placeholder="ENTER NEW CALLSIGN"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-blue-300/40 uppercase tracking-[0.3em] px-2 italic">Select Identity</label>
                            <div className="grid grid-cols-4 gap-3 bg-white/5 p-4 rounded-[2rem]">
                                {avatars.map(a => (
                                    <button 
                                        key={a}
                                        onClick={() => setAvatar(a)}
                                        className={cn(
                                            "aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all border-2",
                                            avatar === a ? "bg-blue-500 border-blue-400 shadow-lg scale-110" : "bg-white/5 border-transparent hover:bg-white/10"
                                        )}
                                    >
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            localStorage.setItem('omi_avatar', avatar);
                            setShowProfileEditor(false);
                        }}
                        className="mt-10 w-full py-5 bg-cyan-500 hover:bg-cyan-400 text-white font-black rounded-3xl transition-all shadow-xl uppercase tracking-widest text-xs border-b-4 border-cyan-700"
                    >
                        Save Configuration
                    </button>
                </motion.div>
            </div>
        )}

        {/* Global Config Overlay */}
        {showSettings && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
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
                    exit={{ scale: 0.9, y: 50, opacity: 0 }}
                    className="relative w-full max-w-sm bg-[#0c162e] rounded-[3.5rem] border-4 border-blue-900/40 p-10 shadow-2xl"
                >
                     <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-8 text-center flex items-center justify-center gap-4">
                        <Settings2 className="w-6 h-6 text-blue-400" />
                        Global Config
                     </h3>

                     <div className="space-y-6">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-blue-300/40 uppercase tracking-[0.3em] px-2 italic">Sound Settings</label>
                                <button 
                                    onClick={() => {
                                        const muted = soundManager.toggleBGMMute();
                                        setIsMuted(muted);
                                    }}
                                    className="w-full flex items-center justify-between p-5 bg-white/5 border-2 border-white/5 rounded-[1.5rem] hover:bg-white/10 transition-all group"
                                >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                        isMuted ? "bg-rose-500/20 text-rose-500" : "bg-blue-500/20 text-blue-400"
                                    )}>
                                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                    </div>
                                    <span className="text-xs font-black text-white uppercase italic">{isMuted ? 'Muted' : 'Sound On'}</span>
                                </div>
                                <div className={cn(
                                    "w-10 h-6 rounded-full p-1 transition-all",
                                    isMuted ? "bg-slate-800" : "bg-blue-500"
                                )}>
                                    <div className={cn(
                                        "w-4 h-4 bg-white rounded-full transition-all transform",
                                        isMuted ? "translate-x-0" : "translate-x-4"
                                    )} />
                                </div>
                            </button>
                        </div>
                     </div>

                     <button 
                        onClick={() => setShowSettings(false)}
                        className="mt-10 w-full py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-[1.5rem] transition-all uppercase tracking-widest text-[10px] border border-white/10"
                     >
                        Confirm
                     </button>
                </motion.div>
            </div>
        )}

        {showLobby && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl overflow-y-auto pt-20 pb-10">
                <Lobby onBack={() => setShowLobby(false)} onPlay={handleStartWithBots} />
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
