import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { GAME_LOGIC_ERROR, GAME_TRIGGER } from "../communication.ts";
import {
  fieldCreatureCardToCreatureCard,
  type GameState,
  getObservers,
} from "../game.ts";
import { brand, gameLogicErrorLog, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const cosmosWalker: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_cosmoswalker"),
  name: "Cosmos Walker",
  description: ["On play: Destroy an", "enemy creature"],
  cost: 6,
  type: "CREATURE",
  power: 5,
  keywords: [],
  triggers: {},
  faction: FACTIONS.ASTRALS,
  onResourcePlay: null,
  onPlayTargetingCondition: (state, self) => {
    const owner = getOwner(
      state,
      self as UUID,
      "cosmosWalker.onPlayTargetingCondition",
    );
    const opponent = getOpponent(state, owner.id);
    return opponent.field.length > 0;
  },
  onPlay: buildCardOnPlayTargeted((state, { initiator, target }) => {
    if (!target) {
      gameLogicErrorLog(
        GAME_LOGIC_ERROR.NO_TARGET_DEFINED,
        "cosmosWalker.onPlay",
        initiator,
      );
      throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
    }
    const deathEffects = getObservers(state, GAME_TRIGGER.CREATURE_DIED).map(
      ({ getDispatch, self }) =>
        getDispatch({
          effectName: GAME_TRIGGER.CREATURE_DIED,
          initiator: self,
          self,
        }),
    );
    const owner = getOwner(state, brand(target, "UUID"), "cosmosWalker.onPlay");

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          field: owner.field.filter((creature) => creature.id !== target),
          graveyard: [
            ...owner.graveyard,
            fieldCreatureCardToCreatureCard(
              owner.field.find((creature) => creature.id === target)!,
            ),
          ],
        },
      },
    };
    return [next, deathEffects];
  }),
};
