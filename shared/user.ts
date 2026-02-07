import type { Card } from "./cards/index.ts";
import { GAME_RULE } from "./constants.ts";
import type { Identified, Named } from "./utils.ts";

export type Deck = Identified &
  Named & {
    cards: Pick<Card, "id" | "definitionId">[];
  };

export function validateDeck(deck: Deck): boolean {
  // Deck size
  if (deck.cards.length !== GAME_RULE.DECK_SIZE) return false;
  // Max copies of a card
  const definitionIdCounts: Record<string, number> = {};
  for (const card of deck.cards) {
    definitionIdCounts[card.definitionId] =
      (definitionIdCounts[card.definitionId] || 0) + 1;
    if (definitionIdCounts[card.definitionId] > GAME_RULE.DECK_MAX_COPIES) {
      return false;
    }
  }
  return true;
}

export type UserData = Identified &
  Named & {
    collection: Pick<Card, "id" | "definitionId">[];
    credits: number;
    decks: Deck[];
    activeDeckId: Deck["id"];
  };

export type User = UserData & {
  socket: WebSocket;
};
