import { type GameState } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const caverat: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_caverat"),
  cost: 1,
  name: "Cave rat",
  description: ["On play: You're allowed", "to play resource again."],
  type: "CREATURE",
  faction: FACTIONS.THORNBOUND,
  power: 1,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "caverat.onPlay");
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          hasPlayedResource: false,
        },
      },
    };
    return [next, []];
  }),
  triggers: {},
};
