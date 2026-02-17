import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";
import { type GameState } from "../game.ts";
import { buildCardTrigger, getOwner } from "./helpers.ts";
import { type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";

export const chort: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_chort"),
  cost: 6,
  name: "Chort",
  description: [
    "Can only attack after another",
    "creature died. Not limited",
    "to once per turn.",
  ],
  type: "CREATURE",
  power: 4,
  keywords: [],
  onPlay: null,
  onResourcePlay: null,
  faction: FACTIONS.DOMINION,
  triggers: {
    CREATURE_DIED: buildCardTrigger((state, { initiator, self }) => {
      // Don't care if self died
      if (initiator === self) return null;
      const owner = getOwner(state, self as UUID, "chort.CREATURE_DIED");
      const next: GameState = {
        ...state,
        players: {
          ...state.players,
          [owner.id]: {
            ...owner,
            field: owner.field.map((creature) =>
              creature.id === self
                ? { ...creature, attacked: false }
                : creature,
            ),
          },
        },
      };
      return [next, []];
    }),
    TURN_ENDED: buildCardTrigger((state, { self }) => {
      const owner = getOwner(state, self as UUID, "chort.TURN_ENDED");
      const next: GameState = {
        ...state,
        players: {
          ...state.players,
          [owner.id]: {
            ...owner,
            field: owner.field.map((creature) =>
              creature.id === self ? { ...creature, attacked: true } : creature,
            ),
          },
        },
      };
      return [next, []];
    }),
  },
};
