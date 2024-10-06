import { GameState, TriggerParams } from "@cards/shared";
import { useEffect, useState, useRef } from "react";

type IdentifiableTriggerParams = TriggerParams & { id: string };

const ANIMATION_DURATION = 500;

function processAnimationTrigger(trParams: TriggerParams, queIndex: number) {
  const element = document.getElementById(trParams.self);
  if (!element) return;
  switch (trParams.trigger) {
    case "cardAttacked":
      return element.animate(
        [
          { transform: "translateY(0%)" },
          {
            transform: "translateY(-100%)",
          },
          { transform: "translateY(0%)" },
        ],
        {
          delay: queIndex * ANIMATION_DURATION,
          duration: ANIMATION_DURATION,
          iterations: 1,
        }
      );
    case "cardWasAttacked":
      return element.animate(
        [
          {
            backgroundColor: "rgba(255, 0, 0, 0)",
            offset: 0,
          },
          {
            backgroundColor: "rgba(255, 0, 0, 0)",
            offset: 0.5,
          },
          {
            backgroundColor: "rgba(255, 0, 0, 1)",
            offset: 0.51,
          },
          {
            backgroundColor: "rgba(255, 0, 0, 0)",
            offset: 1,
          },
        ],
        {
          delay: queIndex * ANIMATION_DURATION,
          duration: ANIMATION_DURATION,
          iterations: 1,
        }
      );
  }
}

export function useAnimationEngine(trueGameState: GameState | null) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [processedTriggers, setProcessedTriggers] = useState<string[]>([]);
  const animating = useRef(false);

  useEffect(() => {
    if (!trueGameState?.triggers.length) return;
    const newTriggers = trueGameState.triggers.filter(
      (tr: IdentifiableTriggerParams) => !processedTriggers.includes(tr.id)
    );
    if (!newTriggers.length) return;
    setProcessedTriggers((ts) =>
      ts.concat(newTriggers.map((t: IdentifiableTriggerParams) => t.id))
    );
    const timedTriggers: IdentifiableTriggerParams[][] = newTriggers.reduce(
      (acc: IdentifiableTriggerParams[][], cur: IdentifiableTriggerParams) => {
        const last = acc[acc.length - 1];
        if (!last) return [[cur]];
        if (last[0].id === cur.id) {
          last.push(cur);
          return acc;
        } else {
          return [...acc, [cur]];
        }
      },
      [] as IdentifiableTriggerParams[][]
    );
    const animations = timedTriggers
      .map((triggers, i) => {
        return triggers
          .map((t) => processAnimationTrigger(t, i))
          .filter(Boolean) as Animation[];
      })
      .filter((triggers) => triggers.length);

    if (!animations.length) return;
    animating.current = true;
    setTimeout(() => {
      setGameState(trueGameState);
      animating.current = false;
    }, animations.length * ANIMATION_DURATION);
  }, [trueGameState?.triggers.length]);

  useEffect(() => {
    if (animating.current) return;
    setGameState(trueGameState);
  }, [trueGameState]);

  return { gameState, animating: animating.current };
}
