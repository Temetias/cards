import { GAME_LOGIC_ERROR } from "../communication.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";
import { getFieldCreatures, type GameState } from "../game.ts";
import { buildCardTrigger, drawWithEffects, getOwner } from "./helpers.ts";
import { gameLogicErrorLog, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";

export const ghoul: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_ghoul"),
  cost: 2,
  name: "Ghoul",
  description: ["Draw a card when another", "creature dies."],
  type: "CREATURE",
  power: 1,
  keywords: [],
  onPlay: null,
  faction: FACTIONS.WORLDFORGED,
  triggers: {
    CREATURE_DIED: buildCardTrigger((state, { initiator, self }) => {
      // Don't draw if self is the one who died
      if (initiator === self) return null;
      // Don't draw if im dead already
      // TODO: Likely obsolete check
      const selfInField = getFieldCreatures(state).find((fc) => fc.id === self);
      if (!selfInField) return null;
      const owner = getOwner(state, self as UUID, "ghoul.CREATURE_DIED");
      const { hand, deck, discard, triggeredEffects } = drawWithEffects(
        owner.id,
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
            hand,
            deck,
            discard,
          },
        },
      };
      return [next, triggeredEffects];
    }),
  },
};
