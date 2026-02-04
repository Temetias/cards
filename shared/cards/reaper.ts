import { GAME_LOGIC_ERROR } from "../communication.ts";
import { type GameState, getFieldCreatures } from "../game.ts";
import { buildCardTrigger } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const reaper: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_reaper"),
  cost: 2,
  name: "Reaper",
  description: ["Gains 1 Power each time", "owner draws a card."],
  type: "CREATURE",
  power: 0,
  keywords: [],
  onPlay: null,
  triggers: {
    CARD_DRAWN: buildCardTrigger((state, { initiator, self, target }) => {
      // Don't buff if self is the one who was drawn (shouldn't happen anyway)
      if (initiator === self) return null;
      // Don't buff if im dead already
      const selfInField = getFieldCreatures(state).find((fc) => fc.id === self);
      if (!selfInField) return null;
      const owner = Object.values(state.players).find((p) =>
        p.field.some((fc) => fc.id === self),
      );
      if (!owner) throw new Error(GAME_LOGIC_ERROR.CARD_COULDNT_FIND_OWNER);
      // Don't buff if opponent drew
      if (!owner.hand.some((c) => c.id === target)) return null;
      const next: GameState = {
        ...state,
        players: {
          ...state.players,
          [owner.id]: {
            ...owner,
            field: owner.field.map((fc) =>
              fc.id === self ? { ...fc, power: fc.power + 1 } : fc,
            ),
          },
        },
      };
      return [next, []];
    }),
  },
};
