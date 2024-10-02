import { GAME_TRIGGER } from "../match.ts";
import { Card } from "./types.ts";

export const chort: Card = {
  name: "Chort",
  cost: 5,
  power: 20,
  description: "Destroy a creature.",
  playEffect: (state, _player, _origin, _rng, target) => {
    if (!target) return { state, triggers: [] };
    const targetCard = [...state.player1.field, ...state.player2.field].find(
      (c) => c.id === target
    );
    if (!targetCard) return { state, triggers: [] };
    const targetPlayer = state.player1.field.includes(targetCard)
      ? "player1"
      : "player2";
    return {
      state: {
        ...state,
        [targetPlayer]: {
          ...state[targetPlayer],
          field: state[targetPlayer].field.filter((c) => c.id !== target),
          graveyard: [...state[targetPlayer].graveyard, targetCard],
        },
      },
      triggers: [
        {
          origin: target,
          self: target,
          trigger: GAME_TRIGGER.CARD_DIED,
          player: targetPlayer,
        },
      ],
    };
  },
};
