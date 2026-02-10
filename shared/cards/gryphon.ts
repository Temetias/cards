import { type GameState } from "../game.ts";
import { type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardTrigger, drawWithEffects, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const gryphon: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_gryphon"),
  name: "Gryphon",
  description: ["Whenever this creature", "attacks, draw a card"],
  cost: 4,
  type: "CREATURE",
  power: 3,
  keywords: [],
  faction: FACTIONS.NEUTRAL,
  onResourcePlay: null,
  triggers: {
    CREATURE_ATTACKED: buildCardTrigger((state, { self, initiator }) => {
      if (initiator !== self) return null;
      const owner = getOwner(state, self as UUID, "gryphon.CREATURE_ATTACKED");
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
  onPlay: null,
};
