import { GAME_TRIGGER, GameState, TriggerParams } from "../match.ts";

type CardBase = {
  name: string;
  description?: string;
  playEffect?: (
    state: GameState,
    player: "player1" | "player2",
    origin: GameCard["id"],
    rng: () => number,
    target?: GameCard["id"]
  ) => { state: GameState; triggers: TriggerParams[] };
  triggers?: Partial<
    Record<
      (typeof GAME_TRIGGER)[keyof typeof GAME_TRIGGER],
      (
        state: GameState,
        player: "player1" | "player2",
        rng: () => number,
        origin: GameCard["id"],
        self: GameCard["id"]
      ) => { state: GameState; triggers: TriggerParams[] }
    >
  >;
  cost: number;
  power: number;
  keywords?: Keyword[];
};

export type Keyword = "revived" | "cowardly" | "brave";

export type CreatureCard = CardBase & {
  type: "creature";
};

export type CreatureGameCard = CreatureCard & {
  id: string;
};

export type SpellCard = Omit<CardBase, "power" | "triggers"> & {
  type: "spell";
  playEffect: CardBase["playEffect"];
};

export type SpellGameCard = SpellCard & {
  id: string;
};

export type GameCard = CreatureGameCard | SpellGameCard;

// Auracard could be a spell with triggers...

export type Card = CreatureCard | SpellCard;

export function isCreatureCard(card: Card): card is CreatureCard;
export function isCreatureCard(card: GameCard): card is CreatureGameCard {
  return card.type === "creature";
}

export function isSpellCard(card: Card): card is SpellCard;
export function isSpellCard(card: GameCard): card is SpellGameCard {
  return card.type === "spell";
}
