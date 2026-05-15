import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { GameState, PrivatePlayerState, Suit } from './types.js';

interface GameStore {
  socket: Socket | null;
  game: GameState | null;
  me: PrivatePlayerState | null;
  error: string | null;
  isSpectator: boolean;
  isConnected: boolean;
  matchHistory: { date: string; score: [number, number]; winner: number }[];
  
  connect: (roomId: string, name: string, isSpectator?: boolean) => void;
  sendMessage: (text: string) => void;
  ready: () => void;
  setTrump: (suit: Suit) => void;
  playCard: (cardId: string) => void;
  addBot: () => void;
  fillBots: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  game: null,
  me: null,
  error: null,
  isSpectator: false,
  isConnected: false,
  matchHistory: JSON.parse(localStorage.getItem('omi_match_history') || '[]'),

  connect: (roomId, name, isSpectator = false) => {
    const socket = io();
    const storedPlayerId = localStorage.getItem(`omi_player_id_${roomId}`);
    
    socket.on("connect", () => {
      console.log("Connected to tactical server");
      set({ isConnected: true });
      socket.emit('join_room', { roomId, name, playerId: storedPlayerId, isSpectator });
    });

    socket.on("disconnect", () => {
        set({ isConnected: false });
    });

    socket.on("connect_error", (err) => {
      console.error("Connection failed! Vercel likely blocked the WebSocket:", err);
    });

    socket.on('joined', ({ playerId }) => {
      if (!isSpectator) {
        localStorage.setItem(`omi_player_id_${roomId}`, playerId);
      }
    });

    socket.on('room_state', ({ game, me }: { game: GameState, me: PrivatePlayerState }) => {
      set({ game, me, error: null, isSpectator });

      // Save match result if finished
      if (game.phase === 'FINISHED' && game.winnerTeam !== null) {
        const history = get().matchHistory;
        const lastGame = history[0];
        // Prevent duplicate saves for same game
        if (!lastGame || lastGame.date !== new Date().toDateString() || JSON.stringify(lastGame.score) !== JSON.stringify(game.scores)) {
            const newHistory = [{
                date: new Date().toLocaleString(),
                score: game.scores,
                winner: game.winnerTeam
            }, ...history].slice(0, 50);
            set({ matchHistory: newHistory });
            localStorage.setItem('omi_match_history', JSON.stringify(newHistory));
        }
      }
    });

    socket.on('error_message', (msg) => {
      set({ error: msg });
    });

    set({ socket });
  },

  sendMessage: (text) => {
    const { socket, game, me } = get();
    if (socket && game && me) {
      socket.emit('send_message', { roomId: game.roomId, playerId: me.id, text });
    }
  },

  ready: () => {
    const { socket, game, me } = get();
    if (socket && game && me) {
      socket.emit('ready', { roomId: game.roomId, playerId: me.id });
    }
  },

  addBot: () => {
    const { socket, game } = get();
    if (socket && game) {
      const difficulty = localStorage.getItem('omi_bot_difficulty') || 'TACTICAL';
      const style = localStorage.getItem('omi_bot_style') || 'AGENT';
      socket.emit('add_bot', { roomId: game.roomId, difficulty, style });
    }
  },

  fillBots: () => {
    const { socket, game } = get();
    if (socket && game) {
      const difficulty = localStorage.getItem('omi_bot_difficulty') || 'TACTICAL';
      const style = localStorage.getItem('omi_bot_style') || 'AGENT';
      socket.emit('fill_bots', { roomId: game.roomId, difficulty, style });
    }
  },

  setTrump: (suit) => {
    const { socket, game, me } = get();
    if (socket && game && me) {
      socket.emit('set_trump', { roomId: game.roomId, playerId: me.id, suit });
    }
  },

  playCard: (cardId) => {
    const { socket, game, me } = get();
    if (socket && game && me) {
      socket.emit('play_card', { roomId: game.roomId, playerId: me.id, cardId });
    }
  },
}));
