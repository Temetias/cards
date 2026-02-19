import { GAME_RULE } from "../constants.ts";
import { getObservers, type GameState } from "../game.ts";
import { type UUID } from "../utils.ts";
import { GAME_TRIGGER } from "../communication.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const graverobber: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_graverobber"),
  cost: 4,
  name: "Graverobber",
  description: ["On play: #revive 1"],
  type: "CREATURE",
  power: 2,
  keywords: [],
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "graverobber.onPlay");
    if (
      owner.graveyard.length === 0 ||
      owner.hand.length >= GAME_RULE.MAX_HAND_SIZE
    ) {
      return [state, []];
    }
    const cardToRevive = owner.graveyard[owner.graveyard.length - 1];

    const reviveEffects = getObservers(
      state,
      GAME_TRIGGER.CREATURE_REVIVED,
    ).map(({ getDispatch, self }) =>
      getDispatch({
        effectName: GAME_TRIGGER.CREATURE_REVIVED,
        initiator: self,
        self,
        target: cardToRevive.id,
      }),
    );

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          graveyard: owner.graveyard.filter((c) => c.id !== cardToRevive.id),
          hand: [...owner.hand, cardToRevive],
        },
      },
    };
    return [next, reviveEffects];
  }),
  onResourcePlay: null,
  triggers: {},
  faction: FACTIONS.NEUTRAL,
};
