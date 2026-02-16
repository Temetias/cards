import { useEffect, useRef, useState } from "react";
import type {
  ClientMessage,
  GameAction,
  GameConditionFailure,
  GameLogicError,
  GameTrigger,
  ServerMessage,
} from "../../shared/communication.ts";
import type {
  GameLog,
  ClientGameState,
  ClientPlayer,
} from "../../shared/game.ts";
import type { Nullable, UUID } from "../../shared/utils.ts";
import { isMyTurn } from "../utils/GameStateUtils.ts";
import { IS_PROD } from "../utils/runtime.ts";

function useWs(onMessage: (msg: ServerMessage) => void, userId: string) {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const wsRef = useRef<Nullable<WebSocket>>(null);
  useEffect(() => {
    const host = IS_PROD ? location.host : "localhost:8000";
    const ws = new WebSocket(
      `${protocol}://${host}/api/game/matchmaking?userId=` + userId,
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
  CREATURE_PLAYED: 2000,
  CREATURE_SUMMONED: 0,
  CREATURE_ATTACKED: 500,
  CREATURE_GOT_ATTACKED: 500,
  CREATURE_DIED: 500,
  CREATURE_REVIVED: 500,
  SPELL_PLAYED: 2000,
  RESOURCE_GAINED: 0,
  CARD_DRAWN: 500,
  DISCARD: 500,
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

const ANIMATION_SOUNDS: Partial<Record<GameTrigger | GameAction, string>> = {
  CARD_DRAWN: "/card_draw.mp3",
  CREATURE_ATTACKED: "/attacked.mp3",
  CREATURE_GOT_ATTACKED: "/got_attacked.mp3",
  CREATURE_DIED: "/died.mp3",
  RESOURCE_GAINED: "/card_draw.mp3",
  PROTECTION_DESTROYED: "/protection_destroy.mp3",
};

export type AnimatedGameState = Omit<ClientGameState, "players"> & {
  players: Record<ClientPlayer["id"], Omit<ClientPlayer, "userSelection">>;
};

export function useAnimationEngine(userId: UUID) {
  const [providedGameState, setProvidedGameState] =
    useState<Nullable<AnimatedGameState>>(null);
  const [currentLogItem, setCurrentLogItem] =
    useState<Nullable<GameLog[number]>>(null);
  const [currentErrorItem, setCurrentErrorItem] =
    useState<Nullable<GameConditionFailure | GameLogicError>>(null);

  const [playerUserSelectionState, setPlayerUserSelectionState] =
    useState<ClientPlayer["userSelection"]>(null);
  const [opponentUserSelectionState, setOpponentUserSelectionState] =
    useState<ClientPlayer["userSelection"]>(null);

  const latestAnimatedRef = useRef<Nullable<ClientGameState>>(null);
  const queueRef = useRef<GameLog>([]);
  const pendingQueueRef = useRef<GameLog>([]);
  const pendingStateRef = useRef<Nullable<ClientGameState>>(null);
  const timeoutRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    console.log("[animation] providedGameState changed", providedGameState);
  }, [providedGameState]);

  const finalizeChain = () => {
    console.log("[animation] queue empty");
    isProcessingRef.current = false;
    const finalState = latestAnimatedRef.current ?? pendingStateRef.current;
    if (finalState) {
      setProvidedGameState(finalState);
    }
    if (pendingQueueRef.current.length > 0) {
      queueRef.current = pendingQueueRef.current;
      pendingQueueRef.current = [];
      pendingStateRef.current = null;
      setCurrentLogItem(null);
      // Let the state render before starting the next chain
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        processNext();
      }, 1);
      return;
    }
    setCurrentLogItem(null);
  };

  const processNext = () => {
    if (timeoutRef.current !== null) return;
    const next = queueRef.current.shift();
    if (!next) {
      finalizeChain();
      return;
    }

    isProcessingRef.current = true;
    setCurrentLogItem(next);

    // Play sound if one exists for this effect
    const soundPath = ANIMATION_SOUNDS[next.effectName];
    if (soundPath) {
      const audio = new Audio(soundPath);
      audio.play().catch((err) => console.error("Failed to play sound:", err));
    }

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
    const baseDelay = ANIMATION_LENGTHS[next.effectName] || 1;
    const cardPlayed =
      next.effectName === "CREATURE_PLAYED" ||
      next.effectName === "SPELL_PLAYED";

    if (cardPlayed) {
      const definitionId = next.state.cardPool.find(
        (c) => c.id === next.initiator,
      )?.definitionId;
      if (definitionId) {
        const audio = new Audio(`/${definitionId}.mp3`);
        audio
          .play()
          .catch((err) => console.error("Failed to play sound:", err));
      }
    }

    const skipSelfPlayDelay = cardPlayed && isMyTurn(next.state, userId);
    const delay = skipSelfPlayDelay ? 1 : baseDelay;
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
      if (msg.log && msg.log.length > 0) {
        if (isProcessingRef.current) {
          pendingQueueRef.current.push(...msg.log);
          pendingStateRef.current = msg.state;
          return;
        }
        queueRef.current.push(...msg.log);
        processNext();
        return;
      }
      if (isProcessingRef.current) {
        pendingStateRef.current = msg.state;
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
