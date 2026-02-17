import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { GAME_LOGIC_ERROR } from "../communication.ts";
import { type GameState } from "../game.ts";
import { brand, gameLogicErrorLog, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayTargeted, getOwner } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const tundracat: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_tundracat"),
  name: "Tundra Cat",
  description: ["On play: Give an enemy", "creature -1."],
  cost: 1,
  type: "CREATURE",
  power: 1,
  keywords: [],
  triggers: {},
  onResourcePlay: null,
  faction: FACTIONS.ASTRALS,
  onPlayTargetingCondition: (state, self) => {
    const owner = getOwner(
      state,
      self as UUID,
      "tundracat.onPlayTargetingCondition",
    );
    const opponent = getOpponent(state, owner.id);
    return opponent.field.length > 0;
  },
  onPlay: buildCardOnPlayTargeted((state, { target, initiator }) => {
    if (!target) {
      gameLogicErrorLog(
        GAME_LOGIC_ERROR.NO_TARGET_DEFINED,
        "tundracat.onPlay",
        initiator,
      );
      throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
    }
    const owner = getOwner(state, brand(target, "UUID"), "tundracat.onPlay");

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          field: owner.field.map((creature) =>
            creature.id === target
              ? { ...creature, power: Math.max(creature.power - 1, 0) }
              : creature,
          ),
        },
      },
    };
    return [next, []];
  }),
};
