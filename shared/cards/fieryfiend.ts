import { type GameState } from "../game.ts";
import { type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import {
  buildCardOnPlayNonTargeted,
  drawWithEffects,
  getOwner,
} from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const fieryfiend: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_fieryfiend"),
  name: "Fiery Fiend",
  description: ["On play: Draw a card"],
  cost: 1,
  type: "CREATURE",
  power: 1,
  keywords: [],
  triggers: {},
  faction: FACTIONS.WORLDFORGED,
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "fieryfiend.onPlay");
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
