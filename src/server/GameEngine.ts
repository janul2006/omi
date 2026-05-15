import { Card, Suit, Rank } from '../types.js';
import _ from 'lodash';

const SUITS: Suit[] = ['CLUBS', 'DIAMONDS', 'HEARTS', 'SPADES'];
const RANKS: Rank[] = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const RANK_VALUE: Record<Rank, number> = {
  '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export class GameEngine {
  static createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ id: `${suit}-${rank}`, suit, rank });
      }
    }
    return _.shuffle(deck);
  }

  static getTrickWinner(trick: { playerId: string; card: Card }[], trumpSuit: Suit | null): number {
    if (trick.length === 0) return -1;
    const leadSuit = trick[0].card.suit;

    let winningIdx = 0;
    let bestCard = trick[0].card;

    for (let i = 1; i < trick.length; i++) {
        const currentCard = trick[i].card;
        const currentIsTrump = trumpSuit && currentCard.suit === trumpSuit;
        const bestIsTrump = trumpSuit && bestCard.suit === trumpSuit;

        if (currentIsTrump && !bestIsTrump) {
            winningIdx = i;
            bestCard = currentCard;
        } else if (currentIsTrump && bestIsTrump) {
            if (RANK_VALUE[currentCard.rank] > RANK_VALUE[bestCard.rank]) {
                winningIdx = i;
                bestCard = currentCard;
            }
        } else if (!currentIsTrump && !bestIsTrump) {
            if (currentCard.suit === leadSuit && RANK_VALUE[currentCard.rank] > RANK_VALUE[bestCard.rank]) {
                winningIdx = i;
                bestCard = currentCard;
            }
        }
    }
    return winningIdx;
  }

  static isMoveLegal(card: Card, hand: Card[], currentTrick: { playerId: string; card: Card }[]): boolean {
    if (currentTrick.length === 0) return true;
    const leadSuit = currentTrick[0].card.suit;
    const hasLeadSuit = hand.some(c => c.suit === leadSuit);

    if (hasLeadSuit) {
        return card.suit === leadSuit;
    }
    return true;
  }
}
