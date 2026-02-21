import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { GAME_LOGIC_ERROR } from "../communication.ts";
import { fieldCreatureCardToCreatureCard, type GameState } from "../game.ts";
import { brand, gameLogicErrorLog, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const nightblade: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_nightblade"),
  name: "Nightblade",
  description: ["On play: Return an", "enemy creature to its", "owner's hand."],
  cost: 6,
  type: "CREATURE",
  power: 4,
  keywords: [],
  triggers: {},
  faction: FACTIONS.NEUTRAL,
  onResourcePlay: null,
  onPlayTargetingCondition: (state, self) => {
    const owner = getOwner(
      state,
      self as UUID,
      "nightblade.onPlayTargetingCondition",
    );
    const opponent = getOpponent(state, owner.id);
    return opponent.field.length > 0;
  },
  onPlay: buildCardOnPlayTargeted((state, { initiator, target }) => {
    if (!target) {
      gameLogicErrorLog(
        GAME_LOGIC_ERROR.NO_TARGET_DEFINED,
        "nightblade.onPlay",
        initiator,
      );
      throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
    }
    const owner = getOwner(state, brand(target, "UUID"), "nightblade.onPlay");
    const targetCreature = owner.field.find(
      (creature) => creature.id === target,
    );
    if (!targetCreature) {
      gameLogicErrorLog(
        GAME_LOGIC_ERROR.CARD_NOT_FOUND,
        "nightblade.onPlay",
        initiator,
      );
      throw new Error(GAME_LOGIC_ERROR.CARD_NOT_FOUND);
    }

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          field: owner.field.filter((creature) => creature.id !== target),
          hand: [
            ...owner.hand,
            fieldCreatureCardToCreatureCard(targetCreature),
          ],
        },
      },
    };
    return [next, []];
  }),
};
