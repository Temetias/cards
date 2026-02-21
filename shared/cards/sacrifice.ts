import { GAME_TRIGGER } from "../communication.ts";
import { GAME_RULE } from "../constants.ts";
import { type GameState, getObservers } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import {
  buildCardOnPlayNonTargeted,
  drawWithEffects,
  getOwner,
} from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const sacrifice: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_sacrifice"),
  name: "Sacrifice",
  description: ["Draw a card from your", "protection. Draw a card."],
  cost: 0,
  type: "SPELL",
  faction: FACTIONS.DOMINION,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self, initiator }) => {
    const owner = getOwner(state, self as UUID, "sacrifice.onPlay");
    const protectionToDraw =
      owner.protection.length > 0 ? owner.protection[0] : null;

    const triggeredProtectionDrawEffects = protectionToDraw
      ? getObservers(state, GAME_TRIGGER.CARD_DRAWN).map(
          ({ getDispatch, self: dispatchSelf }) =>
            getDispatch({
              initiator,
              self: dispatchSelf,
              effectName: GAME_TRIGGER.CARD_DRAWN,
              target: protectionToDraw.id,
            }),
        )
      : [];

    const {
      deck,
      hand,
      discard,
      triggeredEffects: triggeredDrawEffects,
    } = drawWithEffects(owner.id, 1, state, initiator);

    const nextHand = [
      ...hand,
      ...(protectionToDraw ? [protectionToDraw] : []),
    ].slice(0, GAME_RULE.MAX_HAND_SIZE);

    const discarded = [
      ...(protectionToDraw ? [protectionToDraw] : []),
      ...hand,
    ].slice(GAME_RULE.MAX_HAND_SIZE);

    const triggeredDiscardEffects = discarded.flatMap((card) =>
      getObservers(state, GAME_TRIGGER.DISCARD).map(
        ({ getDispatch, self: dispatchSelf }) =>
          getDispatch({
            effectName: GAME_TRIGGER.DISCARD,
            initiator,
            self: dispatchSelf,
            target: card.id,
          }),
      ),
    );

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          protection: owner.protection.filter(
            (c) => c.id !== protectionToDraw?.id,
          ),
          hand: nextHand,
          deck,
          discard: [...discard, ...discarded],
        },
      },
    };
    return [
      next,
      [
        ...triggeredDrawEffects,
        ...triggeredProtectionDrawEffects,
        ...triggeredDiscardEffects,
      ],
    ];
  }),
};
