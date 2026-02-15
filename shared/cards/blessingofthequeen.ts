import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { type GameState } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import {
  buildCardOnPlayNonTargeted,
  drawWithEffects,
  getOwner,
} from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const blessingofthequeen: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_blessingofthequeen"),
  name: "Blessing of the Queen",
  description: [
    "Draw a card. If you control a",
    "higher power creature than",
    "your opponent, draw 2 instead.",
  ],
  cost: 1,
  type: "SPELL",
  faction: FACTIONS.ASTRALS,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self, initiator }) => {
    const owner = getOwner(state, self as UUID, "blessingofthequeen.onPlay");
    const opponent = getOpponent(state, owner.id);
    const ownerHighestPower = Math.max(...owner.field.map((c) => c.power), 0);
    const opponentHighestPower = Math.max(
      ...opponent.field.map((c) => c.power),
      0,
    );
    const ownerHasHighestPowerCreature =
      ownerHighestPower > opponentHighestPower;
    const { deck, hand, discard, triggeredEffects } = drawWithEffects(
      owner.id,
      ownerHasHighestPowerCreature ? 2 : 1,
      state,
      initiator,
    );
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          deck,
          hand,
          discard,
        },
      },
    };
    return [next, triggeredEffects];
  }),
};
