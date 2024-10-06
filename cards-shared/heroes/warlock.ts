import { GAME_TRIGGER } from "../match.ts";
import { Hero } from "./types.ts";

export const warlock: Hero = {
  name: "Warlock",
  desciption: "[revive] 2",
  requiredCharges: 2,
  chargeEffect: (state, player, _rng, _target) => {
    const revived = state[player].graveyard.slice(-2);
    const origin = player === "player1" ? "player1Hero" : "player2Hero";
    return {
      state: {
        ...state,
        [player]: {
          ...state[player],
          hand: [...state[player].hand, ...revived],
          graveyard: state[player].graveyard.filter(
            (card) => !revived.includes(card)
          ),
        },
      },
      triggers: [
        {
          origin,
          self: origin,
          trigger: GAME_TRIGGER.HERO_POWER_USED,
          player,
        },
        ...revived.map((card) => ({
          origin,
          self: card.id,
          trigger: GAME_TRIGGER.REVIVED_CARD,
          player,
        })),
      ],
    };
  },
};
