import {
  GAME_CONDITION_FAIL,
  GAME_LOGIC_FAIL,
  GAME_TRIGGER,
} from "../match.ts";
import { SpellCard } from "./types.ts";

const POWER = 30;

export const fireLash: SpellCard = {
  type: "spell",
  name: "Fire Lash",
  cost: 3,
  playEffect: (state, player, _origin, _rng, target) => {
    if (!target) return { state, triggers: [] };
    const targetFieldCard = [
      ...state.player1.field,
      ...state.player2.field,
    ].find((c) => c.id === target);
    const targetProtection = [
      ...state.player1.protection,
      ...state.player2.protection,
    ].find((c) => c.id === target);
    if (!targetProtection && !targetFieldCard) {
      throw new Error(GAME_LOGIC_FAIL.TARGET_NOT_FOUND);
    }
    const targetPlayer = [
      ...state.player1.field,
      ...state.player1.protection,
    ].find((c) => c.id === target)
      ? "player1"
      : "player2";
    if (targetProtection) {
      return {
        state: {
          ...state,
          [targetPlayer]: {
            ...state[player],
            protection: state[player].protection.filter(
              (card) => card.id !== targetProtection.id
            ),
            hand: [...state[player].graveyard, targetProtection],
          },
        },
        triggers: [
          {
            origin: target,
            self: target,
            trigger: GAME_TRIGGER.PROTECTION_DESTROYED,
            player: targetPlayer,
          },
        ],
      };
    } else {
      if (targetFieldCard.power > POWER) {
        throw new Error(GAME_CONDITION_FAIL.NOT_ENOUGH_POWER);
      }
      return {
        state: {
          ...state,
          [targetPlayer]: {
            ...state[targetPlayer],
            field: state[targetPlayer].field.filter(
              (card) => card.id !== target
            ),
            graveyard: [...state[targetPlayer].graveyard, targetFieldCard],
          },
        },
        triggers: [
          {
            origin: target,
            self: target,
            trigger: GAME_TRIGGER.CARD_DIED,
            player: targetPlayer,
          },
        ],
      };
    }
  },
  description: `Deal ${POWER}`,
};
