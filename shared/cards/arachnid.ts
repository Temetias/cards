import { GAME_TRIGGER } from "../communication.ts";
import { cardToResourceCard, getObservers, type GameState } from "../game.ts";
import { type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const arachnid: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_arachnid"),
  cost: 2,
  name: "Arachnid",
  description: [
    "On play: Place the top card",
    "from your graveyard",
    "into your resource.",
  ],
  type: "CREATURE",
  power: 2,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self: arachnidSelf }) => {
    const owner = getOwner(state, arachnidSelf as UUID, "arachnid.onPlay");
    if (owner.graveyard.length === 0) return [state, []];
    const cardToResource = owner.graveyard[owner.graveyard.length - 1];

    const resourceEffects = getObservers(
      state,
      GAME_TRIGGER.RESOURCE_GAINED,
    ).map(({ getDispatch, self }) =>
      getDispatch({
        effectName: GAME_TRIGGER.RESOURCE_GAINED,
        initiator: arachnidSelf,
        self,
        target: cardToResource.id,
      }),
    );

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          graveyard: owner.graveyard.filter((c) => c.id !== cardToResource.id),
          resource: [...owner.resource, cardToResourceCard(cardToResource)],
        },
      },
    };
    return [next, resourceEffects];
  }),
  triggers: {},
  faction: FACTIONS.THORNBOUND,
};
