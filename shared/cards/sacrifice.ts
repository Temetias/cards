import { GAME_TRIGGER } from "../communication.ts";
import { type GameState, getObservers } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const sacrifice: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_sacrifice"),
  name: "Sacrifice",
  description: ["Draw a card from your", "protection."],
  cost: 0,
  type: "SPELL",
  faction: FACTIONS.DOMINION,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self, initiator }) => {
    const owner = getOwner(state, self as UUID, "sacrifice.onPlay");
    if (owner.protection.length === 0) return [state, []];
    const cardToDraw = owner.protection[0];

    const triggeredDrawEffects = getObservers(
      state,
      GAME_TRIGGER.CARD_DRAWN,
    ).map(({ getDispatch, self: dispatchSelf }) =>
      getDispatch({
        initiator,
        self: dispatchSelf,
        effectName: GAME_TRIGGER.CARD_DRAWN,
        target: cardToDraw.id,
      }),
    );

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          protection: owner.protection.filter((c) => c.id !== cardToDraw.id),
          hand: [...owner.hand, cardToDraw],
        },
      },
    };
    return [next, triggeredDrawEffects];
  }),
};
