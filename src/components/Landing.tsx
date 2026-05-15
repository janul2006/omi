import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store.js';
import { Trophy, Users, Play, Heart, Eye } from 'lucide-react';

export const Landing: React.FC = () => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const connect = useGameStore(state => state.connect);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) setRoom(roomParam);
  }, []);

  const handleJoin = (isSpectator: boolean = false) => {
    if (name && room) {
      connect(room, name, isSpectator);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full space-y-8 bg-[#121214] p-10 rounded-[2.5rem] shadow-2xl border border-slate-800/50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 mb-8 font-black text-3xl tracking-tighter transform -rotate-6">
            O
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-br from-slate-100 via-slate-400 to-slate-800 uppercase italic">OMI PRO</h1>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase opacity-60">Multiplayer Elite Edition</p>
        </div>

        <div className="space-y-6 pt-4">
          <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-1 group-focus-within:text-emerald-500 transition-colors">Tactical ID</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#0A0A0B] border-2 border-slate-800/50 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-emerald-600 focus:ring-8 focus:ring-emerald-600/5 transition-all placeholder:text-slate-700 font-bold"
              placeholder="ENTER CALLSIGN"
            />
          </div>

          <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-1 group-focus-within:text-emerald-500 transition-colors">Combat Sector</label>
            <input
              type="text"
              required
              value={room}
              onChange={e => setRoom(e.target.value)}
              className="w-full bg-[#0A0A0B] border-2 border-slate-800/50 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-emerald-600 focus:ring-8 focus:ring-emerald-600/5 transition-all placeholder:text-slate-700 font-bold uppercase"
              placeholder="ROOM CODE"
            />
          </div>

          <div className="grid grid-cols-5 gap-3 pt-4">
            <button
              onClick={() => handleJoin(false)}
              className="col-span-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-2xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 group"
            >
              <span className="tracking-[0.2em] uppercase text-xs">Join Table</span>
              <Play size={16} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => handleJoin(true)}
              className="col-span-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Eye size={16} />
              <span className="tracking-[0.2em] uppercase text-[10px]">Spectate</span>
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/50 flex justify-between items-center px-2">
            <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                <Users size={14} className="text-slate-500" />
                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Pro Matchmaking</span>
            </div>
            <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                <Heart size={14} className="text-slate-500" />
                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Hifi Sync</span>
            </div>
        </div>
      </div>
    </div>
  );
};
