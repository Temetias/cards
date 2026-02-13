import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { type GameState } from "../game.ts";
import { type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import {
  cardDefinitionId,
  isCreature,
  type CreatureCardDefintion,
} from "./index.ts";

export const farseer: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_farseer"),
  name: "Farseer",
  description: [
    "On play: The top card of your",
    "deck gets +1, the top card of",
    "your opponent's deck gets -1.",
  ],
  cost: 5,
  type: "CREATURE",
  power: 4,
  keywords: [],
  triggers: {},
  faction: FACTIONS.ASTRALS,
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "farseer.onPlay");
    const opponent = getOpponent(state, owner.id);
    const opponentTopCard = opponent.deck[0];
    const transformedOpponentCard =
      opponentTopCard && isCreature(opponentTopCard)
        ? { ...opponentTopCard, power: Math.max(0, opponentTopCard.power - 1) }
        : opponentTopCard;
    const playerTopCard = owner.deck[0];
    const transformedPlayerCard =
      playerTopCard && isCreature(playerTopCard)
        ? { ...playerTopCard, power: playerTopCard.power + 1 }
        : playerTopCard;
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          deck: [
            ...(transformedPlayerCard ? [transformedPlayerCard] : []),
            ...owner.deck.slice(1),
          ],
        },
        [opponent.id]: {
          ...opponent,
          deck: [
            ...(transformedOpponentCard ? [transformedOpponentCard] : []),
            ...opponent.deck.slice(1),
          ],
        },
      },
    };
    return [next, []];
  }),
};
