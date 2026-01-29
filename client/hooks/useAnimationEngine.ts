import { useEffect, useRef, useState } from "react";
import type {
  ClientMessage,
  GameAction,
  GameTrigger,
  ServerMessage,
} from "../../shared/communication.ts";
import type { GameLog, GameState } from "../../shared/game.ts";
import type { Nullable } from "../../shared/utils.ts";

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
  CREATURE_ATTACKED: 1000,
  CREATURE_GOT_ATTACKED: 1000,
  CREATURE_DIED: 1000,
  CREATURE_REVIVED: 1000,
  SPELL_PLAYED: 1000,
  RESOURCE_PLAYED: 1000,
  CARD_DRAWN: 1000,
  TURN_STARTED: 0,
  TURN_ENDED: 0,
  PROTECTION_DESTROYED: 1000,
  USER_SELECT: 0,
  USER_UNSELECT: 0,
  USER_CLEAR_SELECTION: 0,
  PLAY_RESOURCE: 1000,
  PLAY_CARD: 1000,
  ATTACK_CREATURE: 1000,
  ATTACK_PROTECTION: 1000,
  END_TURN: 0,
  WIN: 0,
  FORFEIT: 0,
};

export function useAnimationEngine(userId: string) {
  const [gameState, setGameState] = useState<Nullable<GameState>>(null);
  const queueRef = useRef<GameLog>([]);
  const timeoutRef = useRef<number | null>(null);

  const processNext = () => {
    if (timeoutRef.current !== null) return;
    const next = queueRef.current.shift();
    if (!next) return;

    console.log("[animation] apply", {
      effectName: next.effectName,
      delayMs: ANIMATION_LENGTHS[next.effectName] ?? 0,
      remaining: queueRef.current.length,
    });
    setGameState(next.state);
    const delay = ANIMATION_LENGTHS[next.effectName] ?? 0;
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      processNext();
    }, delay);
  };

  const sendMessage = useWs((msg: ServerMessage) => {
    if (msg.message === "GAME_STATE_UPDATE") {
      console.log("[animation] update", {
        log: msg.log,
      });
      if (msg.log.length <= 1) {
        if (timeoutRef.current !== null) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        queueRef.current = [];
        console.log("[animation] apply instant");
        setGameState(msg.state);
        return;
      }

      queueRef.current.push(...msg.log);
      console.log("[animation] queued", {
        queued: queueRef.current.length,
      });
      processNext();
    }
  }, userId);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [gameState, sendMessage] as const;
}
