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
  name: "Pesky imp",
  description: ["On play: Discard the", "leftmost card from", "your opponent."],
  type: "CREATURE",
  faction: FACTIONS.DOMINION,
  power: 1,
  keywords: [],
  onPlay: buildCardOnPlayNonTargeted((state, { self: impSelf }) => {
    const owner = getOwner(state, impSelf as UUID, "peskyimp.onPlay");
    const opponent = getOpponent(state, owner.id);
    if (opponent.hand.length === 0) return [state, []];
    const discarded = opponent.hand[0];

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
          hand: opponent.hand.filter((c) => c.id !== discarded.id),
          discard: [...opponent.discard, discarded],
        },
      },
    };
    return [next, discardEffects];
  }),
  triggers: {},
};
