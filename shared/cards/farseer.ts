import { GAME_LOGIC_ERROR } from "../communication.ts";
import { type GameState } from "../game.ts";
import { gameLogicErrorLog, type UUID } from "../utils.ts";
import {
  buildCardOnPlayNonTargeted,
  drawWithEffects,
  getOwner,
} from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const farseer: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_farseer"),
  name: "Farseer",
  description: ["Draw a card"],
  cost: 3,
  type: "CREATURE",
  power: 2,
  keywords: [],
  triggers: {},
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "farseer.onPlay");
    const [drawn, remaining, triggeredEffects] = drawWithEffects(
      owner.deck,
      1,
      state,
      self,
    );
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          hand: [...owner.hand, ...drawn],
          deck: remaining,
        },
      },
    };
    return [next, triggeredEffects];
  }),
};
