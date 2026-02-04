import { GAME_LOGIC_ERROR } from "../communication.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";
import { getFieldCreatures, type GameState } from "../game.ts";
import { buildCardTrigger, drawWithEffects } from "./helpers.ts";

export const ghoul: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_ghoul"),
  cost: 2,
  name: "Ghoul",
  description: ["Draw a card when another", "creature dies."],
  type: "CREATURE",
  power: 1,
  keywords: [],
  onPlay: null,
  triggers: {
    CREATURE_DIED: buildCardTrigger((state, { initiator, self }) => {
      // Don't draw if self is the one who died
      if (initiator === self) return null;
      // Don't draw if im dead already
      // TODO: Abstract this check
      const selfInField = getFieldCreatures(state).find((fc) => fc.id === self);
      if (!selfInField) return null;
      const owner = Object.values(state.players).find((p) =>
        p.field.some((fc) => fc.id === self),
      );
      if (!owner) throw new Error(GAME_LOGIC_ERROR.CARD_COULDNT_FIND_OWNER);
      const [drawn, remaining, triggeredEffects] = drawWithEffects(
        owner.deck,
        1,
        state,
        self,
      );
      const next: GameState = {
        ...state,
        players: {
          ...state.players,
          [owner.id]: {
            ...owner,
            hand: [...owner.hand, ...drawn],
            deck: remaining,
          },
        },
      };
      return [next, triggeredEffects];
    }),
  },
};
