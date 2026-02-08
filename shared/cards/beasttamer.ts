import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import type { GameState } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const beasttamer: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_beasttamer"),
  cost: 4,
  name: "Beast Tamer",
  description: [
    "On play: Set the power of",
    "enemy creatures equal to their",
    "lowest power creature.",
  ],
  type: "CREATURE",
  power: 3,
  keywords: [],
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "beasttamer.onPlay");
    const opponent = getOpponent(state, owner.id);
    if (opponent.field.length === 0) return [state, []];
    const lowestPower = Math.min(...opponent.field.map((c) => c.power));
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [opponent.id]: {
          ...opponent,
          field: opponent.field.map((creature) => ({
            ...creature,
            power: lowestPower,
          })),
        },
      },
    };
    return [next, []];
  }),
  triggers: {},
  faction: FACTIONS.ASTRALS,
};
