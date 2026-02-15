import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { GAME_TRIGGER } from "../communication.ts";
import { getObservers, type GameState } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const psalmofnecromancy: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_psalmofnecromancy"),
  name: "Psalm of Necromancy",
  description: [
    "Draw a card from both of your",
    "and your opponent's",
    "graveyards.",
  ],
  cost: 2,
  type: "SPELL",
  faction: FACTIONS.DOMINION,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self, initiator }) => {
    const owner = getOwner(state, self as UUID, "psalmofnecromancy.onPlay");
    const opponent = getOpponent(state, owner.id);

    const ownerGraveyardCard = owner.graveyard[0];
    const opponentGraveyardCard = opponent.graveyard[0];

    const actualDrawn = [ownerGraveyardCard, opponentGraveyardCard].filter(
      Boolean,
    );

    const triggeredEffects = actualDrawn.flatMap((card) =>
      getObservers(state, GAME_TRIGGER.CARD_DRAWN).map(
        ({ getDispatch, self: dispatchSelf }) =>
          getDispatch({
            initiator,
            self: dispatchSelf,
            effectName: GAME_TRIGGER.CARD_DRAWN,
            target: card.id,
          }),
      ),
    );

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          hand: [...owner.hand, ...actualDrawn],
          graveyard: owner.graveyard.filter(
            (c) => c.id !== ownerGraveyardCard?.id,
          ),
        },
        [opponent.id]: {
          ...opponent,
          graveyard: opponent.graveyard.filter(
            (c) => c.id !== opponentGraveyardCard?.id,
          ),
        },
      },
    };
    return [next, triggeredEffects];
  }),
};
