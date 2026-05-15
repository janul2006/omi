import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { Card, ChatMessage, GameState, Phase, Player, PrivatePlayerState, Suit } from '../types.js';
import { GameEngine } from './GameEngine.js';

export class Room {
  id: string;
  state: GameState;
  playerHands: Map<string, Card[]> = new Map();
  playerSockets: Map<string, string> = new Map(); // playerId -> socketId
  spectatorSockets: Map<string, string> = new Map(); // spectatorId -> socketId
  socketSubscribers: Map<string, string> = new Map(); // socketId -> playerId

  constructor(id: string) {
    this.id = id;
    this.state = {
      roomId: id,
      phase: 'LOBBY',
      players: [],
      spectators: [],
      dealerIdx: 0,
      trumpCallerIdx: 1,
      trumpSuit: null,
      currentTurnIdx: 0,
      currentTrick: [],
      tricksWon: [0, 0],
      scores: [0, 0],
      winnerTeam: null,
      lastTrick: null,
      lastTrickResult: null,
      history: [],
      chat: []
    };
  }

  addPlayer(socket: Socket, name: string, existingPlayerId?: string, isSpectator?: boolean): string {
    if (isSpectator) {
      const spectatorId = uuidv4();
      const spectator: Player = {
        id: spectatorId,
        name: `${name} (Eye)`,
        isReady: true,
        handSize: 0,
        team: 0,
        pos: -1,
        isConnected: true
      };
      this.state.spectators.push(spectator);
      this.spectatorSockets.set(spectatorId, socket.id);
      this.socketSubscribers.set(socket.id, spectatorId);
      this.addLog(`${name} joined as spectator.`);
      return spectatorId;
    }

    const existingPlayer = existingPlayerId ? this.state.players.find(p => p.id === existingPlayerId) : null;
    
    if (existingPlayer) {
      existingPlayer.isConnected = true;
      this.playerSockets.set(existingPlayer.id, socket.id);
      this.socketSubscribers.set(socket.id, existingPlayer.id);
      this.addLog(`${existingPlayer.name} reconnected.`);
      return existingPlayer.id;
    }

    if (this.state.players.length >= 4) {
      throw new Error('Room full');
    }

    const playerId = uuidv4();
    const pos = this.state.players.length;
    const player: Player = {
      id: playerId,
      name,
      isReady: false,
      handSize: 0,
      team: (pos % 2 === 0 ? 0 : 1) as 0 | 1,
      pos,
      isConnected: true
    };

    this.state.players.push(player);
    this.playerSockets.set(playerId, socket.id);
    this.socketSubscribers.set(socket.id, playerId);
    this.addLog(`${name} joined.`);
    return playerId;
  }

  handleDisconnect(socketId: string) {
    const playerId = this.socketSubscribers.get(socketId);
    if (playerId) {
      const player = this.state.players.find(p => p.id === playerId);
      if (player) {
        player.isConnected = false;
        this.addLog(`${player.name} disconnected.`);
      } else {
        // Specator disconnect
        this.state.spectators = this.state.spectators.filter(s => s.id !== playerId);
        this.spectatorSockets.delete(playerId);
      }
      this.socketSubscribers.delete(socketId);
    }
  }

