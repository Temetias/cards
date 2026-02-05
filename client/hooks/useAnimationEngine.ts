import { useEffect, useRef, useState } from "react";
import type {
  ClientMessage,
  GameAction,
  GameConditionFailure,
  GameLogicError,
  GameTrigger,
  ServerMessage,
} from "../../shared/communication.ts";
import type { GameLog, GameState, Player } from "../../shared/game.ts";
import type { Nullable, UUID } from "../../shared/utils.ts";

function useWs(onMessage: (msg: ServerMessage) => void, userId: string) {
  const wsRef = useRef<Nullable<WebSocket>>(null);
  useEffect(() => {
    const ws = new WebSocket(
      "ws://localhost:8000/api/game/matchmaking?userId=" + userId,
    );
    wsRef.current = ws;
    ws.onopen = () => {
      console.log("WebSocket connected");
    };
    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };
    ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data);
      onMessage(msg);
    };
    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, []);
  return (msg: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.error("WebSocket is not open. Cannot send message:", msg);
    }
  };
}

const ANIMATION_LENGTHS: Record<GameTrigger | GameAction, number> = {
  CREATURE_PLAYED: 1000,
  CREATURE_ATTACKED: 500,
  CREATURE_GOT_ATTACKED: 500,
  CREATURE_DIED: 500,
  CREATURE_REVIVED: 500,
  SPELL_PLAYED: 1000,
  RESOURCE_PLAYED: 0,
  CARD_DRAWN: 500,
  TURN_STARTED: 0,
  TURN_ENDED: 0,
  PROTECTION_DESTROYED: 500,
  USER_SELECT: 0,
  USER_UNSELECT: 0,
  USER_CLEAR_SELECTION: 0,
  PLAY_RESOURCE: 0,
  PLAY_CARD: 0,
  ATTACK_CREATURE: 0,
  ATTACK_PROTECTION: 0,
  END_TURN: 0,
  WIN: 0,
  FORFEIT: 0,
};

export type AnimatedGameState = Omit<GameState, "players"> & {
  players: Record<Player["id"], Omit<Player, "userSelection">>;
};

export function useAnimationEngine(userId: UUID) {
  const [providedGameState, setProvidedGameState] =
    useState<Nullable<AnimatedGameState>>(null);
  const [currentLogItem, setCurrentLogItem] =
    useState<Nullable<GameLog[number]>>(null);
  const [currentErrorItem, setCurrentErrorItem] =
    useState<Nullable<GameConditionFailure | GameLogicError>>(null);

  const [playerUserSelectionState, setPlayerUserSelectionState] =
    useState<Player["userSelection"]>(null);
  const [opponentUserSelectionState, setOpponentUserSelectionState] =
    useState<Player["userSelection"]>(null);

  const latestAnimatedRef = useRef<Nullable<GameState>>(null);
  const queueRef = useRef<GameLog>([]);
  const timeoutRef = useRef<number | null>(null);

  const processNext = () => {
    if (timeoutRef.current !== null) return;
    const next = queueRef.current.shift();
    if (!next) {
      console.log("[animation] queue empty");
      setProvidedGameState(latestAnimatedRef.current);
      setCurrentLogItem(null);
      return;
    }

    setCurrentLogItem(next);
    console.log("[animation] apply", {
      effectName: next.effectName,
      initiator: next.initiator,
      self: next.self,
      target: next.target,
      delayMs: ANIMATION_LENGTHS[next.effectName] ?? 0,
      remaining: queueRef.current?.length,
    });
    latestAnimatedRef.current = next.state;
    // Default to 1ms if no animation length defined
    // This makes it so that instant animations won't apply state
    // before the next log item is processed
    // TODO: Test if network latency affects this
    // if it does, we will need message bundling instead of single messages
    const delay = ANIMATION_LENGTHS[next.effectName] || 1;
    timeoutRef.current = setTimeout(() => {
      setCurrentLogItem(null);
      timeoutRef.current = null;
      processNext();
    }, delay);
  };

  const sendMessage = useWs((msg: ServerMessage) => {
    if (msg.message === "GAME_STATE_UPDATE") {
      setPlayerUserSelectionState(msg.state.players[userId].userSelection);
      const opponentId = Object.keys(msg.state.players).find(
        (id) => id !== userId,
      )!;
      setOpponentUserSelectionState(
        msg.state.players[opponentId as UUID].userSelection,
      );
      if (msg.logItem) {
        queueRef.current.push({ ...msg.logItem, state: msg.state });
        processNext();
        return;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      queueRef.current = [];
      latestAnimatedRef.current = msg.state;
      setCurrentLogItem(null);
      setProvidedGameState(msg.state);
    } else if (
      msg.message === "GAME_LOGIC_ERROR" ||
      msg.message === "GAME_CONDITION_FAILURE"
    ) {
      setCurrentErrorItem(msg.error);
    }
  }, userId);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [
    providedGameState,
    sendMessage,
    currentLogItem,
    playerUserSelectionState,
    opponentUserSelectionState,
    currentErrorItem,
  ] as const;
}
