import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { GAME_TRIGGER } from "../communication.ts";
import { GAME_RULE } from "../constants.ts";
import { type GameState, getObservers } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const meteor: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_meteor"),
  name: "Meteor",
  description: ["Destroy 1 enemy protection."],
  cost: 4,
  type: "SPELL",
  faction: FACTIONS.WORLDFORGED,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "meteor.onPlay");
    const opponent = getOpponent(state, owner.id);
    if (opponent.protection.length === 0) {
      return [state, []];
    }
    const protectionToDestroy = opponent.protection[0];

    const triggeredEffects = getObservers(
      state,
      GAME_TRIGGER.PROTECTION_DESTROYED,
    ).map(({ getDispatch, self: dispatchSelf }) =>
      getDispatch({
        effectName: GAME_TRIGGER.PROTECTION_DESTROYED,
        initiator: protectionToDestroy.id,
        self: dispatchSelf,
      }),
    );

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [opponent.id]: {
          ...opponent,
          protection: opponent.protection.filter(
            (c) => c.id !== protectionToDestroy.id,
          ),
        },
      },
    };
    return [next, triggeredEffects];
  }),
};
