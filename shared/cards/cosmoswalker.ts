import { GAME_LOGIC_ERROR, GAME_TRIGGER } from "../communication.ts";
import { type GameState, getObservers } from "../game.ts";
import { buildCardOnPlayTargeted } from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const cosmosWalker: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_cosmoswalker"),
  name: "Cosmos Walker",
  description: ["Destroy a creature"],
  cost: 5,
  type: "CREATURE",
  power: 3,
  keywords: [],
  triggers: {},
  onPlay: buildCardOnPlayTargeted((state, { initiator, target }) => {
    const deathEffects = getObservers(state, GAME_TRIGGER.CREATURE_DIED).map(
      ({ getDispatch, self }) =>
        getDispatch({
          effectName: GAME_TRIGGER.CREATURE_DIED,
          initiator,
          self,
          target,
        }),
    );
    const owner = Object.values(state.players).find((player) =>
      player.field.some((creature) => creature.id === target),
    );
    if (!owner) throw new Error(GAME_LOGIC_ERROR.CARD_NOT_FOUND);

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          field: owner.field.filter((creature) => creature.id !== target),
          graveyard: [
            ...owner.graveyard,
            owner.field.find((creature) => creature.id === target)!,
          ],
        },
      },
    };
    return [next, deathEffects];
  }),
};
