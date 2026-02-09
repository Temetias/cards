import { GAME_LOGIC_ERROR, GAME_TRIGGER } from "../communication.ts";
import { GAME_RULE } from "../constants.ts";
import {
  type FieldCreatureCard,
  type GameState,
  getObservers,
} from "../game.ts";
import { brand, uuid, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardTrigger, getOwner } from "./helpers.ts";
import {
  cardDefinitionId,
  getCardDefinition,
  type CreatureCardDefintion,
} from "./index.ts";

export const summoner: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_summoner"),
  name: "Summoner",
  description: [
    "Whenever a hostile creature",
    "creature dies, summon",
    "a Pesky Imp.",
  ],
  cost: 4,
  type: "CREATURE",
  power: 3,
  keywords: [],
  faction: FACTIONS.DOMINION,
  onResourcePlay: null,
  triggers: {
    CREATURE_DIED: buildCardTrigger((state, { initiator, self }) => {
      const owner = getOwner(state, self as UUID, "summoner.CREATURE_DIED");
      const deadCreatureOwner = getOwner(
        state,
        initiator as UUID,
        "summoner.CREATURE_DIED",
      );
      // Don't summon if the creature that died was mine
      if (deadCreatureOwner.id === owner.id) return null;
      if (owner.field.length >= GAME_RULE.MAX_FIELD_SIZE) {
        return null;
      }
      const imp = getCardDefinition(
        brand("collectible_peskyimp", "CARD_DEFINITION_ID"),
      ) as CreatureCardDefintion;
      const impCard: FieldCreatureCard = {
        ...imp,
        id: uuid(),
        attacked: true,
      };
      const next: GameState = {
        ...state,
        cardPool: [...state.cardPool, impCard],
        players: {
          ...state.players,
          [owner.id]: {
            ...owner,
            field: [...owner.field, impCard],
          },
        },
      };
      const triggeredEffects = getObservers(
        state,
        GAME_TRIGGER.CREATURE_SUMMONED,
      ).map(({ getDispatch, self: dispatchSelf }) =>
        getDispatch({
          effectName: GAME_TRIGGER.CREATURE_SUMMONED,
          initiator: self,
          self: dispatchSelf,
          target: impCard.id,
        }),
      );
      return [next, triggeredEffects];
    }),
  },
  onPlay: null,
};
