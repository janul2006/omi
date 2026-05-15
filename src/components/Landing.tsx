import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store.js';
import { Trophy, Users, Play, Heart, Eye, Settings2 } from 'lucide-react';
import { BotDifficulty } from '../types.js';
import { cn } from '../lib/utils.js';
import { Lobby } from './Lobby.js';
import { motion, AnimatePresence } from 'motion/react';

export const Landing: React.FC = () => {
  const [name, setName] = useState(localStorage.getItem('omi_callsign') || '');
  const [avatar, setAvatar] = useState(localStorage.getItem('omi_avatar') || '👨‍🚀');
  const [room, setRoom] = useState('');
  const [showLobby, setShowLobby] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const connect = useGameStore(state => state.connect);

  const avatars = ['👨‍🚀', '🦸‍♂️', '🦹‍♂️', '🥷', '🕵️', '👩‍🚀', '👩‍🚒', '👮', '👽', '🤖', '👾', '🤡'];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) setRoom(roomParam);
  }, []);

  const handleStartWithBots = (bots: { name: string, difficulty: BotDifficulty, style: string }[]) => {
    if (name && room) {
        // Save preferences
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
      <div className="max-w-md w-full py-12 space-y-8 bg-[#0c162e]/60 backdrop-blur-3xl p-10 rounded-[3rem] shadow-2xl border-4 border-blue-900/40 relative overflow-hidden shrink-0">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 blur-[100px] rounded-full" />

        <div className="text-center relative">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xl shadow-blue-900/40 mb-8 font-black text-5xl tracking-tighter transform -rotate-6 border-4 border-white/20">
            O
          </div>
          <h1 className="text-6xl font-black tracking-tighter mb-2 text-white uppercase italic drop-shadow-lg">OMI PRO</h1>
          <p className="text-blue-300/60 font-black text-xs tracking-[0.3em] uppercase">Multiplayer Elite</p>
        </div>

        <div className="space-y-6 pt-4 relative">
          <div className="flex justify-center mb-4">
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className="w-24 h-24 bg-white/5 border-4 border-blue-500/20 rounded-[2.5rem] flex items-center justify-center text-5xl hover:bg-white/10 transition-all active:scale-95 shadow-xl"
              >
                  {avatar}
              </button>
          </div>

          {showProfile && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-4 gap-2 p-4 bg-black/40 rounded-[2rem] border border-white/5"
              >
                  {avatars.map(a => (
                      <button
                        key={a}
                        onClick={() => {
                            setAvatar(a);
                            setShowProfile(false);
                        }}
                        className={cn(
                            "w-12 h-12 flex items-center justify-center text-2xl rounded-xl transition-all hover:bg-white/10",
                            avatar === a && "bg-blue-500/20 scale-110 border border-blue-500/40"
                        )}
                      >
                          {a}
                      </button>
                  ))}
              </motion.div>
          )}

          <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/50 ml-1 group-focus-within:text-blue-400 transition-colors">Tactical ID</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-white/10 font-bold"
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
              className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-white/10 font-bold uppercase"
              placeholder="ROOM CODE"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              onClick={() => handleJoin(false)}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 group border-b-4 border-blue-800"
            >
              <span className="tracking-[0.2em] uppercase text-sm italic">Multiplayer</span>
              <Users size={18} />
            </button>
            <button
              onClick={() => setShowLobby(true)}
              className="bg-white/5 hover:bg-white/10 text-white font-black py-5 rounded-[1.5rem] transition-all flex items-center justify-center gap-3 active:scale-95 border border-white/5 group"
            >
              <span className="tracking-[0.2em] uppercase text-sm italic">Training</span>
              <Trophy size={18} className="group-hover:rotate-12 transition-transform text-blue-400" />
            </button>
          </div>

          <button
            onClick={() => handleJoin(true)}
            className="w-full bg-black/40 hover:bg-black/60 text-white/30 font-black py-4 rounded-[1.5rem] transition-all flex items-center justify-center gap-2 active:scale-95 border border-white/5"
          >
            <Eye size={16} />
            <span className="tracking-[0.2em] uppercase text-[10px]">Spectate Mode</span>
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
      </div>

      <AnimatePresence>
        {showLobby && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl overflow-y-auto pt-20 pb-10">
                <Lobby onBack={() => setShowLobby(false)} onPlay={handleStartWithBots} />
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
