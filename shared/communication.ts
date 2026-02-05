import type { Card, GameEffectDispatchArguments } from "./cards/index.ts";
import type { GameState } from "./game.ts";

export const GAME_MECHANIC = "GAME_MECHANIC" as const;
export const GAME_PLAYER = "GAME_PLAYER" as const;
export const GAME_TRIGGER = {
  /**
   * Initiator: Card that was played
   * Target: Card that was targeted by the cards "onPlay" (if any)
   */
  CREATURE_PLAYED: "CREATURE_PLAYED",
  /**
   * Initiator: Card that caused summon or the player (in case of played from hand)
   *
   * (play causes summon)
   */
  CREATURE_SUMMONED: "CREATURE_SUMMONED",
  /**
   * Initiator: Attacking creature
   * Target: Creature that got attacked
   */
  CREATURE_ATTACKED: "CREATURE_ATTACKED",
  /**
   * Initiator: Creature that got attacked
   */
  CREATURE_GOT_ATTACKED: "CREATURE_GOT_ATTACKED",
  /**
   * Initiator: Creature that died
   */
  CREATURE_DIED: "CREATURE_DIED",
  CREATURE_REVIVED: "CREATURE_REVIVED",
  /**
   * Initiator: Card that was played
   * Target: Card that was targeted by the cards "onPlay" (if any)
   */
  SPELL_PLAYED: "SPELL_PLAYED",
  /**
   * Initiator: Player that played the resource
   * Target: Card that was played into resource
   */
  RESOURCE_PLAYED: "RESOURCE_PLAYED",
  /**
   * Initiator: GAME_MECHANIC or Card that caused the draw
   * Target: Card that was drawn
   */
  CARD_DRAWN: "CARD_DRAWN",
  TURN_ENDED: "TURN_ENDED",
  /**
   * Initiator: Protection that got destroyed
   */
  PROTECTION_DESTROYED: "PROTECTION_DESTROYED",
} as const;
export type GameTrigger = keyof typeof GAME_TRIGGER;

export const GAME_ACTION = {
  USER_SELECT: "USER_SELECT",
  USER_UNSELECT: "USER_UNSELECT",
  USER_CLEAR_SELECTION: "USER_CLEAR_SELECTION",
  PLAY_RESOURCE: "PLAY_RESOURCE",
  PLAY_CARD: "PLAY_CARD",
  ATTACK_CREATURE: "ATTACK_CREATURE",
  ATTACK_PROTECTION: "ATTACK_PROTECTION",
  END_TURN: "END_TURN",
  WIN: "WIN",
  FORFEIT: "FORFEIT",
} as const;
export type GameAction = keyof typeof GAME_ACTION;

export const GAME_CONDITION_FAILURE = {
  NOT_PLAYER_TURN: "NOT_PLAYER_TURN",
  NO_CARD_SELECTED: "NO_CARD_SELECTED",
  NOT_ENOUGH_RESOURCE: "NOT_ENOUGH_RESOURCE",
  NOT_ENOUGH_POWER: "NOT_ENOUGH_POWER",
  UNSELECTABLE_TARGET: "UNSELECTABLE_TARGET",
  ALREADY_PLAYED_RESOURCE: "ALREADY_PLAYED_RESOURCE",
  TARGET_NOT_FOUND: "TARGET_NOT_FOUND",
  CREATURE_CANNOT_ATTACK_YET: "CREATURE_CANNOT_ATTACK_YET",
  OPPONENT_HAS_PROTECTION: "OPPONENT_HAS_PROTECTION",
  OPPONENT_HAS_FIELD_CREATURES: "OPPONENT_HAS_FIELD_CREATURES",
  CARD_PLAY_CONDITION_NOT_MET: "CARD_PLAY_CONDITION_NOT_MET",
} as const;
export type GameConditionFailure = keyof typeof GAME_CONDITION_FAILURE;

export const GAME_LOGIC_ERROR = {
  CARD_DEFINITION_NOT_FOUND: "CARD_DEFINITION_NOT_FOUND",
  PLAYER_NOT_FOUND: "PLAYER_NOT_FOUND",
  CARD_NOT_FOUND: "CARD_NOT_FOUND",
  NO_TARGET_DEFINED: "NO_TARGET_DEFINED",
  UNKNOWN_ACTION: "UNKNOWN_ACTION",
  CARD_COULDNT_FIND_OWNER: "CARD_COULDNT_FIND_OWNER",
} as const;
export type GameLogicError = keyof typeof GAME_LOGIC_ERROR;

export function isGameLogicError(
  err: GameLogicError | GameConditionFailure,
): err is GameLogicError {
  return Object.values(GAME_LOGIC_ERROR).includes(err as GameLogicError);
}

export type ServerMessage =
  | {
      message: "GAME_STATE_UPDATE";
      state: GameState;
      logItem?: GameEffectDispatchArguments;
    }
  | {
      message: "GAME_LOGIC_ERROR";
      error: GameLogicError;
    }
  | {
      message: "GAME_CONDITION_FAILURE";
      error: GameConditionFailure;
    }
  | {
      message: "MATCH_PENDING";
    }
  | {
      message: "MATCH_FOUND";
    };

export type ClientMessage = {
  action: GameAction;
  targetId?: Card["id"];
};

export function sendMessage(payload: ServerMessage, socket: WebSocket) {
  socket.send(JSON.stringify(payload));
}
