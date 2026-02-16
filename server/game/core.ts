import {
  Card,
  CreatureCardDefintion,
  GameEffectDispatch,
  getCardDefinition,
} from "../../shared/cards/index.ts";
import {
  ClientMessage,
  isGameLogicError,
  sendMessage,
} from "../../shared/communication.ts";
import {
  GAME_ACTION,
  GAME_LOGIC_ERROR,
  GameAction,
  GameConditionFailure,
  GameLogicError,
} from "../../shared/communication.ts";
import {
  FieldCreatureCard,
  GameLog,
  GameState,
  Player,
  Seed,
  gameStateToClientGameState,
} from "../../shared/game.ts";
import { User } from "../../shared/user.ts";
import { gameLogicErrorLog, uuid } from "../../shared/utils.ts";
import { draw, generateSeed, rng, shuffle } from "../../shared/rng.ts";
import { pawn } from "../../shared/cards/pawn.ts";
import { DatabaseSync } from "node:sqlite";
import {
  actionAttackCreature,
  actionAttackProtection,
  actionEndTurn,
  actionForfeit,
  actionPlayCard,
  actionPlayResource,
  actionUserClearSelection,
  actionUserSelect,
  actionUserUnselect,
  actionWin,
} from "./actions.ts";
import { use } from "react";

type UpdateSender = (gs: GameState, log?: GameLog) => void;

function processTriggeredEffects(
  state: GameState,
  dispatches: GameEffectDispatch[],
  log: GameLog,
): GameState {
  if (!dispatches.length) return state;
  const [dispatch, ...restDispatches] = dispatches;
  const dispatchResult = dispatch(state);
  if (!dispatchResult) {
    return processTriggeredEffects(state, restDispatches, log);
  }
  const [nextState, nextDispatches, dispatchArgs] = dispatchResult;
  log.push({ ...dispatchArgs, state: gameStateToClientGameState(nextState) });
  return processTriggeredEffects(
    nextState,
    [...restDispatches, ...nextDispatches],
    log,
  );
}

function handlePlayerAction(
  sendUpdate: UpdateSender,
  state: GameState,
  action: GameAction,
  playerId: Player["id"],
  targetId?: Card["id"],
): GameState {
  const dispatch = (() => {
    switch (action) {
      case GAME_ACTION.END_TURN:
        return actionEndTurn([playerId], []);

      case GAME_ACTION.PLAY_RESOURCE:
        return actionPlayResource([playerId], []);

      case GAME_ACTION.USER_SELECT:
        if (!targetId) {
          gameLogicErrorLog(
            GAME_LOGIC_ERROR.NO_TARGET_DEFINED,
            "core.handlePlayerAction",
            playerId,
          );
          throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
        }
        return actionUserSelect([playerId, targetId], [targetId]);

      case GAME_ACTION.USER_UNSELECT:
        if (!targetId) {
          gameLogicErrorLog(
            GAME_LOGIC_ERROR.NO_TARGET_DEFINED,
            "core.handlePlayerAction",
            playerId,
          );
          throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
        }
        return actionUserUnselect([playerId, targetId], [targetId]);

      case GAME_ACTION.USER_CLEAR_SELECTION:
        return actionUserClearSelection([playerId], []);

      case GAME_ACTION.PLAY_CARD:
        return actionPlayCard([playerId], [targetId]);

      case GAME_ACTION.FORFEIT:
        return actionForfeit([playerId], [playerId]);

      case GAME_ACTION.ATTACK_PROTECTION:
        if (!targetId) {
          gameLogicErrorLog(
            GAME_LOGIC_ERROR.NO_TARGET_DEFINED,
            "core.handlePlayerAction",
            playerId,
          );
          throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
        }
        return actionAttackProtection([playerId], [targetId]);

      case GAME_ACTION.ATTACK_CREATURE:
        if (!targetId) {
          gameLogicErrorLog(
            GAME_LOGIC_ERROR.NO_TARGET_DEFINED,
            "core.handlePlayerAction",
            playerId,
          );
          throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
        }
        return actionAttackCreature([playerId], [targetId]);

      case GAME_ACTION.WIN:
        return actionWin([playerId], [playerId]);

      default:
        throw new Error(GAME_LOGIC_ERROR.UNKNOWN_ACTION);
    }
  })();
  const log: GameLog = [];
  const nextState = processTriggeredEffects(state, [dispatch], log);
  sendUpdate(nextState, log.length ? log : undefined);
  return nextState;
}

