import { GAME_TRIGGER } from "../communication.ts";
import { type GameState, getObservers, resourceCardToCard } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const maggot: CreatureCardDefintion = {
  definitionId: cardDefinitionId("noncollectible_maggot"),
  cost: 2,
  name: "Maggot",
  description: ["On resource play: Discards", "the top card of resource."],
  type: "CREATURE",
  power: 0,
  keywords: [],
  onPlay: null,
  onResourcePlay: buildCardOnPlayNonTargeted((state, { self, target }) => {
    if (target !== self) return [state, []];
    const owner = getOwner(state, self as UUID, "maggot.onResourcePlay");
    const myIndexInResource = owner.resource.findIndex((c) => c.id === self);
    if (myIndexInResource === -1) return [state, []];
    const cardToDiscard = owner.resource[myIndexInResource - 1];
    if (!cardToDiscard) return [state, []];
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          resource: owner.resource.filter((c) => c.id !== cardToDiscard.id),
          discard: [...owner.discard, resourceCardToCard(cardToDiscard)],
        },
      },
    };
    const discardEffects = getObservers(state, GAME_TRIGGER.DISCARD).map(
      ({ getDispatch, self: dispatchSelf }) =>
        getDispatch({
          effectName: GAME_TRIGGER.DISCARD,
          initiator: self,
          self: dispatchSelf,
          target: cardToDiscard.id,
        }),
    );
    return [next, discardEffects];
  }),
  triggers: {},
  faction: FACTIONS.DOMINION,
};
