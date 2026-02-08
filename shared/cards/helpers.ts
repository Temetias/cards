import {
  GAME_LOGIC_ERROR,
  GAME_MECHANIC,
  GAME_PLAYER,
  GAME_TRIGGER,
} from "../communication.ts";
import { GAME_RULE } from "../constants.ts";
import { getObservers, type Player, type GameState } from "../game.ts";
import { draw } from "../rng.ts";
import { gameLogicErrorLog } from "../utils.ts";
import {
  type GameEffectDispatch,
  type Card,
  type GameEffectDispatchArguments,
  type GameEffectNonTargeted,
  type GameEffectTargeted,
} from "./index.ts";

export function buildCardTrigger(
  fn: (
    state: GameState,
    args: Omit<GameEffectDispatchArguments, "effectName">,
  ) => [next: GameState, triggeredEffects: GameEffectDispatch[]] | null,
): GameEffectNonTargeted {
  return {
    type: "NON_TARGETED",
    getDispatch: (args) => (state) => {
      const result = fn(state, {
        initiator: args.initiator,
        self: args.self,
        target: args.target,
      });
      if (result === null) return null;
      const [next, triggeredEffects] = result;
      return [next, triggeredEffects, args];
    },
  };
}

export function buildCardOnPlayNonTargeted(
  fn: (
    state: GameState,
    args: Omit<GameEffectDispatchArguments, "effectName">,
  ) => [next: GameState, triggeredEffects: GameEffectDispatch[]],
): GameEffectNonTargeted {
  return {
    type: "NON_TARGETED",
    getDispatch: (args) => (state) => {
      const [next, triggeredEffects] = fn(state, {
        initiator: args.initiator,
        self: args.self,
        target: args.target,
      });
      return [next, triggeredEffects, args];
    },
  };
}

export function buildCardOnPlayTargeted(
  fn: (
    state: GameState,
    args: Omit<GameEffectDispatchArguments, "effectName">,
  ) => [next: GameState, triggeredEffects: GameEffectDispatch[]],
): GameEffectTargeted {
  return {
    type: "TARGETED",
    getDispatch: (args) => (state) => {
      const [next, triggeredEffects] = fn(state, {
        initiator: args.initiator,
        self: args.self,
        target: args.target,
      });
      return [next, triggeredEffects, args];
    },
  };
}

export function getOwner(
  state: GameState,
  cardId: Card["id"],
  caller: string,
): Player {
  const owner = Object.values(state.players).find(
    (p) =>
      p.hand.some((c) => c.id === cardId) ||
      p.field.some((c) => c.id === cardId) ||
      p.deck.some((c) => c.id === cardId) ||
      p.graveyard.some((c) => c.id === cardId) ||
      p.protection.some((c) => c.id === cardId) ||
      p.resource.some((c) => c.id === cardId) ||
      p.discard.some((c) => c.id === cardId),
  );
  if (!owner) {
    gameLogicErrorLog(GAME_LOGIC_ERROR.CARD_COULDNT_FIND_OWNER, caller, cardId);
    throw new Error(GAME_LOGIC_ERROR.CARD_COULDNT_FIND_OWNER);
  }
  return owner;
}

export function drawWithEffects(
  playerId: Player["id"],
  amount: number,
  state: GameState,
  initiator: Card["id"] | typeof GAME_MECHANIC | typeof GAME_PLAYER,
): {
  hand: Card[];
  deck: Card[];
  discard: Card[];
  triggeredEffects: GameEffectDispatch[];
} {
  const player = state.players[playerId];
  if (!player) throw new Error(GAME_LOGIC_ERROR.PLAYER_NOT_FOUND);
  if (player.deck.length === 0) {
    return {
      hand: player.hand,
      deck: player.deck,
      discard: player.discard,
      triggeredEffects: [],
    };
  }
  const [attemptedDrawn, remaining] = draw(player.deck, amount);
  const nextHand = [...player.hand, ...attemptedDrawn].slice(
    0,
    GAME_RULE.MAX_HAND_SIZE,
  );
  const discarded = [...player.hand, ...attemptedDrawn].slice(
    GAME_RULE.MAX_HAND_SIZE,
  );
  const actuallyDrawn = attemptedDrawn.slice(
    0,
    nextHand.length - player.hand.length,
  );

  const triggeredDiscardEffects = discarded.flatMap((card) =>
    getObservers(state, GAME_TRIGGER.DISCARD).map(({ getDispatch, self }) =>
      getDispatch({
        effectName: GAME_TRIGGER.DISCARD,
        initiator,
        self,
        target: card.id,
      }),
    ),
  );

  const triggeredDrawEffects = actuallyDrawn.flatMap((card) =>
    getObservers(state, GAME_TRIGGER.CARD_DRAWN).map(({ getDispatch, self }) =>
      getDispatch({
        initiator,
        self,
        effectName: GAME_TRIGGER.CARD_DRAWN,
        target: card.id,
      }),
    ),
  );
  return {
    hand: nextHand,
    deck: remaining,
    discard: [...player.discard, ...discarded],
    triggeredEffects: [...triggeredDrawEffects, ...triggeredDiscardEffects],
  };
}
