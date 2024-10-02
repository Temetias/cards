import { draw, TriggerResult } from "../match.ts";
import { Card } from "./types.ts";

export const siren: Card = {
  name: "Siren",
  cost: 3,
  power: 20,
  description: "Whenever a creature dies, draw a card.",
  triggers: {
    cardDied: (state, player, rng, origin, self): TriggerResult => {
      if (origin === self) return { state, triggers: [] };
      const { drawn, remaining } = draw(state[player].deck, 1, rng);
      const newState = {
        ...state,
        [player]: {
          ...state[player],
          hand: [...state[player].hand, ...drawn],
          deck: remaining,
        },
      };
      return {
        state: newState,
        triggers: [{ origin: self, self, trigger: "cardDrawn", player }],
      };
    },
  },
};