function initPlayer(
  { activeDeckId, decks, id, name }: User,
  seed: Seed,
): [player: Player, seed: Seed] {
  const activeDeck = decks.find((deck) => deck.id === activeDeckId) ?? decks[0];
  if (!activeDeck) {
    throw new Error(GAME_LOGIC_ERROR.ACTIVE_DECK_MISSING);
  }
  const startingDeck = activeDeck.cards.map((c) => ({
    ...getCardDefinition(c.definitionId),
    id: c.id,
  }));
  const [shuffledDeck, nextSeed] = shuffle(startingDeck, seed);
  const [hand, tempDeck] = draw(shuffledDeck, 5);
  const [protection, deck] = draw(tempDeck, 5);
  return [
    {
      id,
      name,
      startingDeck,
      deck,
      hand,
      protection,
      resource: [],
      graveyard: [],
      discard: [],
      field: [],
      userSelection: null,
      hasPlayedResource: false,
    },
    nextSeed,
  ];
}

function init(
  user1: User,
  user2: User,
): [
  getState: () => GameState,
  applyAction: (
    action: GameAction,
    playerId: Player["id"],
    targetId?: Card["id"],
  ) => { winner: Player["id"]; loser: Player["id"] } | void,
  sendUpdate: UpdateSender,
] {
  const initialSeed = generateSeed();
  const [player1, tempSeed1] = initPlayer(user1, initialSeed);
  const [player2, tempSeed2] = initPlayer(user2, tempSeed1);
  const [val, currentSeed] = rng(tempSeed2);
  const activePlayer = val < 0.5 ? player1.id : player2.id;
  const inactivePlayer = val < 0.5 ? player2.id : player1.id;

  // Pawn is the equalizer for first turn advantage
  const pawnCreature: FieldCreatureCard = {
    ...(getCardDefinition(pawn.definitionId) as CreatureCardDefintion),
    type: "CREATURE",
    id: uuid(),
    attacked: true,
  };

  let state: GameState = {
    rng: {
      initialSeed,
      currentSeed,
    },
    players: {
      [player1.id]: player1,
      [player2.id]: player2,
    },
    cardPool: [...player1.startingDeck, ...player2.startingDeck, pawnCreature],
    activePlayer,
    inactivePlayer,
    turnTimer: 0,
    turnCount: 0,
    winner: null,
  };
  state.players[inactivePlayer].field.push(pawnCreature);
  const sendUpdate: UpdateSender = (gs, log) => {
    [user1, user2].forEach((user) => {
      if (user.socket.readyState !== WebSocket.OPEN) return;
      sendMessage(
        {
          message: "GAME_STATE_UPDATE",
          state: gameStateToClientGameState(gs),
          ...(log ? { log } : {}),
        },
        user.socket,
      );
    });
  };
  return [
    () => state,
    (action, playerId, targetId) => {
      state = handlePlayerAction(sendUpdate, state, action, playerId, targetId);
      if (state.winner)
        return {
          winner: state.winner,
          loser: state.winner === player1.id ? player2.id : player1.id,
        };
    },
    sendUpdate,
  ];
}

export type GameEndReportFunction = (
  winnerId: Player["id"],
  loserId: Player["id"],
  forfeitedBy: Player["id"] | null,
) => void;

export function startMatch(
  user1: User,
  user2: User,
  reportGameEnd: GameEndReportFunction,
) {
  const [getState, applyAction, sendUpdate] = init(user1, user2);
  // Send initial game state to both players
  sendUpdate(getState());

  const detachers = [user1, user2].map((user) => {
    const messageHandler = (event: MessageEvent) => {
      const { action, targetId } = JSON.parse(event.data) as ClientMessage;
      try {
        const result = applyAction(action, user.id, targetId);
        if (result) {
          reportGameEnd(result.winner, result.loser, null);
          detachers.forEach((detach) => detach());
        }
      } catch (e) {
        const error = (e as Error).message as
          | GameLogicError
          | GameConditionFailure;
        if (isGameLogicError(error)) {
          console.error("Game logic error:", error);
          sendMessage(
            {
              message: "GAME_LOGIC_ERROR",
              error,
            },
            user.socket,
          );
        } else {
          sendMessage(
            {
              message: "GAME_CONDITION_FAILURE",
              error,
            },
            user.socket,
          );
        }
      }
    };
    user.socket.addEventListener("message", messageHandler);
    const closeHandler = () => {
      applyAction(GAME_ACTION.FORFEIT, user.id);
      const winnerId = user.id === user1.id ? user2.id : user1.id;
      reportGameEnd(winnerId, user.id, user.id);
      detachers.forEach((detach) => detach());
    };
    user.socket.addEventListener("close", closeHandler);
    return () => {
      user.socket.removeEventListener("message", messageHandler);
      user.socket.removeEventListener("close", closeHandler);
    };
  });
  // Todo game loop for turn timer.
}
