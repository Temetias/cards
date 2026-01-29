import { GAME_LOGIC_ERROR } from "../communication.ts";
import { type GameState, getFieldCreatures } from "../game.ts";
import { buildCardTrigger } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const reaper: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_reaper"),
  cost: 2,
  name: "Reaper",
  description: "Gains 1 Power each time a card gets drawn.",
  type: "CREATURE",
  power: 0,
  keywords: [],
  onPlay: null,
  triggers: {
    CARD_DRAWN: buildCardTrigger((state, { initiator, self }) => {
      // Don't buff if self is the one who died
      if (initiator === self) return null;
      // Don't buff if im dead already
      const selfInField = getFieldCreatures(state).find((fc) => fc.id === self);
      if (!selfInField) return null;
      const owner = Object.values(state.players).find((p) =>
        p.field.some((fc) => fc.id === self),
      );
      if (!owner) throw new Error(GAME_LOGIC_ERROR.CARD_COULDNT_FIND_OWNER);
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
