import { type GameState } from "../game.ts";
import { type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import {
  buildCardOnPlayNonTargeted,
  drawWithEffects,
  getOwner,
} from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const dwarvenengineer: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_dwarvenengineer"),
  name: "Dwarven Engineer",
  description: ["On play: Draw a card"],
  cost: 3,
  type: "CREATURE",
  power: 2,
  keywords: [],
  triggers: {},
  faction: FACTIONS.NEUTRAL,
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "dwarvenengineer.onPlay");
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
