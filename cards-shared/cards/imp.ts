import { TriggerResult } from "../match.ts";
import { CreatureCard } from "./types.ts";

export const imp: CreatureCard = {
  type: "creature",
  name: "Imp",
  cost: 2,
  power: 10,
  description: "Whenever this creature attacks, gain [cowardly].",
  triggers: {
    cardAttacked: (state, player, _rng, origin, self): TriggerResult => {
      if (origin !== self) return { state, triggers: [] };
      return {
        state: {
          ...state,
          [player]: {
            ...state[player],
            field: state[player].field.map((c) =>
              c.id === self && !c.keywords?.includes("cowardly")
                ? { ...c, keywords: [...(c.keywords || []), "cowardly"] }
                : c
            ),
          },
        },
        triggers: [],
      };
    },
  },
};
