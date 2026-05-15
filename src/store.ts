import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { GameState, PrivatePlayerState, Suit } from './types.js';

interface GameStore {
  socket: Socket | null;
  game: GameState | null;
  me: PrivatePlayerState | null;
  error: string | null;
  isSpectator: boolean;
  
  connect: (roomId: string, name: string, isSpectator?: boolean) => void;
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

  connect: (roomId, name, isSpectator = false) => {
    const socket = io();
    const storedPlayerId = localStorage.getItem(`omi_player_id_${roomId}`);
    
    socket.on("connect", () => {
      console.log("Connected to tactical server");
      socket.emit('join_room', { roomId, name, playerId: storedPlayerId, isSpectator });
    });

    socket.on("connect_error", (err) => {
      console.error("Connection failed! Vercel likely blocked the WebSocket:", err);
    });

    socket.on('joined', ({ playerId }) => {
      if (!isSpectator) {
        localStorage.setItem(`omi_player_id_${roomId}`, playerId);
      }
    });

    socket.on('room_state', ({ game, me }) => {
      set({ game, me, error: null, isSpectator });
    });

    socket.on('error_message', (msg) => {
      set({ error: msg });
    });

    set({ socket });
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
      socket.emit('add_bot', { roomId: game.roomId });
    }
  },

  fillBots: () => {
    const { socket, game } = get();
    if (socket && game) {
      socket.emit('fill_bots', { roomId: game.roomId });
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
