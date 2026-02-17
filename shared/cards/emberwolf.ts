import { GAME_MECHANIC } from "../communication.ts";
import { type GameState } from "../game.ts";
import { type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardTrigger, drawWithEffects, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const emberwolf: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_emberwolf"),
  cost: 2,
  name: "Emberwolf",
  description: ["On start of turn: Draw a card."],
  type: "CREATURE",
  power: 2,
  keywords: [],
  onPlay: null,
  faction: FACTIONS.WORLDFORGED,
  onResourcePlay: null,
  triggers: {
    CARD_DRAWN: buildCardTrigger((state, { initiator, self, target }) => {
      // GAME_MECHANIC card draw is the start of turn draw and most reliable way to detect it
      if (initiator !== GAME_MECHANIC) return null;
      const owner = getOwner(state, self as UUID, "emberwolf.CARD_DRAWN");
      // Only trigger if owner drew the card
      if (!owner.hand.some((c) => c.id === target)) return null;
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
