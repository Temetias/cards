import { GAME_LOGIC_ERROR } from "../communication.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";
import { getFieldCreatures, type GameState } from "../game.ts";
import { buildCardTrigger, drawWithEffects, getOwner } from "./helpers.ts";
import { gameLogicErrorLog, type UUID } from "../utils.ts";

export const chort: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_chort"),
  cost: 3,
  name: "Chort",
  description: ["Can only attack if another", "creature died this turn."],
  type: "CREATURE",
  power: 5,
  keywords: [],
  onPlay: null,
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
