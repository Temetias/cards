import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { GAME_LOGIC_ERROR } from "../communication.ts";
import type { GameState } from "../game.ts";
import { gameLogicErrorLog, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const beasttamer: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_beasttamer"),
  cost: 4,
  name: "Beast Tamer",
  description: [
    "On play: Lower the power of",
    "an enemy creature by an equal",
    "amount as the power of your",
    "strongest creature.",
  ],
  type: "CREATURE",
  power: 3,
  keywords: [],
  onResourcePlay: null,
  onPlayTargetingCondition: (state, self) => {
    const owner = getOwner(
      state,
      self as UUID,
      "beasttamer.onPlayTargetingCondition",
    );
    const opponent = getOpponent(state, owner.id);
    return opponent.field.length > 0;
  },
  onPlay: buildCardOnPlayTargeted((state, { self, target }) => {
    if (!target) {
      gameLogicErrorLog(
        GAME_LOGIC_ERROR.NO_TARGET_DEFINED,
        "beasttamer.onPlay",
        self,
      );
      throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
    }
    const owner = getOwner(state, self as UUID, "beasttamer.onPlay");
    const opponent = getOpponent(state, owner.id);
    if (opponent.field.length === 0) return [state, []];
    const reduction = owner.field
      .filter((c) => c.id !== self)
      .reduce((max, creature) => Math.max(max, creature.power), 0);
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [opponent.id]: {
          ...opponent,
          field: opponent.field.map((creature) =>
            creature.id === target
              ? { ...creature, power: Math.max(creature.power - reduction, 0) }
              : creature,
          ),
        },
      },
    };
    return [next, []];
  }),
  triggers: {},
  faction: FACTIONS.ASTRALS,
};
