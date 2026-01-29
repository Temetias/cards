import type { Card } from "./cards/index.ts";
import type { Identified, Named } from "./utils.ts";

type Deck = Identified &
  Named & {
    cards: Pick<Card, "id" | "definitionId">[];
  };

export type UserData = Identified &
  Named & {
    collection: Pick<Card, "id" | "definitionId">[];
    credits: number;
    decks: Deck[];
    activeDeck: Deck;
  };

export type User = UserData & {
  socket: WebSocket;
};
