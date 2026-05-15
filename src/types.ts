export type Suit = 'CLUBS' | 'DIAMONDS' | 'HEARTS' | 'SPADES';
export type Rank = '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type Phase = 'LOBBY' | 'TRUMP_CALLING' | 'PLAYING' | 'FINISHED';

export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  handSize: number;
  team: 0 | 1;
  pos: number; // 0, 1, 2, 3 (clockwise)
  isConnected: boolean;
  isBot?: boolean;
  botDifficulty?: BotDifficulty;
  botStyle?: string;
}

export interface GameState {
  roomId: string;
  phase: Phase;
  players: Player[];
  spectators: Player[];
  dealerIdx: number;
  trumpCallerIdx: number;
  trumpSuit: Suit | null;
  currentTurnIdx: number;
  currentTrick: { playerId: string; card: Card }[];
  tricksWon: [number, number]; // [Team 0, Team 1]
  scores: [number, number]; // [Team 0, Team 1]
  winnerTeam: number | null;
  lastTrick: { playerId: string; card: Card }[] | null;
  history: string[]; // For game logs
  chat: ChatMessage[];
  lastTrickResult: {
    winnerName: string;
    winningCard: Card;
  } | null;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export type BotDifficulty = 'EASY' | 'TACTICAL' | 'ELITE';

// Client-only view of the player (authenticated)
export interface PrivatePlayerState extends Player {
  hand: Card[];
}
