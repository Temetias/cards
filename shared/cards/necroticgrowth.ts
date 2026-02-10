import { GAME_TRIGGER } from "../communication.ts";
import { GAME_RULE } from "../constants.ts";
import { type GameState, getObservers, resourceCardToCard } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const necroticgrowth: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_necroticgrowth"),
  name: "Necrotic Growth",
  description: [
    "Draw all cards from your",
    "resource into your hand.",
    "They cost 0",
  ],
  cost: 7,
  type: "SPELL",
  faction: FACTIONS.THORNBOUND,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self, initiator }) => {
    const owner = getOwner(state, self as UUID, "necroticgrowth.onPlay");
    const attemptedDrawn = owner.resource;
    const nextHand = [...owner.hand, ...attemptedDrawn].slice(
      0,
      GAME_RULE.MAX_HAND_SIZE,
    );
    const discarded = [...owner.hand, ...attemptedDrawn].slice(
      GAME_RULE.MAX_HAND_SIZE,
    );
    const actuallyDrawn = attemptedDrawn.slice(
      0,
      nextHand.length - owner.hand.length,
    );

    const triggeredDiscardEffects = discarded.flatMap((card) =>
      getObservers(state, GAME_TRIGGER.DISCARD).map(({ getDispatch, self }) =>
        getDispatch({
          effectName: GAME_TRIGGER.DISCARD,
          initiator,
          self,
          target: card.id,
        }),
      ),
    );

    const triggeredDrawEffects = actuallyDrawn.flatMap((card) =>
      getObservers(state, GAME_TRIGGER.CARD_DRAWN).map(
        ({ getDispatch, self }) =>
          getDispatch({
            initiator,
            self,
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
          hand: [
            ...owner.hand,
            ...actuallyDrawn
              .map(resourceCardToCard)
              .map((card) => ({ ...card, cost: 0 })),
          ],
          resource: [],
          // Technically discarded cards should be converted in case but discarded cards are never seen again so it doesn't matter
          discard: [...owner.discard, ...discarded],
        },
      },
    };
    return [next, [...triggeredDrawEffects, ...triggeredDiscardEffects]];
  }),
};
