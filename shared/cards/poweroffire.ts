import { type GameState } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import {
  buildCardOnPlayNonTargeted,
  drawWithEffects,
  getOwner,
} from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const poweroffire: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_poweroffire"),
  name: "Power of Fire",
  description: [
    "Draw two cards. If your",
    "hand is empty draw",
    "three cards instead.",
  ],
  cost: 3,
  type: "SPELL",
  faction: FACTIONS.WORLDFORGED,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self, initiator }) => {
    const owner = getOwner(state, self as UUID, "poweroffire.onPlay");
    const { deck, hand, discard, triggeredEffects } = drawWithEffects(
      owner.id,
      owner.hand.length === 0 ? 3 : 2,
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
