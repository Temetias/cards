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

export const squirrel: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_squirrel"),
  cost: 1,
  name: "Squirrel",
  description: [
    "On play: If you control",
    "a squirrel summon two",
    "1 power squirrels.",
  ],
  type: "CREATURE",
  power: 1,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "squirrel.onPlay");
    const squirrelsOnField = owner.field.filter(
      (c) =>
        getCardDefinition(c.definitionId).definitionId ===
          cardDefinitionId("collectible_squirrel") && c.id !== self,
    );
    if (squirrelsOnField.length === 0) {
      return [state, []];
    }
    if (owner.field.length >= GAME_RULE.MAX_FIELD_SIZE) {
      return [state, []];
    }
    const squirrelDefinition = getCardDefinition(
      brand("collectible_squirrel", "CARD_DEFINITION_ID"),
    ) as CreatureCardDefintion;
    const squirrelCard1: FieldCreatureCard = {
      ...squirrelDefinition,
      id: uuid(),
      attacked: true,
    };
    const squirrelCard2: FieldCreatureCard = {
      ...squirrelDefinition,
      id: uuid(),
      attacked: true,
    };

    let summonedSquirrels: FieldCreatureCard[] = [];
    if (owner.field.length <= GAME_RULE.MAX_FIELD_SIZE - 3) {
      summonedSquirrels = [squirrelCard1, squirrelCard2];
    } else if (owner.field.length === GAME_RULE.MAX_FIELD_SIZE - 2) {
      summonedSquirrels = [squirrelCard1];
    } else {
      summonedSquirrels = [];
    }
    if (summonedSquirrels.length === 0) return [state, []];

    const triggeredEffects = summonedSquirrels.flatMap((squirrel) =>
      getObservers(state, GAME_TRIGGER.CREATURE_SUMMONED).map(
        ({ getDispatch, self: dispatchSelf }) =>
          getDispatch({
            effectName: GAME_TRIGGER.CREATURE_SUMMONED,
            initiator: self,
            self: dispatchSelf,
            target: squirrel.id,
          }),
      ),
    );

    const next: GameState = {
      ...state,
      cardPool: [...state.cardPool, ...summonedSquirrels],
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          field: [...owner.field, ...summonedSquirrels],
        },
      },
    };

    return [next, triggeredEffects];
  }),
  triggers: {},
  faction: FACTIONS.NEUTRAL,
};
