import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { GAME_TRIGGER } from "../communication.ts";
import { getObservers, type GameState } from "../game.ts";
import { type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import {
  buildCardOnPlayNonTargeted,
  drawWithEffects,
  getOwner,
} from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const leechingbat: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_leechingbat"),
  cost: 2,
  name: "Leeching Bat",
  description: [
    "On play: Your opponent draws",
    "a card. They discard their",
    "leftmost card.",
  ],
  type: "CREATURE",
  power: 2,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "leechingbat.onPlay");
    const opponent = getOpponent(state, owner.id);
    const { hand, deck, discard, triggeredEffects } = drawWithEffects(
      opponent.id,
      1,
      state,
      self,
    );
    const discarded = hand[0];

    const discardEffects = getObservers(state, GAME_TRIGGER.DISCARD).map(
      ({ getDispatch, self: dispatchSelf }) =>
        getDispatch({
          effectName: GAME_TRIGGER.DISCARD,
          initiator: self,
          self: dispatchSelf,
          target: discarded.id,
        }),
    );

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [opponent.id]: {
          ...opponent,
          hand: hand.filter((c) => c.id !== discarded.id),
          discard: [...discard, discarded],
          deck,
        },
      },
    };
    return [next, [...triggeredEffects, ...discardEffects]];
  }),
  triggers: {},
  faction: FACTIONS.DOMINION,
};
