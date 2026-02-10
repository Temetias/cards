import { GAME_LOGIC_ERROR, GAME_TRIGGER } from "../communication.ts";
import {
  fieldCreatureCardToCreatureCard,
  type GameState,
  getInactivePlayer,
  getObservers,
} from "../game.ts";
import { brand, gameLogicErrorLog } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import {
  buildCardOnPlayNonTargeted,
  buildCardOnPlayTargeted,
  getOwner,
} from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const firelash: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_firelash"),
  name: "Fire Lash",
  description: ["Destroy an enemy creature."],
  cost: 3,
  type: "SPELL",
  keywords: [],
  faction: FACTIONS.WORLDFORGED,
  onResourcePlay: null,
  onPlay: buildCardOnPlayTargeted((state, { initiator, target }) => {
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
    const owner = getOwner(state, brand(target, "UUID"), "firelash.onPlay");

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
