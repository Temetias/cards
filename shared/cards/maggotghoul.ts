import {
  cardDefinitionId,
  type CreatureCard,
  getCardDefinition,
  type CreatureCardDefintion,
} from "./index.ts";
import { type GameState } from "../game.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { brand, uuid, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { getOpponent } from "../../client/utils/GameStateUtils.ts";

export const maggotghoul: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_maggotghoul"),
  cost: 3,
  name: "Maggot Ghoul",
  description: [
    "On play: place a 0 power",
    "maggot on top of",
    "opponents deck.",
  ],
  type: "CREATURE",
  power: 2,
  keywords: [],
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "maggotghoul.onPlay");
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
  faction: FACTIONS.DOMINION,
  triggers: {},
};
