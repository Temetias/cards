import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import type { GameState } from "../game.ts";
import { type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const leechingbat: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_leechingbat"),
  cost: 2,
  name: "Leeching Bat",
  description: [
    "On play: Steal the leftmost card",
    "from your opponent's hand.",
  ],
  type: "CREATURE",
  power: 2,
  keywords: [],
  onPlay: buildCardOnPlayNonTargeted((state, { self: leechingbatSelf }) => {
    const owner = getOwner(
      state,
      leechingbatSelf as UUID,
      "leechingbat.onPlay",
    );
    const opponent = getOpponent(state, owner.id);
    if (opponent.hand.length === 0) return [state, []];
    const stolen = opponent.hand[0];

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          hand: [...owner.hand, stolen],
        },
        [opponent.id]: {
          ...opponent,
          hand: opponent.hand.filter((c) => c.id !== stolen.id),
          discard: [...opponent.discard],
        },
      },
    };
    return [next, []];
  }),
  triggers: {},
  faction: FACTIONS.DOMINION,
};
