import { GAME_RULE } from "../constants.ts";
import { type GameState } from "../game.ts";
import { brand, uuid, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import {
  type Card,
  cardDefinitionId,
  type CreatureCardDefintion,
  getCardDefinition,
} from "./index.ts";

export const pawnmaker: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_pawnmaker"),
  cost: 4,
  name: "Pawnmaker",
  description: ["On play: Put a 1 cost 1 power", "Pawn into your hand."],
  type: "CREATURE",
  power: 3,
  keywords: [],
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "pawnmaker.onPlay");
    const pawnCard: Card = {
      id: uuid(),
      ...getCardDefinition(brand("noncollectible_pawn", "CARD_DEFINITION_ID")),
    };
    const discarded =
      owner.hand.length >= GAME_RULE.MAX_HAND_SIZE ? [pawnCard] : [];
    const drawn = owner.hand.length < GAME_RULE.MAX_HAND_SIZE ? [pawnCard] : [];
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          hand: [...owner.hand, ...drawn],
          discard: [...owner.discard, ...discarded],
        },
      },
    };
    return [next, []];
  }),
  onResourcePlay: null,
  triggers: {},
  faction: FACTIONS.NEUTRAL,
};
