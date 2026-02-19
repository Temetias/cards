import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { GAME_LOGIC_ERROR, GAME_TRIGGER } from "../communication.ts";
import {
  fieldCreatureCardToCreatureCard,
  type GameState,
  getObservers,
} from "../game.ts";
import { brand, gameLogicErrorLog, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import {
  buildCardOnPlayTargeted,
  drawWithEffects,
  getOwner,
} from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const firelash: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_firelash"),
  name: "Fire Lash",
  description: ["Destroy an enemy creature.", "Draw a card."],
  cost: 5,
  type: "SPELL",
  keywords: [],
  faction: FACTIONS.WORLDFORGED,
  onResourcePlay: null,
  onPlayTargetingCondition: (state, self) => {
    const owner = getOwner(
      state,
      self as UUID,
      "firelash.onPlayTargetingCondition",
    );
    const opponent = getOpponent(state, owner.id);
    return opponent.field.length > 0;
  },
  onPlay: buildCardOnPlayTargeted((state, { initiator, target, self }) => {
    if (!target) {
      gameLogicErrorLog(
        GAME_LOGIC_ERROR.NO_TARGET_DEFINED,
        "firelash.onPlay",
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
      "firelash.onPlay",
    );
    const firelashOwner = getOwner(state, self as UUID, "firelash.onPlay");
    const {
      hand,
      deck,
      discard,
      triggeredEffects: drawEffects,
    } = drawWithEffects(firelashOwner.id, 1, state, self);

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
        [firelashOwner.id]: {
          ...firelashOwner,
          hand,
          deck,
          discard,
        },
      },
    };
    return [next, [...deathEffects, ...drawEffects]];
  }),
};
