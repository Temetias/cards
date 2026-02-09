import { GAME_TRIGGER } from "../communication.ts";
import { GAME_RULE } from "../constants.ts";
import {
  getObservers,
  type FieldCreatureCard,
  type GameState,
} from "../game.ts";
import { brand, uuid, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import {
  cardDefinitionId,
  getCardDefinition,
  type CreatureCardDefintion,
} from "./index.ts";

export const stablemaster: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_stablemaster"),
  cost: 5,
  name: "Stablemaster",
  description: ["On play: Summon a", "2 power white wolf."],
  type: "CREATURE",
  power: 4,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "stablemaster.onPlay");
    if (owner.field.length >= GAME_RULE.MAX_FIELD_SIZE) {
      return [state, []];
    }
    const whitewolf = getCardDefinition(
      brand("noncollectible_whitewolf", "CARD_DEFINITION_ID"),
    ) as CreatureCardDefintion;
    const whitewolfCard: FieldCreatureCard = {
      ...whitewolf,
      id: uuid(),
      attacked: true,
    };
    const triggeredEffects = getObservers(
      state,
      GAME_TRIGGER.CREATURE_SUMMONED,
    ).map(({ getDispatch, self: dispatchSelf }) =>
      getDispatch({
        effectName: GAME_TRIGGER.CREATURE_SUMMONED,
        initiator: self,
        self: dispatchSelf,
        target: whitewolfCard.id,
      }),
    );

    const next: GameState = {
      ...state,
      cardPool: [...state.cardPool, whitewolfCard],
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          field: [...owner.field, whitewolfCard],
        },
      },
    };
    return [next, triggeredEffects];
  }),
  triggers: {},
  faction: FACTIONS.NEUTRAL,
};
