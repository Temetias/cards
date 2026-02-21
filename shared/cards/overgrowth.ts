import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { type GameState } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import {
  buildCardOnPlayNonTargeted,
  drawWithEffects,
  getOwner,
} from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const overgrowth: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_overgrowth"),
  name: "Overgrowth",
  description: [
    "Draw cards equal to your",
    "resource advantage over",
    "your opponent.",
  ],
  cost: 2,
  type: "SPELL",
  faction: FACTIONS.THORNBOUND,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self, initiator }) => {
    const owner = getOwner(state, self as UUID, "overgrowth.onPlay");
    const opponent = getOpponent(state, owner.id);
    const resourceAdvantage = Math.max(
      owner.resource.length - opponent.resource.length,
      0,
    );
    const { deck, hand, discard, triggeredEffects } = drawWithEffects(
      owner.id,
      resourceAdvantage,
      state,
      initiator,
    );
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          deck,
          hand,
          discard,
        },
      },
    };
    return [next, triggeredEffects];
  }),
};
