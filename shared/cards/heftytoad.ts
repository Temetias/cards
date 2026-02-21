import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { gameLogicErrorLog, type UUID } from "../utils.ts";

import {
  GAME_LOGIC_ERROR,
  GAME_CONDITION_FAILURE,
  GAME_TRIGGER,
} from "../communication.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";
import { type GameState, getObservers } from "../game.ts";

export const heftytoad: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_heftytoad"),
  cost: 3,
  name: "Hefty Toad",
  faction: FACTIONS.NEUTRAL,
  description: ["Destroy an enemy creature", "with 1 or less power."],
  type: "CREATURE",
  power: 2,
  keywords: [],
  onPlay: buildCardOnPlayTargeted((state, { self, target, initiator }) => {
    if (!target) {
      gameLogicErrorLog(
        GAME_LOGIC_ERROR.NO_TARGET_DEFINED,
        "heftytoad.onPlay",
        initiator,
      );
      throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
    }
    const owner = getOwner(state, self as UUID, "heftytoad.onPlay");
    const opponent = getOpponent(state, owner.id);
    const targetCreature = opponent.field.find((c) => c.id === target);
    if (!targetCreature) {
      gameLogicErrorLog(
        GAME_LOGIC_ERROR.CARD_NOT_FOUND,
        "heftytoad.onPlay",
        initiator,
      );
      throw new Error(GAME_LOGIC_ERROR.CARD_NOT_FOUND);
    }
    if (targetCreature.power > 1) {
      throw new Error(GAME_CONDITION_FAILURE.CARD_PLAY_CONDITION_NOT_MET);
    }
    const deathEffects = getObservers(state, GAME_TRIGGER.CREATURE_DIED).map(
      ({ getDispatch, self: dispatchSelf }) =>
        getDispatch({
          effectName: GAME_TRIGGER.CREATURE_DIED,
          initiator: dispatchSelf,
          self: dispatchSelf,
        }),
    );
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [opponent.id]: {
          ...opponent,
          field: opponent.field.filter((c) => c.id !== target),
          graveyard: [...opponent.graveyard, targetCreature],
        },
      },
    };
    return [next, deathEffects];
  }),
  onPlayTargetingCondition: (state, self) => {
    const owner = getOwner(
      state,
      self as UUID,
      "heftytoad.onPlayTargetingCondition",
    );
    const opponent = getOpponent(state, owner.id);
    return opponent.field.some((c) => c.power <= 1);
  },
  onResourcePlay: null,
  triggers: {},
};
