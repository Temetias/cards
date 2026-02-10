import { GAME_TRIGGER } from "../communication.ts";
import { type GameState, getObservers } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const photosynthesis: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_photosynthesis"),
  name: "Photosynthesis",
  description: [
    "Draw a card from the bottom of",
    "your resource. You're allowed",
    "to play resource again.",
  ],
  cost: 0,
  type: "SPELL",
  faction: FACTIONS.THORNBOUND,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self, initiator }) => {
    const owner = getOwner(state, self as UUID, "photosynthesis.onPlay");
    if (owner.resource.length === 0) return [state, []];
    const cardToDraw = owner.resource[0];

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
          resource: owner.resource.filter((c) => c.id !== cardToDraw.id),
          hand: [...owner.hand, cardToDraw],
          hasPlayedResource: false,
        },
      },
    };
    return [next, triggeredDrawEffects];
  }),
};
