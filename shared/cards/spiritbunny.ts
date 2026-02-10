import { type GameState } from "../game.ts";
import { type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const spiritbunny: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_spiritbunny"),
  name: "Spirit Bunny",
  description: [
    "On play: Increase the power of",
    "your rightmost creature by 1.",
  ],
  cost: 2,
  type: "CREATURE",
  power: 2,
  keywords: [],
  triggers: {},
  faction: FACTIONS.ASTRALS,
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "spiritbunny.onPlay");
    const otherCreatures = owner.field.filter(
      (creature) => creature.id !== self,
    );
    if (otherCreatures.length === 0) return [state, []];
    const target = otherCreatures[otherCreatures.length - 1];
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          field: owner.field.map((creature) => ({
            ...creature,
            power:
              creature.id === target.id ? creature.power + 1 : creature.power,
          })),
        },
      },
    };
    return [next, []];
  }),
};
