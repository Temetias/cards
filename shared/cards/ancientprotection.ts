import { GAME_TRIGGER } from "../communication.ts";
import { GAME_RULE } from "../constants.ts";
import { type GameState, getObservers } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const ancientprotection: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_ancientprotection"),
  name: "Ancient Protection",
  description: ["Move the top card of your deck", "to your protection"],
  cost: 2,
  type: "SPELL",
  faction: FACTIONS.ASTRALS,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "ancientprotection.onPlay");
    if (
      owner.protection.length >= GAME_RULE.PROTECTION_MAX_SIZE ||
      owner.deck.length === 0
    ) {
      return [state, []];
    }
    const cardToMove = owner.deck[0];
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          deck: owner.deck.filter((c) => c.id !== cardToMove.id),
          protection: [...owner.protection, cardToMove],
        },
      },
    };
    return [next, []];
  }),
};
