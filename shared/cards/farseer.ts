import { type GameState } from "../game.ts";
import { type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import {
  buildCardOnPlayNonTargeted,
  drawWithEffects,
  getOwner,
} from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const farseer: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_farseer"),
  name: "Farseer",
  description: ["On play: Draw a card"],
  cost: 5,
  type: "CREATURE",
  power: 2,
  keywords: [],
  triggers: {},
  faction: FACTIONS.ASTRALS,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "farseer.onPlay");
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
};
