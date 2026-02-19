import { GAME_TRIGGER } from "../communication.ts";
import {
  fieldCreatureCardToCreatureCard,
  type GameState,
  getActivePlayer,
  getInactivePlayer,
  getObservers,
  resourceCardToCard,
} from "../game.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted } from "./helpers.ts";
import {
  type Card,
  cardDefinitionId,
  type CreatureCard,
  type SpellCardDefintion,
} from "./index.ts";

export const maggotbomb: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_maggotbomb"),
  name: "Maggotbomb",
  description: [
    "Destroy maggots everywhere.",
    "They destroy adjacent",
    "creatures in field and",
    "discard adjacent cards",
    "in hand.",
  ],
  cost: 4,
  type: "SPELL",
  faction: FACTIONS.DOMINION,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self: bombSelf }) => {
    const opponent = getInactivePlayer(state);
    const player = getActivePlayer(state);
    const playerFieldMaggots = player.field.filter(
      (c) => c.definitionId === "noncollectible_maggot",
    );
    const opponentFieldMaggots = opponent.field.filter(
      (c) => c.definitionId === "noncollectible_maggot",
    );
    const playerHandMaggots = player.hand.filter(
      (c) => c.definitionId === "noncollectible_maggot",
    );
    const opponentHandMaggots = opponent.hand.filter(
      (c) => c.definitionId === "noncollectible_maggot",
    );
    const playerResourceMaggots = player.resource.filter(
      (c) => c.definitionId === "noncollectible_maggot",
    );
    const opponentResourceMaggots = opponent.resource.filter(
      (c) => c.definitionId === "noncollectible_maggot",
    );
    const opponentDiscards: Card[] = [
      ...opponentHandMaggots,
      ...opponentResourceMaggots.map(resourceCardToCard),
    ];
    const playerDiscards: Card[] = [
      ...playerHandMaggots,
      ...playerResourceMaggots.map(resourceCardToCard),
    ];
    const opponentDyingCreatures: CreatureCard[] = [
      ...opponentFieldMaggots.map(fieldCreatureCardToCreatureCard),
    ];
    const playerDyingCreatures: CreatureCard[] = [
      ...playerFieldMaggots.map(fieldCreatureCardToCreatureCard),
    ];
    opponentFieldMaggots.forEach((maggot) => {
      const index = opponent.field.findIndex((c) => c.id === maggot.id);
      const leftAdjacent = opponent.field[index - 1];
      const rightAdjacent = opponent.field[index + 1];
      if (leftAdjacent) {
        opponentDyingCreatures.push(
          fieldCreatureCardToCreatureCard(leftAdjacent),
        );
      }
      if (rightAdjacent) {
        opponentDyingCreatures.push(
          fieldCreatureCardToCreatureCard(rightAdjacent),
        );
      }
    });
    playerFieldMaggots.forEach((maggot) => {
      const index = player.field.findIndex((c) => c.id === maggot.id);
      const leftAdjacent = player.field[index - 1];
      const rightAdjacent = player.field[index + 1];
      if (leftAdjacent) {
        playerDyingCreatures.push(
          fieldCreatureCardToCreatureCard(leftAdjacent),
        );
      }
      if (rightAdjacent) {
        playerDyingCreatures.push(
          fieldCreatureCardToCreatureCard(rightAdjacent),
        );
      }
    });
    opponentHandMaggots.forEach((maggot) => {
      const index = opponent.hand.findIndex((c) => c.id === maggot.id);
      const leftAdjacent = opponent.hand[index - 1];
      const rightAdjacent = opponent.hand[index + 1];
      if (leftAdjacent) {
        opponentDiscards.push(leftAdjacent);
      }
      if (rightAdjacent) {
        opponentDiscards.push(rightAdjacent);
      }
    });
    playerHandMaggots.forEach((maggot) => {
      const index = player.hand.findIndex((c) => c.id === maggot.id);
      const leftAdjacent = player.hand[index - 1];
      const rightAdjacent = player.hand[index + 1];
      if (leftAdjacent) {
        playerDiscards.push(leftAdjacent);
      }
      if (rightAdjacent) {
        playerDiscards.push(rightAdjacent);
      }
    });
    const deathEffects = [
      ...opponentDyingCreatures,
      ...playerDyingCreatures,
    ].flatMap(() =>
      getObservers(state, GAME_TRIGGER.CREATURE_DIED).map(
        ({ getDispatch, self }) =>
          getDispatch({
            effectName: GAME_TRIGGER.CREATURE_DIED,
            initiator: self,
            self,
          }),
      ),
    );
    const discardEffects = [...opponentDiscards, ...playerDiscards].flatMap(
      (card) =>
        getObservers(state, GAME_TRIGGER.DISCARD).map(({ getDispatch, self }) =>
          getDispatch({
            effectName: GAME_TRIGGER.DISCARD,
            initiator: bombSelf,
            self,
            target: card.id,
          }),
        ),
    );
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [opponent.id]: {
          ...opponent,
          field: opponent.field.filter((c) =>
            opponentDyingCreatures.every((dc) => dc.id !== c.id),
          ),
          hand: opponent.hand.filter((c) =>
            opponentDiscards.every((dc) => dc.id !== c.id),
          ),
          discard: [...opponent.discard, ...opponentDiscards],
          graveyard: [...opponent.graveyard, ...opponentDyingCreatures],
        },
        [player.id]: {
          ...player,
          field: player.field.filter((c) =>
            playerDyingCreatures.every((dc) => dc.id !== c.id),
          ),
          hand: player.hand.filter((c) =>
            playerDiscards.every((dc) => dc.id !== c.id),
          ),
          discard: [...player.discard, ...playerDiscards],
          graveyard: [...player.graveyard, ...playerDyingCreatures],
        },
      },
    };
    return [next, [...deathEffects, ...discardEffects]];
  }),
};
