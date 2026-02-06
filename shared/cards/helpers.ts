import {
  GAME_LOGIC_ERROR,
  GAME_MECHANIC,
  GAME_PLAYER,
  GAME_TRIGGER,
} from "../communication.ts";
import {
  getFieldCreatures,
  getObservers,
  type Player,
  type GameState,
} from "../game.ts";
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
  deck: Card[],
  amount: number,
  state: GameState,
  initiator: Card["id"] | typeof GAME_MECHANIC | typeof GAME_PLAYER,
): [drawn: Card[], remaining: Card[], effects: GameEffectDispatch[]] {
  const [drawn, remaining] = draw(deck, amount);
  const triggeredEffects = drawn.flatMap((card) =>
    getObservers(state, GAME_TRIGGER.CARD_DRAWN).map(({ getDispatch, self }) =>
      getDispatch({
        initiator,
        self,
        effectName: GAME_TRIGGER.CARD_DRAWN,
        target: card.id,
      }),
    ),
  );
  return [drawn, remaining, triggeredEffects];
}
