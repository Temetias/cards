import {
  cardDefinitionId,
  getCardDefinition,
  type CreatureCardDefintion,
} from "./index.ts";
import {
  type FieldCreatureCard,
  getObservers,
  type GameState,
} from "../game.ts";
import { buildCardOnPlayNonTargeted, getOwner } from "./helpers.ts";
import { brand, uuid, type UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import { getOpponent } from "../../client/utils/GameStateUtils.ts";
import { GAME_RULE } from "../constants.ts";
import { GAME_TRIGGER } from "../communication.ts";

export const maggotghoul: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_maggotghoul"),
  cost: 3,
  name: "Maggot Ghoul",
  description: ["On play: Summon two 0 power", "maggots for your opponent."],
  type: "CREATURE",
  power: 3,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "maggotghoul.onPlay");
    const maggot = getCardDefinition(
      brand("noncollectible_maggot", "CARD_DEFINITION_ID"),
    ) as CreatureCardDefintion;
    const maggotCard: FieldCreatureCard = {
      ...maggot,
      id: uuid(),
      attacked: true,
    };
    const maggotCard2: FieldCreatureCard = {
      ...maggot,
      id: uuid(),
      attacked: true,
    };

    const opponent = getOpponent(state, owner.id);
    // Field max size check
    let summonedMaggots: FieldCreatureCard[] = [];
    if (opponent.field.length <= GAME_RULE.MAX_FIELD_SIZE - 2) {
      summonedMaggots = [maggotCard, maggotCard2];
    } else if (opponent.field.length === GAME_RULE.MAX_FIELD_SIZE - 1) {
      summonedMaggots = [maggotCard];
    } else {
      summonedMaggots = [];
    }
    if (summonedMaggots.length === 0) return [state, []];

    const triggeredEffects = summonedMaggots.flatMap((maggot) =>
      getObservers(state, GAME_TRIGGER.CREATURE_SUMMONED).map(
        ({ getDispatch, self: dispatchSelf }) =>
          getDispatch({
            effectName: GAME_TRIGGER.CREATURE_SUMMONED,
            initiator: self,
            self: dispatchSelf,
            target: maggot.id,
          }),
      ),
    );

    const next: GameState = {
      ...state,
      cardPool: [...state.cardPool, ...summonedMaggots],
      players: {
        ...state.players,
        [opponent.id]: {
          ...opponent,
          field: [...opponent.field, ...summonedMaggots],
        },
      },
    };
    return [next, triggeredEffects];
  }),
  faction: FACTIONS.DOMINION,
  triggers: {},
};
