import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import type { GameState } from "../game.ts";
import { brand, uuid, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import {
  cardDefinitionId,
  type CreatureCard,
  getCardDefinition,
  type CreatureCardDefintion,
} from "./index.ts";

export const butcher: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_butcher"),
  cost: 5,
  name: "Butcher",
  description: [
    "On play: Place a 0 power",
    "maggot on top of",
    "opponents deck.",
  ],
  type: "CREATURE",
  power: 4,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "butcher.onPlay");
    const maggot = getCardDefinition(
      brand("noncollectible_maggot", "CARD_DEFINITION_ID"),
    ) as CreatureCardDefintion;
    const maggotCard: CreatureCard = {
      ...maggot,
      id: uuid(),
    };
    const opponent = getOpponent(state, owner.id);
    const next: GameState = {
      ...state,
      cardPool: [...state.cardPool, maggotCard],
      players: {
        ...state.players,
        [opponent.id]: {
          ...opponent,
          deck: [maggotCard, ...opponent.deck],
        },
      },
    };
    return [next, []];
  }),
  triggers: {},
  faction: FACTIONS.DOMINION,
};
