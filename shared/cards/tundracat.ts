import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { type GameState } from "../game.ts";
import { type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const tundracat: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_tundracat"),
  name: "Tundra Cat",
  description: ["On play: Reduce the power of", "enemy creatures by 1."],
  cost: 1,
  type: "CREATURE",
  power: 1,
  keywords: [],
  triggers: {},
  faction: FACTIONS.ASTRALS,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "tundracat.onPlay");
    const opponent = getOpponent(state, owner.id);
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [opponent.id]: {
          ...opponent,
          field: opponent.field.map((creature) => ({
            ...creature,
            power: Math.max(creature.power - 1, 0),
          })),
        },
      },
    };
    return [next, []];
  }),
};
