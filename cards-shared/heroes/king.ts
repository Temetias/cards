import { GAME_TRIGGER } from "../match.ts";
import { Hero } from "./types.ts";

export const king: Hero = {
  name: "King",
  desciption: "Give all your creatures +10 power.",
  requiredCharges: 4,
  chargeEffect: (state, player, _rng, _target) => {
    const origin = player === "player1" ? "player1Hero" : "player2Hero";
    return {
      state: {
        ...state,
        [player]: {
          ...state[player],
          field: state[player].field.map((card) => ({
            ...card,
            power: card.power + 10,
          })),
        },
      },
      triggers: [
        {
          origin,
          self: origin,
          trigger: GAME_TRIGGER.HERO_POWER_USED,
          player,
        },
      ],
    };
  },
};
