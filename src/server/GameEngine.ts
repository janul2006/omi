import { Card, Suit, Rank } from '../types.js';
import _ from 'lodash';

const SUITS: Suit[] = ['CLUBS', 'DIAMONDS', 'HEARTS', 'SPADES'];
const RANKS: Rank[] = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUE: Record<Rank, number> = {
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

  static getBotPlay(hand: Card[], currentTrick: { playerId: string; card: Card }[], trumpSuit: Suit | null, playerPos: number, players: Player[]): Card {
    const legalCards = hand.filter(card => this.isMoveLegal(card, hand, currentTrick));
    
    // 1. If leading the trick
    if (currentTrick.length === 0) {
        // Play strongest card of a suit we have Most of
        const suitCounts = _.countBy(hand, 'suit');
        const bestSuit = _.maxBy(Object.keys(suitCounts), s => suitCounts[s as Suit]);
        return _.maxBy(hand.filter(c => c.suit === bestSuit), c => RANK_VALUE[c.rank]) || legalCards[0];
    }

    // 2. Identify the lead suit and current best card in trick
    const leadSuit = currentTrick[0].card.suit;
    const currentWinnerIdx = this.getTrickWinner(currentTrick, trumpSuit);
    const winningPlay = currentTrick[currentWinnerIdx];
    const winningPlayer = players.find(p => p.id === winningPlay.playerId);
    
    // Check if my team is currently winning
    const myTeam = players[playerPos].team;
    const isPartnerWinning = winningPlayer?.team === myTeam;

    // 3. If partner is winning, play lowest possible legal card to save ammo
    if (isPartnerWinning) {
        return _.minBy(legalCards, c => RANK_VALUE[c.rank]) || legalCards[0];
    }

    // 4. Partner is NOT winning. Try to win the trick.
    const winnableByLead = legalCards.filter(c => 
        c.suit === leadSuit && 
        (winningPlay.card.suit !== trumpSuit || c.suit === trumpSuit) &&
        RANK_VALUE[c.rank] > (winningPlay.card.suit === c.suit ? RANK_VALUE[winningPlay.card.rank] : 0)
    );

    if (winnableByLead.length > 0) {
        // Win with the lowest card that can win
        return _.minBy(winnableByLead, c => RANK_VALUE[c.rank])!;
    }

    // 5. Can't win by following suit. Try to Trump it if lead suit is not trump
    if (trumpSuit && leadSuit !== trumpSuit) {
        const trumps = legalCards.filter(c => c.suit === trumpSuit);
        if (trumps.length > 0) {
            const currentBestWasTrump = winningPlay.card.suit === trumpSuit;
            if (!currentBestWasTrump) {
                return _.minBy(trumps, c => RANK_VALUE[c.rank])!;
            } else {
                const betterTrumps = trumps.filter(c => RANK_VALUE[c.rank] > RANK_VALUE[winningPlay.card.rank]);
                if (betterTrumps.length > 0) {
                    return _.minBy(betterTrumps, c => RANK_VALUE[c.rank])!;
                }
            }
        }
    }

    // 6. Can't win at all. Throw away the lowest card.
    return _.minBy(legalCards, c => RANK_VALUE[c.rank]) || legalCards[0];
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
