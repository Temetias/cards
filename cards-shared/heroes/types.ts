import { GameCard } from "../cards/types.ts";
import { GameState, TriggerParams } from "../match.ts";

export type Hero = {
  name: string;
  desciption?: string;
  requiredCharges: number;
  chargeEffect: (
    state: GameState,
    player: "player1" | "player2",
    rng: () => number,
    target?: GameCard["id"]
  ) => { state: GameState; triggers: TriggerParams[] };
};
