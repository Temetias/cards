import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { GAME_LOGIC_ERROR, GAME_TRIGGER } from "../communication.ts";
import {
  cardToResourceCard,
  fieldCreatureCardToCreatureCard,
  getObservers,
  type GameState,
} from "../game.ts";
import { gameLogicErrorLog, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const ravenousbear: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_ravenousbear"),
  cost: 5,
  name: "Ravenous Bear",
  description: [
    "On play: Place a card from",
    "opponent's field into",
    "your resource.",
  ],
  type: "CREATURE",
  power: 2,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayTargeted(
    (state, { initiator, self: ravenousbearSelf, target }) => {
      if (!target) {
        gameLogicErrorLog(
          GAME_LOGIC_ERROR.NO_TARGET_DEFINED,
          "ravenousbear.onPlay",
          initiator,
        );
        throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
      }
      const owner = getOwner(
        state,
        ravenousbearSelf as UUID,
        "ravenousbear.onPlay",
      );
      const opponent = getOpponent(state, owner.id);
      const cardToResource = opponent.field.find(
        (creature) => creature.id === target,
      );
      if (!cardToResource) {
        gameLogicErrorLog(
          GAME_LOGIC_ERROR.CARD_NOT_FOUND,
          "ravenousbear.onPlay",
          initiator,
        );
        throw new Error(GAME_LOGIC_ERROR.CARD_NOT_FOUND);
      }

      const resourceEffects = getObservers(
        state,
        GAME_TRIGGER.RESOURCE_GAINED,
      ).map(({ getDispatch, self }) =>
        getDispatch({
          effectName: GAME_TRIGGER.RESOURCE_GAINED,
          initiator: ravenousbearSelf,
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
            resource: [
              ...owner.resource,
              cardToResourceCard(
                fieldCreatureCardToCreatureCard(cardToResource),
              ),
            ],
          },
          [opponent.id]: {
            ...opponent,
            field: opponent.field.filter((c) => c.id !== cardToResource.id),
          },
        },
      };
      return [next, resourceEffects];
    },
  ),
  triggers: {},
  faction: FACTIONS.THORNBOUND,
};
