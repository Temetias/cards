import { type GameState } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const shieldsmith: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_shieldsmith"),
  cost: 3,
  name: "Shieldsmith",
  description: [
    "Give #blocker to your",
    "leftmost and rightmost",
    "creatures.",
  ],
  type: "CREATURE",
  power: 2,
  onResourcePlay: null,
  keywords: [],
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "shieldsmith.onPlay");

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          field: owner.field.map((creature, index, array) => {
            if (index === 0 || index === array.length - 1) {
              return {
                ...creature,
                keywords: [...creature.keywords, "#blocker"],
              };
            }
            return creature;
          }),
        },
      },
    };
    return [next, []];
  }),
  triggers: {},
  faction: FACTIONS.NEUTRAL,
};
