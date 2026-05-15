import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { GameState, PrivatePlayerState, Suit, Card, BotDifficulty } from './types.js';

interface GameStore {
  socket: Socket | null;
  game: GameState | null;
  me: PrivatePlayerState | null;
  error: string | null;
  isSpectator: boolean;
  isConnected: boolean;
  matchHistory: { date: string; score: [number, number]; winner: number }[];
  
  connect: (roomId: string, name: string, avatar?: string, isSpectator?: boolean) => void;
  sendMessage: (text: string) => void;
  ready: () => void;
  setTrump: (suit: Suit) => void;
  playCard: (cardId: string) => void;
  addBot: (difficulty?: BotDifficulty, style?: string) => void;
  fillBots: (difficulty?: BotDifficulty, style?: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  game: null,
  me: null,
  error: null,
  isSpectator: false,
  isConnected: false,
  matchHistory: JSON.parse(localStorage.getItem('omi_match_history') || '[]'),

  connect: (roomId, name, avatar, isSpectator = false) => {
    const socket = io();
    const storedPlayerId = localStorage.getItem(`omi_player_id_${roomId}`);
    
    socket.on("connect", () => {
      console.log("Connected to tactical server");
      set({ isConnected: true });
      const selectedBots = JSON.parse(localStorage.getItem('omi_selected_bots') || '[]');
      socket.emit('join_room', { roomId, name, avatar, playerId: storedPlayerId, isSpectator, selectedBots });
      localStorage.removeItem('omi_selected_bots');
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
        if (!lastGame || lastGame.date !== new Date().toLocaleString() || JSON.stringify(lastGame.score) !== JSON.stringify(game.scores)) {
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

  addBot: (difficulty, style) => {
    const { socket, game } = get();
    if (socket && game) {
      socket.emit('add_bot', { 
        roomId: game.roomId, 
        difficulty: difficulty || 'TACTICAL', 
        style: style || 'AGENT' 
      });
    }
  },

  fillBots: (difficulty, style) => {
    const { socket, game } = get();
    if (socket && game) {
      socket.emit('fill_bots', { 
        roomId: game.roomId, 
        difficulty: difficulty || 'TACTICAL', 
        style: style || 'AGENT' 
      });
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
