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

export const junglesnake: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_junglesnake"),
  cost: 1,
  name: "Jungle Snake",
  description: ["On play: Summon another", "Jungle Snake."],
  type: "CREATURE",
  power: 1,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "junglesnake.onPlay");
    if (owner.field.length >= GAME_RULE.MAX_FIELD_SIZE) {
      return [state, []];
    }
    const jungleSnake = getCardDefinition(
      brand("collectible_junglesnake", "CARD_DEFINITION_ID"),
    ) as CreatureCardDefintion;
    const jungleSnakeCard: FieldCreatureCard = {
      ...jungleSnake,
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
        target: jungleSnakeCard.id,
      }),
    );

    const next: GameState = {
      ...state,
      cardPool: [...state.cardPool, jungleSnakeCard],
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          field: [...owner.field, jungleSnakeCard],
        },
      },
    };
    return [next, triggeredEffects];
  }),
  triggers: {},
  faction: FACTIONS.NEUTRAL,
};