  handleReady(playerId: string, io: Server) {
    const player = this.state.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = true;
      if (this.state.players.length === 4 && this.state.players.every(p => p.isReady)) {
        this.startGame(io);
      }
    }
  }

  startGame(io: Server) {
    this.state.phase = 'TRUMP_CALLING';
    const deck = GameEngine.createDeck();
    
    // Deal 4 cards each initially
    this.state.players.forEach((p, idx) => {
        const hand = deck.splice(0, 4);
        this.playerHands.set(p.id, hand);
        p.handSize = 4;
    });

    // Remainder of the deck is handled after trump is called
    this.remainingDeck = deck;

    this.state.trumpCallerIdx = (this.state.dealerIdx + 1) % 4;
    this.state.currentTurnIdx = this.state.trumpCallerIdx;
    this.addLog('Game started! Waiting for trump call...');

    this.broadcastState(io);
    this.checkBotTurn(io);
  }

  private remainingDeck: Card[] = [];

  setTrump(playerId: string, suit: Suit) {
    if (this.state.phase !== 'TRUMP_CALLING') return;
    if (this.state.players[this.state.trumpCallerIdx].id !== playerId) return;

    this.state.trumpSuit = suit;
    
    // Deal remaining 4 cards
    this.state.players.forEach((p) => {
        const hand = this.playerHands.get(p.id)!;
        const extra = this.remainingDeck.splice(0, 4);
        this.playerHands.set(p.id, [...hand, ...extra]);
        p.handSize = 8;
    });

    this.state.phase = 'PLAYING';
    this.state.currentTurnIdx = this.state.trumpCallerIdx; // In Omi, caller plays first
    this.addLog(`Trump set to ${suit}. First turn: ${this.state.players[this.state.currentTurnIdx].name}`);
  }

  async playCard(playerId: string, cardId: string, io: Server) {
    if (this.state.phase !== 'PLAYING') return;
    if (this.state.players[this.state.currentTurnIdx].id !== playerId) return;

    const playerHand = this.playerHands.get(playerId)!;
    const card = playerHand.find(c => c.id === cardId);
    
    if (!card) return;
    if (!GameEngine.isMoveLegal(card, playerHand, this.state.currentTrick)) return;

    // Execute move
    this.playerHands.set(playerId, playerHand.filter(c => c.id !== cardId));
    this.state.players[this.state.currentTurnIdx].handSize--;
    this.state.currentTrick.push({ playerId, card });

    if (this.state.currentTrick.length === 4) {
      await this.resolveTrick(io);
    } else {
      this.state.currentTurnIdx = (this.state.currentTurnIdx + 1) % 4;
      this.broadcastState(io);
      this.checkBotTurn(io);
    }
  }

  private async resolveTrick(io: Server) {
    const winnerIdxInTrick = GameEngine.getTrickWinner(this.state.currentTrick, this.state.trumpSuit);
    const winnerId = this.state.currentTrick[winnerIdxInTrick].playerId;
    const winnerPlayer = this.state.players.find(p => p.id === winnerId)!;
    
    this.state.tricksWon[winnerPlayer.team]++;
    this.state.lastTrick = [...this.state.currentTrick];
    this.state.lastTrickResult = {
      winnerName: winnerPlayer.name,
      winningCard: this.state.currentTrick[winnerIdxInTrick].card
    };
    
    // Broadcast state so cards stay on table for a bit
    this.broadcastState(io);

    // Pause for 1.8 seconds to see result
    await new Promise(resolve => setTimeout(resolve, 1800));

    this.state.currentTrick = [];
    this.state.lastTrickResult = null;
    this.state.currentTurnIdx = winnerPlayer.pos;

    this.broadcastState(io);
    this.checkBotTurn(io);

    if (this.state.players[0].handSize === 0) {
      this.resolveRound(io);
    } else {
        this.broadcastState(io);
        this.checkBotTurn(io);
    }
  }

  private resolveRound(io: Server) {
    const [t0, t1] = this.state.tricksWon;
    let roundWinner = -1;
    let pts = 0;

    if (t0 > t1) {
      roundWinner = 0;
      pts = t0 === 8 ? 2 : 1;
    } else if (t1 > t0) {
      roundWinner = 1;
      pts = t1 === 8 ? 2 : 1;
    }

    if (roundWinner !== -1) {
      this.state.scores[roundWinner] += pts;
      this.addLog(`Team ${roundWinner} wins round with ${this.state.tricksWon[roundWinner]} tricks (${pts} pts)`);
    } else {
      this.addLog('Round draw (4-4)');
    }

    // Check game finish
    if (this.state.scores[0] >= 10 || this.state.scores[1] >= 10) {
        this.state.phase = 'FINISHED';
        this.state.winnerTeam = this.state.scores[0] >= 10 ? 0 : 1;
    } else {
        // Prepare next round
        this.state.phase = 'LOBBY';
        this.state.players.forEach(p => {
          p.isReady = p.isBot ? true : false;
        });
        this.state.dealerIdx = (this.state.dealerIdx + 1) % 4;
        this.state.tricksWon = [0, 0];
        this.state.trumpSuit = null;

        if (this.state.players.every(p => p.isReady)) {
          this.startGame(io);
        }
    }
  }

  private addLog(msg: string) {
    this.state.history.push(msg);
    if (this.state.history.length > 50) this.state.history.shift();
  }

  addChatMessage(senderId: string, text: string) {
    const player = this.state.players.find(p => p.id === senderId) || this.state.spectators.find(s => s.id === senderId);
    if (!player) return;

    const message: ChatMessage = {
        id: uuidv4(),
        senderId,
        senderName: player.name,
        text: text.slice(0, 140), // Character limit
        timestamp: Date.now()
    };

    this.state.chat.push(message);
    if (this.state.chat.length > 50) this.state.chat.shift();
  }

  fillWithBots(io: Server, difficulty?: BotDifficulty, style?: string) {
    while (this.state.players.length < 4) {
        this.addBot(io, difficulty, style);
    }
    this.broadcastState(io);
  }

  addBot(io: Server, difficulty: BotDifficulty = 'TACTICAL', style: string = 'AGENT') {
    if (this.state.players.length >= 4) return;
    const botId = `bot-${uuidv4()}`;
    const pos = this.state.players.length;
    const bot: Player = {
      id: botId,
      name: `${style} ${pos + 1}`,
      isReady: true,
      handSize: 0,
      team: (pos % 2 === 0 ? 0 : 1) as 0 | 1,
      pos,
      isConnected: true,
      isBot: true,
      botDifficulty: difficulty,
      botStyle: style
    };
    this.state.players.push(bot);
    this.addLog(`${bot.name} (Bot, ${difficulty}) joined.`);
    
    // Auto-start if 4 players and all ready
    if (this.state.players.length === 4 && this.state.players.every(p => p.isReady)) {
        this.startGame(io);
    }
  }

  async checkBotTurn(io: Server) {
    const currentPlayer = this.state.players[this.state.currentTurnIdx];
    if (!currentPlayer || !currentPlayer.isBot) return;

    // Simulate thinking time
    const delay = this.state.phase === 'TRUMP_CALLING' ? 2000 : (1000 + Math.random() * 1000);
    await new Promise(resolve => setTimeout(resolve, delay));

    if (this.state.phase === 'TRUMP_CALLING') {
      const hand = this.playerHands.get(currentPlayer.id)!;
      const suitCounts = hand.reduce((acc, card) => {
        acc[card.suit] = (acc[card.suit] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const bestSuit = Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0][0] as Suit;
      this.setTrump(currentPlayer.id, bestSuit);
      this.broadcastState(io);
      this.checkBotTurn(io);
    } else if (this.state.phase === 'PLAYING') {
      const hand = this.playerHands.get(currentPlayer.id)!;
      const cardToPlay = GameEngine.getBotPlay(hand, this.state.currentTrick, this.state.trumpSuit, this.state.currentTurnIdx, this.state.players);
      
      if (cardToPlay) {
        await this.playCard(currentPlayer.id, cardToPlay.id, io);
      }
    }
  }

  broadcastState(io: Server) {
    this.state.players.forEach(p => {
        const sid = this.playerSockets.get(p.id);
        if (sid) {
            const privateState: PrivatePlayerState = {
                ...p,
                hand: this.playerHands.get(p.id) || []
            };
            io.to(sid).emit('room_state', {
                game: this.state,
                me: privateState
            });
        }
    });

    this.state.spectators.forEach(s => {
        const sid = this.spectatorSockets.get(s.id);
        if (sid) {
            io.to(sid).emit('room_state', {
                game: this.state,
                me: { ...s, hand: [] }
            });
        }
    });
  }
}
