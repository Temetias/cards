import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { type GameState } from "../game.ts";
import { gameLogicErrorLog, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardTrigger, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";
import { GAME_LOGIC_ERROR } from "../communication.ts";

export const spriggan: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_spriggan"),
  cost: 3,
  name: "Spriggan",
  description: [
    "Whenever you gain resource",
    "gain +1. Whenever, opponent",
    "gains resource, lose -1.",
  ],
  type: "CREATURE",
  power: 2,
  keywords: [],
  onPlay: null,
  faction: FACTIONS.THORNBOUND,
  triggers: {
    RESOURCE_GAINED: buildCardTrigger((state, { initiator, self, target }) => {
      if (target === self) return null;
      const sprigganOwner = getOwner(
        state,
        self as UUID,
        "spriggan.RESOURCE_GAINED",
      );
      const sprigganOpponent = getOpponent(state, sprigganOwner.id);
      if (!target) {
        gameLogicErrorLog(
          GAME_LOGIC_ERROR.NO_TARGET_DEFINED,
          "spriggan.RESOURCE_GAINED",
          initiator,
        );
        throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
      }
      const resourceCardOwner = getOwner(
        state,
        target,
        "spriggan.RESOURCE_GAINED",
      );
      const powerChange =
        resourceCardOwner.id === sprigganOwner.id
          ? 1
          : resourceCardOwner.id === sprigganOpponent.id
            ? -1
            : 0;
      const next: GameState = {
        ...state,
        players: {
          ...state.players,
          [sprigganOwner.id]: {
            ...sprigganOwner,
            field: sprigganOwner.field.map((creature) =>
              creature.id === self
                ? {
                    ...creature,
                    power: Math.max(creature.power + powerChange, 0),
                  }
                : creature,
            ),
          },
        },
      };
      return [next, []];
    }),
  },
};
