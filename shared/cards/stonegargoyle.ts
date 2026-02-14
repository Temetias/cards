import { type GameState } from "../game.ts";
import { type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardTrigger, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const stonegargoyle: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_stonegargoyle"),
  cost: 4,
  name: "Stone Gargoyle",
  description: ["Any time this creature survives", "combat, it loses 1 power."],
  type: "CREATURE",
  power: 6,
  keywords: [],
  onPlay: null,
  onResourcePlay: null,
  triggers: {
    CREATURE_ATTACKED: buildCardTrigger(
      (state, { initiator, self, target }) => {
        if (initiator !== self) return null;
        const owner = getOwner(
          state,
          self as UUID,
          "stonegargoyle.CREATURE_ATTACKED",
        );
        const next: GameState = {
          ...state,
          players: {
            ...state.players,
            [owner.id]: {
              ...owner,
              field: owner.field.map((creature) =>
                creature.id === self
                  ? { ...creature, power: creature.power - 1 }
                  : creature,
              ),
            },
          },
        };
        return [next, []];
      },
    ),
    CREATURE_GOT_ATTACKED: buildCardTrigger(
      (state, { initiator, self, target }) => {
        if (initiator !== self) return null;
        const owner = getOwner(
          state,
          self as UUID,
          "stonegargoyle.CREATURE_GOT_ATTACKED",
        );
        const next: GameState = {
          ...state,
          players: {
            ...state.players,
            [owner.id]: {
              ...owner,
              field: owner.field.map((creature) =>
                creature.id === self
                  ? { ...creature, power: creature.power - 1 }
                  : creature,
              ),
            },
          },
        };
        return [next, []];
      },
    ),
  },
  faction: FACTIONS.NEUTRAL,
};
