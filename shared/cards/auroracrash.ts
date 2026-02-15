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
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const auroracrash: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_auroracrash"),
  name: "Aurora Crash",
  description: [
    "Destroy an enemy creature.",
    "Give your rightmost",
    "creature +1.",
  ],
  cost: 3,
  type: "SPELL",
  keywords: [],
  faction: FACTIONS.WORLDFORGED,
  onResourcePlay: null,
  onPlayTargetingCondition: (state, self) => {
    const owner = getOwner(
      state,
      self as UUID,
      "auroracrash.onPlayTargetingCondition",
    );
    const opponent = getOpponent(state, owner.id);
    return opponent.field.length > 0;
  },
  onPlay: buildCardOnPlayTargeted((state, { initiator, target, self }) => {
    if (!target) {
      gameLogicErrorLog(
        GAME_LOGIC_ERROR.NO_TARGET_DEFINED,
        "auroracrash.onPlay",
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
    const targetOwner = getOwner(
      state,
      brand(target, "UUID"),
      "auroracrash.onPlay",
    );
    const auroraCrashOwner = getOwner(
      state,
      self as UUID,
      "auroracrash.onPlay",
    );
    const creatureToBuff =
      auroraCrashOwner.field[auroraCrashOwner.field.length - 1];
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [targetOwner.id]: {
          ...targetOwner,
          field: targetOwner.field.filter((creature) => creature.id !== target),
          graveyard: [
            ...targetOwner.graveyard,
            fieldCreatureCardToCreatureCard(
              targetOwner.field.find((creature) => creature.id === target)!,
            ),
          ],
        },
        [auroraCrashOwner.id]: {
          ...auroraCrashOwner,
          field: auroraCrashOwner.field.map((creature) => ({
            ...creature,
            power:
              creature.id === creatureToBuff?.id
                ? creature.power + 1
                : creature.power,
          })),
        },
      },
    };
    return [next, deathEffects];
  }),
};
