import { GAME_TRIGGER, GameState, TriggerParams } from "../match.ts";

export type Keyword = "revived";

export type GameCard = Card & {
  id: string;
};

export type Card = {
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
