import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { GAME_LOGIC_ERROR } from "../communication.ts";
import { type GameState } from "../game.ts";
import { brand, gameLogicErrorLog, uuid, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayTargeted, getOwner } from "./helpers.ts";
import {
  cardDefinitionId,
  getCardDefinition,
  type CreatureCardDefintion,
} from "./index.ts";

export const masterfulsculptor: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_masterfulsculptor"),
  name: "Masterful Sculptor",
  description: [
    "On play: Choose an enemy",
    "creature. Put a copy",
    "of it into your hand.",
  ],
  cost: 5,
  type: "CREATURE",
  power: 3,
  keywords: [],
  triggers: {},
  faction: FACTIONS.NEUTRAL,
  onResourcePlay: null,
  onPlayTargetingCondition: (state, self) => {
    const owner = getOwner(
      state,
      self as UUID,
      "masterfulSculptor.onPlayTargetingCondition",
    );
    const opponent = getOpponent(state, owner.id);
    return opponent.field.length > 0;
  },
  onPlay: buildCardOnPlayTargeted((state, { initiator, target, self }) => {
    if (!target) {
      gameLogicErrorLog(
        GAME_LOGIC_ERROR.NO_TARGET_DEFINED,
        "masterfulSculptor.onPlay",
        initiator,
      );
      throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
    }
    const owner = getOwner(
      state,
      brand(self, "UUID"),
      "masterfulSculptor.onPlay",
    );
    const opponent = getOpponent(state, owner.id);
    const targetedCreature = opponent.field.find(
      (creature) => creature.id === target,
    );
    if (!targetedCreature) {
      gameLogicErrorLog(
        GAME_LOGIC_ERROR.CARD_NOT_FOUND,
        "masterfulSculptor.onPlay",
        initiator,
      );
      throw new Error(GAME_LOGIC_ERROR.CARD_NOT_FOUND);
    }
    const clone = {
      ...getCardDefinition(targetedCreature.definitionId),
      id: brand(uuid(), "UUID"),
    };

    const next: GameState = {
      ...state,
      cardPool: [...state.cardPool, clone],
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          hand: [...owner.hand, clone],
        },
      },
    };
    return [next, []];
  }),
};
