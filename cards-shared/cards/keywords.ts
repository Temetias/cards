import { GAME_TRIGGER } from "../match.ts";
import { Card } from "./types.ts";

export const revive: Card["playEffect"] = (state, player, origin) => {
  const revivedCard = [...state[player].graveyard].pop();
  if (!revivedCard) return { state, triggers: [] };
  return {
    state: {
      ...state,
      [player]: {
        ...state[player],
        graveyard: state[player].graveyard.filter(
          (card) => card.id !== revivedCard.id
        ),
        hand: [
          ...state[player].hand,
          {
            ...revivedCard,
            keywords: [...(revivedCard.keywords || []), "revived"],
          },
        ],
      },
    },
    triggers: [
      {
        origin,
        self: revivedCard.id,
        trigger: GAME_TRIGGER.REVIVED_CARD,
        player,
      },
    ],
  };
};
