import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { GAME_TRIGGER } from "../communication.ts";
import { getObservers } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const peskyimp: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_peskyimp"),
  cost: 1,
  name: "Pesky Imp",
  description: [
    "On play: Discard the",
    "top card from",
    "your opponent's deck.",
  ],
  type: "CREATURE",
  faction: FACTIONS.DOMINION,
  power: 1,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self: impSelf }) => {
    const owner = getOwner(state, impSelf as UUID, "peskyimp.onPlay");
    const opponent = getOpponent(state, owner.id);
    if (opponent.deck.length === 0) return [state, []];
    const discarded = opponent.deck[0];

    const discardEffects = getObservers(state, GAME_TRIGGER.DISCARD).map(
      ({ getDispatch, self }) =>
        getDispatch({
          effectName: GAME_TRIGGER.DISCARD,
          initiator: impSelf,
          self,
          target: discarded.id,
        }),
    );

    const next = {
      ...state,
      players: {
        ...state.players,
        [opponent.id]: {
          ...opponent,
          deck: opponent.deck.filter((c) => c.id !== discarded.id),
          discard: [...opponent.discard, discarded],
        },
      },
    };
    return [next, discardEffects];
  }),
  triggers: {},
};
